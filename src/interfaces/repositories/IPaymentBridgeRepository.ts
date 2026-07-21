import { PaymentDevice } from '../../models/PaymentDevice';
import { PaymentProvider } from '../../models/PaymentProvider';
import { PaymentSmsEvent } from '../../models/PaymentSmsEvent';

export interface CreatePaymentDeviceDto {
  device_uuid: string;
  label?: string | null;
}

export interface UpdatePaymentDeviceDto {
  label?: string | null;
  enabled?: boolean;
}

export interface CreatePaymentProviderDto {
  name: string;
  aliases?: string[];
  is_active?: boolean;
}

export interface UpdatePaymentProviderDto {
  name?: string;
  aliases?: string[];
  is_active?: boolean;
}

export interface CreatePaymentSmsEventDto {
  device_id: string;
  provider: string;
  sender_address: string;
  raw_message: string;
  received_at: Date;
}

export interface IPaymentBridgeRepository {
  findDeviceByUuid(deviceUuid: string): Promise<PaymentDevice | null>;
  findDeviceById(id: string): Promise<PaymentDevice | null>;
  listDevices(): Promise<PaymentDevice[]>;
  createDevice(data: CreatePaymentDeviceDto, apiKeyHash: string): Promise<PaymentDevice>;
  updateDevice(id: string, data: UpdatePaymentDeviceDto): Promise<PaymentDevice | null>;
  deleteDevice(id: string): Promise<void>;
  touchDeviceLastSeen(id: string, seenAt: Date): Promise<void>;

  listActiveProviders(): Promise<PaymentProvider[]>;
  listProviders(): Promise<PaymentProvider[]>;
  findProviderById(id: string): Promise<PaymentProvider | null>;
  createProvider(data: CreatePaymentProviderDto): Promise<PaymentProvider>;
  updateProvider(id: string, data: UpdatePaymentProviderDto): Promise<PaymentProvider | null>;
  deleteProvider(id: string): Promise<void>;

  createSmsEvent(data: CreatePaymentSmsEventDto): Promise<PaymentSmsEvent>;
}
