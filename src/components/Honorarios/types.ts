export interface Client {
  id: string;
  name: string;
  cnpj?: string;
  standardAmount: number;
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  LATE = 'LATE',
}

export enum PaymentMethod {
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  TRANSFER = 'TRANSFER',
  CARD = 'CARD',
  OTHER = 'OTHER',
}

export interface PaymentRecord {
  id: string;
  clientId: string;
  month: number;
  year: number;
  amountBilled: number;
  amountPaid: number;
  status: PaymentStatus;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export interface ServiceTicket {
  id: string;
  clientId: string;
  serviceId?: string;
  serviceName: string;
  price: number;
  month: number;
  year: number;
  status: PaymentStatus;
  paidAt?: string;
  requestedAt?: string;
}

export interface ExtraService {
  id: string;
  name: string;
  price: number;
  category: string;
}
