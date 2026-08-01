import { EntityManager } from 'typeorm';
import { PaymentDevice } from '../../models/PaymentDevice';
import { PaymentProvider } from '../../models/PaymentProvider';
import { PaymentSmsEvent, SmsParseMethod, SmsParseStatus } from '../../models/PaymentSmsEvent';

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
  findSmsEventById(id: string): Promise<PaymentSmsEvent | null>;
  findRecentUnmatchedSmsEvents(since: Date, order?: 'ASC' | 'DESC'): Promise<PaymentSmsEvent[]>;
  updateSmsEventParsed(
    id: string,
    data: {
      parsed_provider?: string;
      parsed_amount?: number;
      parsed_currency?: string;
      parsed_account_number?: string;
      parsed_balance?: number | null;
      parsed_sender?: string | null;
      parse_method?: SmsParseMethod;
      parse_status?: SmsParseStatus;
    },
  ): Promise<void>;
  updateSmsEventMatched(id: string, orderId: string): Promise<void>;
  claimSmsEventForOrder(
    smsEventId: string,
    orderId: string,
    manager?: EntityManager,
  ): Promise<boolean>;
}
