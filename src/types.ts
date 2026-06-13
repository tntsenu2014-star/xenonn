export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELED = 'canceled'
}

export enum PaymentMethod {
  BANK = 'bank',
  WHATSAPP = 'whatsapp',
  EZ_CASH = 'ez_cash',
  PAYHERE = 'payhere'
}

export interface Package {
  id: string;
  name: string;
  gameId: string;
  diamonds: number;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: number;
}

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
  createdAt: number;
}

export interface Order {
  id: string;
  packageId: string;
  packageName: string;
  diamonds: number;
  userId: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: OrderStatus;
  paymentProofUrl?: string;
  adminNotes?: string;
  createdAt: number;
}

export interface Settings {
  siteName: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  whatsappNumber: string;
  ezCashNumber: string;
  payhereMerchantId?: string;
  payhereAppId?: string;
  payhereAppSecret?: string;
  isPayhereEnabled?: boolean;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  bannerUrl?: string;
  isActive: boolean;
  createdAt: number;
}

export interface ServiceTemplate {
  id: string;
  serviceId: string;
  name: string;
  imageUrl: string;
  price: number;
  isActive: boolean;
  createdAt: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  date: string;
  isActive: boolean;
  createdAt: number;
}

export interface AccountListing {
  id: string;
  title: string;
  description: string;
  price: number;
  level: number;
  rank: string;
  ffId: string;
  rareItems: string[];
  images: string[];
  isSold: boolean;
  isActive: boolean;
  createdAt: number;
  region: string;
}

export interface AccountOrder {
  id: string;
  accountId: string;
  accountTitle: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target: 'admin' | 'all';
  createdAt: number;
}
