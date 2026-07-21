import { delay, inject, injectable } from 'tsyringe';
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
    const payload: PendingVerification = {
      orderId: input.orderId,
      paymentId: input.paymentId,
      account,
      amountYer,
      createdAt: new Date().toISOString(),
    };

    const redis = getRedisClient();
    const ttl = this.ttlSec;
    await redis.set(this.orderKey(input.orderId), JSON.stringify(payload), 'EX', ttl);
    await redis.set(this.indexKey(account, amountYer), input.orderId, 'EX', ttl);

    paymentVerifyDebug('register_pending', {
      orderId: input.orderId,
      paymentId: input.paymentId,
      account,
      amountYer,
      ttlSec: ttl,
      orderKey: this.orderKey(input.orderId),
      indexKey: this.indexKey(account, amountYer),
    });

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
      paymentVerifyDebug('try_match_order_no_pending', { orderId });
      return;
    }

    paymentVerifyDebug('try_match_order_start', { orderId, pending });

    const since = new Date(Date.now() - this.ttlSec * 1000);
    const events = await this.paymentBridgeRepo.findRecentUnmatchedSmsEvents(since);

    paymentVerifyDebug('try_match_order_events', {
      orderId,
      eventCount: events.length,
      since: since.toISOString(),
    });

    for (const event of events) {
      if (event.matched_order_id) continue;

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
        }
      }

      if (!parsed) continue;

      const matched = await this.attemptMatch(orderId, pending, event.id, parsed, event.provider);
      if (matched) return;
    }

    paymentVerifyDebug('try_match_order_no_match', { orderId });
  }

  private async tryMatchSmsEvent(event: PaymentSmsEvent, parsed: ParsedPaymentSms): Promise<void> {
    const account = normalizeAccountNumber(parsed.account_number);
    const amountYer = Math.floor(parsed.amount);
    const indexKey = this.indexKey(account, amountYer);
    const orderId = await getRedisClient().get(indexKey);

    paymentVerifyDebug('try_match_sms_lookup', {
      smsEventId: event.id,
      walletProvider: event.provider,
      parsedProvider: parsed.provider,
      account,
      amountYer,
      indexKey,
      orderId: orderId ?? null,
    });

    if (!orderId) return;

    const pending = await this.getPendingVerification(orderId);
    if (!pending) {
      paymentVerifyDebug('try_match_sms_no_pending', { smsEventId: event.id, orderId });
      return;
    }

    await this.attemptMatch(orderId, pending, event.id, parsed, event.provider);
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
      paymentVerifyDebug('attempt_match_skip_payment', {
        orderId,
        smsEventId,
        paymentStatus: payment?.status ?? null,
      });
      await this.clearPendingVerification(orderId, pending.account, pending.amountYer);
      return false;
    }

    const providers = await this.paymentBridgeRepo.listActiveProviders();
    const providerForMatch = walletProvider.trim() || parsed.provider;

    if (!this.providerMatches(providerForMatch, providers)) {
      paymentVerifyDebug('attempt_match_provider_failed', {
        orderId,
        smsEventId,
        paymentId: payment.id,
        walletProvider,
        parsedProvider: parsed.provider,
        providerForMatch,
        activeProviders: providers.map((p) => ({ name: p.name, aliases: p.aliases ?? [] })),
      });
      await this.paymentRepo.updateAutoVerifyFields(payment.id, { auto_verify_status: 'match_failed' });
      await this.notifyManualReview(orderId, payment.id);
      return false;
    }

    const account = normalizeAccountNumber(parsed.account_number);
    const amountYer = Math.floor(parsed.amount);

    if (account !== pending.account || amountYer !== pending.amountYer) {
      paymentVerifyDebug('attempt_match_amount_account_failed', {
        orderId,
        smsEventId,
        paymentId: payment.id,
        expected: { account: pending.account, amountYer: pending.amountYer },
        parsed: { account, amountYer },
        accountMatch: account === pending.account,
        amountMatch: amountYer === pending.amountYer,
      });
      await this.paymentRepo.updateAutoVerifyFields(payment.id, { auto_verify_status: 'match_failed' });
      await this.notifyManualReview(orderId, payment.id);
      return false;
    }

    paymentVerifyDebug('attempt_match_success', {
      orderId,
      smsEventId,
      paymentId: payment.id,
      walletProvider: providerForMatch,
      account,
      amountYer,
    });

    await this.paymentService.autoApprovePayment(payment.id, 'Auto-approved via SMS verification');
    await this.paymentBridgeRepo.updateSmsEventMatched(smsEventId, orderId);
    await this.paymentRepo.updateAutoVerifyFields(payment.id, { auto_verify_status: 'matched' });
    await this.clearPendingVerification(orderId, pending.account, pending.amountYer);
    return true;
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
      await this.notifyParseFailure(candidates[0].orderId, candidates[0].paymentId);
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

  private async notifyParseFailure(orderId: string, paymentId: string): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) return;

    await this.paymentRepo.updateAutoVerifyFields(paymentId, { auto_verify_status: 'parse_failed' });

    const copy = notificationMessages.autoVerifyFailed(order.order_number);
    void this.notificationService.notifyCustomer({
      customerId: order.customer_id,
      type: copy.type,
      title: copy.title,
      message: copy.message,
      relatedOrderId: order.id,
    });

    const staff = notificationMessages.staffPaymentSubmitted(order.order_number);
    void this.notificationService.notifyStaff({
      type: staff.type,
      title: staff.title,
      message: staff.message,
      relatedOrderId: order.id,
    });
  }

  private async notifyManualReview(orderId: string, paymentId: string): Promise<void> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) return;

    const copy = notificationMessages.autoVerifyFailed(order.order_number);
    void this.notificationService.notifyCustomer({
      customerId: order.customer_id,
      type: copy.type,
      title: copy.title,
      message: copy.message,
      relatedOrderId: order.id,
    });
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

  private async clearPendingVerification(orderId: string, account: string, amountYer: number): Promise<void> {
    const redis = getRedisClient();
    await redis.del(this.orderKey(orderId));
    await redis.del(this.indexKey(account, amountYer));
  }

  private orderKey(orderId: string): string {
    return `payment:verify:order:${orderId}`;
  }

  private indexKey(account: string, amountYer: number): string {
    return `payment:verify:idx:${account}:${amountYer}`;
  }
}
