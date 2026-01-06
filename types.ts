
export type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
};

export type Address = {
  id: string;
  label: string;
  details: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
};

export type Category = 'Restaurants' | 'Supermarkets' | 'Pharmacies' | 'Retail stores';

export type Vendor = {
  id: string;
  name: string;
  category: Category;
  rating: number;
  image: string;
  isOpen: boolean;
  deliveryTime: string;
  deliveryFee: number;
};

export type Product = {
  id: string;
  vendorId: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
  description?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  vendor: Vendor;
};

export enum OrderStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  IN_PROGRESS = 'Shopping in Progress',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  DELIVERED = 'Delivered'
}

export type Order = {
  id: string;
  type: 'Marketplace' | 'Cefane';
  status: OrderStatus;
  date: string;
  total: number;
  items?: CartItem[];
  shoppingList?: string;
  receiptImage?: string;
  budgetLimit?: number;
  deliveryAddressId?: string;
  riderLocation?: [number, number];
};

export type AppView = 'home' | 'marketplace' | 'vendor' | 'cefane' | 'cart' | 'tracking' | 'profile' | 'auth';
