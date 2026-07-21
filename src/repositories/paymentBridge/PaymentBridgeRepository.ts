import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import {
  CreatePaymentDeviceDto,
  CreatePaymentProviderDto,
  CreatePaymentSmsEventDto,
  IPaymentBridgeRepository,
  UpdatePaymentDeviceDto,
  UpdatePaymentProviderDto,
} from '../../interfaces/repositories/IPaymentBridgeRepository';
import { PaymentDevice } from '../../models/PaymentDevice';
import { PaymentProvider } from '../../models/PaymentProvider';
import { PaymentSmsEvent } from '../../models/PaymentSmsEvent';

@injectable()
export class PaymentBridgeRepository implements IPaymentBridgeRepository {
  private deviceRepo = AppDataSource.getRepository(PaymentDevice);
  private providerRepo = AppDataSource.getRepository(PaymentProvider);
  private eventRepo = AppDataSource.getRepository(PaymentSmsEvent);

  async findDeviceByUuid(deviceUuid: string): Promise<PaymentDevice | null> {
    return this.deviceRepo.findOne({ where: { device_uuid: deviceUuid } });
  }

  async findDeviceById(id: string): Promise<PaymentDevice | null> {
    return this.deviceRepo.findOne({ where: { id } });
  }

  async listDevices(): Promise<PaymentDevice[]> {
    return this.deviceRepo.find({ order: { created_at: 'DESC' } });
  }

  async createDevice(data: CreatePaymentDeviceDto, apiKeyHash: string): Promise<PaymentDevice> {
    return this.deviceRepo.save(
      this.deviceRepo.create({
        device_uuid: data.device_uuid,
        label: data.label ?? null,
        api_key_hash: apiKeyHash,
        enabled: true,
      }),
    );
  }

  async updateDevice(id: string, data: UpdatePaymentDeviceDto): Promise<PaymentDevice | null> {
    await this.deviceRepo.update(id, data);
    return this.findDeviceById(id);
  }

  async deleteDevice(id: string): Promise<void> {
    await this.deviceRepo.delete(id);
  }

  async touchDeviceLastSeen(id: string, seenAt: Date): Promise<void> {
    await this.deviceRepo.update(id, { last_seen: seenAt });
  }

  async listActiveProviders(): Promise<PaymentProvider[]> {
    return this.providerRepo.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
  }

  async listProviders(): Promise<PaymentProvider[]> {
    return this.providerRepo.find({ order: { name: 'ASC' } });
  }

  async findProviderById(id: string): Promise<PaymentProvider | null> {
    return this.providerRepo.findOne({ where: { id } });
  }

  async createProvider(data: CreatePaymentProviderDto): Promise<PaymentProvider> {
    return this.providerRepo.save(
      this.providerRepo.create({
        name: data.name.trim().toLowerCase(),
        aliases: data.aliases ?? [],
        is_active: data.is_active ?? true,
      }),
    );
  }

  async updateProvider(id: string, data: UpdatePaymentProviderDto): Promise<PaymentProvider | null> {
    const patch: UpdatePaymentProviderDto = { ...data };
    if (patch.name) {
      patch.name = patch.name.trim().toLowerCase();
    }
    await this.providerRepo.update(id, patch);
    return this.findProviderById(id);
  }

  async deleteProvider(id: string): Promise<void> {
    await this.providerRepo.delete(id);
  }

  async createSmsEvent(data: CreatePaymentSmsEventDto): Promise<PaymentSmsEvent> {
    return this.eventRepo.save(
      this.eventRepo.create({
        device_id: data.device_id,
        provider: data.provider,
        sender_address: data.sender_address,
        raw_message: data.raw_message,
        received_at: data.received_at,
      }),
    );
  }
}
