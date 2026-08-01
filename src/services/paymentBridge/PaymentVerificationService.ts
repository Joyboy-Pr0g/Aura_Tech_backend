import { delay, inject, injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { getRedisClient } from '../../config/redis';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IPaymentBridgeRepository } from '../../interfaces/repositories/IPaymentBridgeRepository';
import { IPaymentRepository } from '../../interfaces/repositories/IPaymentRepository';
import { IOrderRepository } from '../../interfaces/repositories/IOrderRepository';
import { PaymentSmsParserService, ParsedPaymentSms } from './PaymentSmsParserService';
import { PaymentService } from '../payment/PaymentService';
import { WebsiteSettingsService } from '../websiteSettings/WebsiteSettingsService';
import { NotificationService } from '../notification/NotificationService';
import { notificationMessages } from '../../i18n/notification-messages';
import { convertSarToYer, normalizeAccountNumber } from '../../utils/convertSarToYer';
import { paymentVerifyDebug } from '../../utils/paymentVerifyDebug';
import { PaymentProvider } from '../../models/PaymentProvider';
import { PaymentSmsEvent } from '../../models/PaymentSmsEvent';

export interface PendingVerification {
  orderId: string;
  paymentId: string;
  account: string;
  amountYer: number;
  createdAt: string;
}

const DEFAULT_TTL_SEC = 3600;

@injectable()
export class PaymentVerificationService {
  constructor(
    @inject(REPOSITORY_TOKENS.IPaymentBridgeRepository)
    private paymentBridgeRepo: IPaymentBridgeRepository,
    @inject(REPOSITORY_TOKENS.IPaymentRepository)
    private paymentRepo: IPaymentRepository,
    @inject(REPOSITORY_TOKENS.IOrderRepository)
    private orderRepo: IOrderRepository,
    @inject(PaymentSmsParserService)
    private parserService: PaymentSmsParserService,
    @inject(WebsiteSettingsService)
    private websiteSettingsService: WebsiteSettingsService,
    @inject(NotificationService)
    private notificationService: NotificationService,
    @inject(delay(() => PaymentService))
    private paymentService: PaymentService,
  ) {}

  private get ttlSec(): number {
    const raw = Number(process.env.PAYMENT_VERIFY_TTL_SEC ?? DEFAULT_TTL_SEC);
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_SEC;
  }

  async resolveExpectedAmountYer(orderTotalSar: number): Promise<number> {
    const settings = await this.websiteSettingsService.getSettings();
    const rate = settings.sar_to_yer;
    if (rate == null || Number(rate) <= 0) {
      throw new Error('Exchange rate is not configured. Please contact support.');
    }
    return convertSarToYer(orderTotalSar, rate);
  }

  async registerPendingVerification(input: {
    orderId: string;
    paymentId: string;
    payerAccountNumber: string;
    expectedAmountYer: number;
  }): Promise<void> {
    const account = normalizeAccountNumber(input.payerAccountNumber);
    const amountYer = Math.floor(input.expectedAmountYer);
    const createdAt = new Date().toISOString();
    const payload: PendingVerification = {
      orderId: input.orderId,
      paymentId: input.paymentId,
      account,
      amountYer,
      createdAt,
    };

    const redis = getRedisClient();
    const ttl = this.ttlSec;
    await redis.set(this.orderKey(input.orderId), JSON.stringify(payload), 'EX', ttl);
    await redis.zadd(this.queueKey(account, amountYer), Date.parse(createdAt), input.orderId);
    await redis.expire(this.queueKey(account, amountYer), ttl);

    await this.paymentRepo.updateAutoVerifyFields(input.paymentId, {
      payer_account_number: account,
      expected_amount_yer: amountYer,
      auto_verify_status: 'pending',
    });

    await this.tryMatchPendingOrder(input.orderId);
  }

  async processSmsEvent(eventId: string): Promise<void> {
    const event = await this.paymentBridgeRepo.findSmsEventById(eventId);
    if (!event || event.matched_order_id) {
      paymentVerifyDebug('process_sms_skip', {
        eventId,
        reason: !event ? 'not_found' : 'already_matched',
      });
      return;
    }

    paymentVerifyDebug('process_sms_start', {
      eventId,
      walletProvider: event.provider,
      rawMessage: event.raw_message,
      receivedAt: event.received_at.toISOString(),
    });

    const parseResult = await this.parserService.parseWithFallback(event.raw_message);
    if (!parseResult.success || !parseResult.data) {
      paymentVerifyDebug('parse_failed', { eventId, method: parseResult.method });
      await this.paymentBridgeRepo.updateSmsEventParsed(eventId, {
        parse_method: 'failed',
        parse_status: 'failed',
      });
      await this.handleUnparsedSmsEvent(event);
      return;
    }

    await this.paymentBridgeRepo.updateSmsEventParsed(eventId, {
      parsed_provider: parseResult.data.provider,
      parsed_amount: parseResult.data.amount,
      parsed_currency: parseResult.data.currency,
      parsed_account_number: normalizeAccountNumber(parseResult.data.account_number),
      parsed_balance: parseResult.data.balance ?? null,
      parsed_sender: parseResult.data.sender ?? null,
      parse_method: parseResult.method,
      parse_status: 'parsed',
    });

    paymentVerifyDebug('parse_success', {
      eventId,
      walletProvider: event.provider,
      parsedProvider: parseResult.data.provider,
      parsedAmount: parseResult.data.amount,
      parsedAccount: normalizeAccountNumber(parseResult.data.account_number),
      parsedSender: parseResult.data.sender ?? null,
      method: parseResult.method,
    });

    const updated = await this.paymentBridgeRepo.findSmsEventById(eventId);
    if (updated) {
      await this.tryMatchSmsEvent(updated, parseResult.data);
    }
  }

  async tryMatchPendingOrder(orderId: string): Promise<void> {
    const pending = await this.getPendingVerification(orderId);
    if (!pending) {
      return;
    }

    const since = new Date(Date.now() - this.ttlSec * 1000);
    const pendingCreatedAt = new Date(pending.createdAt).getTime();
    const events = await this.paymentBridgeRepo.findRecentUnmatchedSmsEvents(since, 'ASC');

    let sawUnparseableSms = false;

    for (const event of events) {
      if (event.matched_order_id) continue;
      if (event.received_at.getTime() < pendingCreatedAt) continue;

      let parsed: ParsedPaymentSms | null = null;
      if (event.parse_status === 'parsed' && event.parsed_account_number && event.parsed_amount != null) {
        parsed = {
          provider: event.parsed_provider ?? event.provider,
          amount: Number(event.parsed_amount),
          currency: event.parsed_currency ?? 'YER',
          account_number: event.parsed_account_number,
          balance: event.parsed_balance != null ? Number(event.parsed_balance) : null,
          sender: event.parsed_sender,
        };
      } else {
        const parseResult = await this.parserService.parseWithFallback(event.raw_message);
        if (parseResult.success && parseResult.data) {
          parsed = parseResult.data;
          await this.paymentBridgeRepo.updateSmsEventParsed(event.id, {
            parsed_provider: parsed.provider,
            parsed_amount: parsed.amount,
            parsed_currency: parsed.currency,
            parsed_account_number: normalizeAccountNumber(parsed.account_number),
            parsed_balance: parsed.balance ?? null,
            parsed_sender: parsed.sender ?? null,
            parse_method: parseResult.method,
            parse_status: 'parsed',
          });
        } else {
          sawUnparseableSms = true;
        }
      }

      if (!parsed) continue;

      const matched = await this.attemptMatch(orderId, pending, event.id, parsed, event.provider);
      if (matched) return;
    }

    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (
      sawUnparseableSms
      && payment?.status === 'pending'
      && payment.auto_verify_status === 'pending'
    ) {
      paymentVerifyDebug('try_match_order_notify_parse_failed', { orderId, paymentId: pending.paymentId });
      await this.notifyAutoVerifyFailed(orderId, pending.paymentId, 'parse_failed');
      return;
    }

    paymentVerifyDebug('try_match_order_no_match', { orderId });
  }

  private async tryMatchSmsEvent(event: PaymentSmsEvent, parsed: ParsedPaymentSms): Promise<void> {
    const account = normalizeAccountNumber(parsed.account_number);
    const amountYer = Math.floor(parsed.amount);
    const smsReceivedAt = event.received_at.getTime();
    const orderIds = await this.listQueuedOrderIds(account, amountYer);

    for (const orderId of orderIds) {
      const pending = await this.getPendingVerification(orderId);
      if (!pending) {
        await this.removeFromQueue(account, amountYer, orderId);
        continue;
      }

      if (smsReceivedAt < new Date(pending.createdAt).getTime()) {
        continue;
      }

      const matched = await this.attemptMatch(orderId, pending, event.id, parsed, event.provider);
      if (matched) return;
    }

    paymentVerifyDebug('try_match_sms_no_pending', { smsEventId: event.id, account, amountYer });
  }

  private async attemptMatch(
    orderId: string,
    pending: PendingVerification,
    smsEventId: string,
    parsed: ParsedPaymentSms,
    walletProvider: string,
  ): Promise<boolean> {
    const payment = await this.paymentRepo.findByOrderId(orderId);
    if (!payment || payment.status !== 'pending') {
      await this.clearPendingVerification(orderId, pending.account, pending.amountYer);
      return false;
    }

    const providers = await this.paymentBridgeRepo.listActiveProviders();
    const providerForMatch = walletProvider.trim() || parsed.provider;

    if (!this.providerMatches(providerForMatch, providers)) {
      await this.notifyAutoVerifyFailed(orderId, payment.id, 'match_failed');
      return false;
    }

    const account = normalizeAccountNumber(parsed.account_number);
    const amountYer = Math.floor(parsed.amount);

    if (account !== pending.account || amountYer !== pending.amountYer) {
      return false;
    }

    let approved = false;

    try {
      await AppDataSource.transaction(async (manager) => {
        const claimed = await this.paymentBridgeRepo.claimSmsEventForOrder(smsEventId, orderId, manager);
        if (!claimed) {
          paymentVerifyDebug('attempt_match_claim_failed', { smsEventId, orderId });
          return;
        }

        await this.paymentService.approvePendingPaymentWithManager(
          manager,
          payment.id,
          orderId,
          'Auto-approved via SMS verification',
        );
        approved = true;
      });
    } catch {
      paymentVerifyDebug('attempt_match_approve_failed', { smsEventId, orderId, paymentId: payment.id });
      return false;
    }

    if (!approved) {
      return false;
    }

    paymentVerifyDebug('attempt_match_success', { smsEventId, orderId, paymentId: payment.id });
    await this.clearPendingVerification(orderId, pending.account, pending.amountYer);
    await this.notifyPaymentApproved(orderId);
    return true;
  }

  private async notifyPaymentApproved(orderId: string): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) return;

    const copy = notificationMessages.paymentApproved(order.order_number);
    void this.notificationService.notifyCustomer({
      customerId: order.customer_id,
      type: copy.type,
      title: copy.title,
      message: copy.message,
      relatedOrderId: order.id,
    });
  }

  private providerMatches(rawProvider: string, providers: PaymentProvider[]): boolean {
    const normalized = rawProvider.trim().toLowerCase();
    return providers.some((provider) => {
      if (provider.name.toLowerCase() === normalized) return true;
      return (provider.aliases ?? []).some((alias) => alias.trim().toLowerCase() === normalized);
    });
  }

  private async handleUnparsedSmsEvent(event: PaymentSmsEvent): Promise<void> {
    const pendingOrders = await this.listPendingVerifications();
    const candidates = pendingOrders.filter((pending) => {
      const createdAt = new Date(pending.createdAt).getTime();
      return event.received_at.getTime() >= createdAt;
    });

    if (candidates.length === 1) {
      await this.notifyAutoVerifyFailed(candidates[0].orderId, candidates[0].paymentId, 'parse_failed');
      return;
    }

    if (candidates.length > 1) {
      const order = await this.orderRepo.findById(candidates[0].orderId);
      if (order) {
        const staff = notificationMessages.staffPaymentSubmitted(order.order_number);
        void this.notificationService.notifyStaff({
          type: staff.type,
          title: staff.title,
          message: staff.message,
          relatedOrderId: order.id,
        });
      }
    }
  }

  private async notifyAutoVerifyFailed(
    orderId: string,
    paymentId: string,
    status: 'parse_failed' | 'match_failed',
  ): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) return;

    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment || payment.status !== 'pending') return;
    if (payment.auto_verify_status !== 'pending') return;

    await this.paymentRepo.updateAutoVerifyFields(paymentId, { auto_verify_status: status });

    const copy = notificationMessages.autoVerifyFailed(order.order_number);
    void this.notificationService.notifyCustomer({
      customerId: order.customer_id,
      type: copy.type,
      title: copy.title,
      message: copy.message,
      relatedOrderId: order.id,
    });

    if (status === 'parse_failed') {
      const staff = notificationMessages.staffPaymentSubmitted(order.order_number);
      void this.notificationService.notifyStaff({
        type: staff.type,
        title: staff.title,
        message: staff.message,
        relatedOrderId: order.id,
      });
    }
  }

  private async getPendingVerification(orderId: string): Promise<PendingVerification | null> {
    const raw = await getRedisClient().get(this.orderKey(orderId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PendingVerification;
    } catch {
      return null;
    }
  }

  private async listPendingVerifications(): Promise<PendingVerification[]> {
    const redis = getRedisClient();
    const keys = await redis.keys('payment:verify:order:*');
    const results: PendingVerification[] = [];
    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;
      try {
        results.push(JSON.parse(raw) as PendingVerification);
      } catch {
        // skip invalid
      }
    }
    return results;
  }

  private async listQueuedOrderIds(account: string, amountYer: number): Promise<string[]> {
    return getRedisClient().zrange(this.queueKey(account, amountYer), 0, -1);
  }

  private async removeFromQueue(account: string, amountYer: number, orderId: string): Promise<void> {
    await getRedisClient().zrem(this.queueKey(account, amountYer), orderId);
  }

  private async clearPendingVerification(orderId: string, account: string, amountYer: number): Promise<void> {
    const redis = getRedisClient();
    await redis.del(this.orderKey(orderId));
    await redis.zrem(this.queueKey(account, amountYer), orderId);
  }

  private orderKey(orderId: string): string {
    return `payment:verify:order:${orderId}`;
  }

  private queueKey(account: string, amountYer: number): string {
    return `payment:verify:queue:${account}:${amountYer}`;
  }
}
