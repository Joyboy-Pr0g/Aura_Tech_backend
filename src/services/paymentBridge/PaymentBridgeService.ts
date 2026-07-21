import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IPaymentBridgeRepository } from '../../interfaces/repositories/IPaymentBridgeRepository';
import { AppError } from '../../core/errors/AppError';
import { hashPassword } from '../../utils/password';
import { generateDeviceApiKey } from '../../utils/generateDeviceApiKey';
import { PaymentDevice } from '../../models/PaymentDevice';
import { PaymentProvider } from '../../models/PaymentProvider';
import { PaymentSmsEvent } from '../../models/PaymentSmsEvent';
import { PaymentVerificationService } from './PaymentVerificationService';
import { paymentVerifyDebug } from '../../utils/paymentVerifyDebug';

@injectable()
export class PaymentBridgeService {
  constructor(
    @inject(REPOSITORY_TOKENS.IPaymentBridgeRepository)
    private paymentBridgeRepo: IPaymentBridgeRepository,
    @inject(PaymentVerificationService)
    private verificationService: PaymentVerificationService,
  ) {}

  async listDevices(): Promise<PaymentDevice[]> {
    return this.paymentBridgeRepo.listDevices();
  }

  async registerDevice(deviceUuid: string, label?: string | null): Promise<{ device: PaymentDevice; api_key: string }> {
    const normalizedUuid = deviceUuid.trim();
    const existing = await this.paymentBridgeRepo.findDeviceByUuid(normalizedUuid);
    if (existing) {
      throw new AppError(409, 'Device already registered');
    }

    const apiKey = generateDeviceApiKey();
    const device = await this.paymentBridgeRepo.createDevice(
      { device_uuid: normalizedUuid, label: label ?? null },
      await hashPassword(apiKey),
    );

    return { device, api_key: apiKey };
  }

  async updateDevice(id: string, data: { label?: string | null; enabled?: boolean }): Promise<PaymentDevice> {
    const updated = await this.paymentBridgeRepo.updateDevice(id, data);
    if (!updated) throw new AppError(404, 'Device not found');
    return updated;
  }

  async deleteDevice(id: string): Promise<void> {
    const device = await this.paymentBridgeRepo.findDeviceById(id);
    if (!device) throw new AppError(404, 'Device not found');
    await this.paymentBridgeRepo.deleteDevice(id);
  }

  async listProvidersForDevice(): Promise<Array<{ name: string; aliases: string[] }>> {
    const providers = await this.paymentBridgeRepo.listActiveProviders();
    return providers.map((provider) => ({
      name: provider.name,
      aliases: provider.aliases,
    }));
  }

  async listProvidersAdmin(): Promise<PaymentProvider[]> {
    return this.paymentBridgeRepo.listProviders();
  }

  async createProvider(data: {
    name: string;
    aliases?: string[];
    is_active?: boolean;
  }): Promise<PaymentProvider> {
    return this.paymentBridgeRepo.createProvider(data);
  }

  async updateProvider(
    id: string,
    data: { name?: string; aliases?: string[]; is_active?: boolean },
  ): Promise<PaymentProvider> {
    const updated = await this.paymentBridgeRepo.updateProvider(id, data);
    if (!updated) throw new AppError(404, 'Provider not found');
    return updated;
  }

  async deleteProvider(id: string): Promise<void> {
    const provider = await this.paymentBridgeRepo.findProviderById(id);
    if (!provider) throw new AppError(404, 'Provider not found');
    await this.paymentBridgeRepo.deleteProvider(id);
  }

  async ingestSmsEvent(
    deviceId: string,
    payload: {
      provider: string;
      senderAddress: string;
      receivedAt: string;
      rawMessage: string;
    },
  ): Promise<PaymentSmsEvent> {
    const receivedAt = new Date(payload.receivedAt);
    if (Number.isNaN(receivedAt.getTime())) {
      throw new AppError(400, 'Invalid receivedAt timestamp');
    }

    if (!payload.provider?.trim() || !payload.senderAddress?.trim() || !payload.rawMessage?.trim()) {
      throw new AppError(400, 'provider, senderAddress, and rawMessage are required');
    }

    const event = await this.paymentBridgeRepo.createSmsEvent({
      device_id: deviceId,
      provider: payload.provider.trim().toLowerCase(),
      sender_address: payload.senderAddress.trim(),
      raw_message: payload.rawMessage,
      received_at: receivedAt,
    });

    paymentVerifyDebug('sms_ingested', {
      eventId: event.id,
      deviceId,
      walletProvider: event.provider,
      senderAddress: event.sender_address,
      receivedAt: event.received_at.toISOString(),
      rawMessage: event.raw_message,
    });

    void this.verificationService.processSmsEvent(event.id).catch((error) => {
      console.error('[payment-bridge] SMS verification failed:', error);
    });

    return event;
  }

  buildPingMessage(deviceUuid: string): string {
    return `AuraTechPlus backend connected successfully for device ${deviceUuid} at ${new Date().toISOString()}`;
  }
}
