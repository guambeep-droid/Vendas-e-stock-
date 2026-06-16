/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  code: string; // SKU or Barcode
  name: string;
  category: string;
  costPrice: number; // Preço de Custo
  salePrice: number; // Preço de Venda
  quantity: number; // Quantidade atual
  minStock: number; // Estoque mínimo para alerta
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'dinheiro' | 'cartao' | 'mpesa' | 'emola';

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  costPrice: number;
  salePrice: number;
}

export interface Sale {
  id: string;
  timestamp: string; // ISO String
  items: SaleItem[];
  subtotal: number;
  discount: number;
  iva?: number;
  total: number;
  profit: number; // calculated as sum((salePrice - costPrice) * quantity) - discount (proportional)
  paymentMethod: PaymentMethod;
  amountPaid?: number; // for cash
  change?: number; // for cash
  customerName?: string;
  customerNuit?: string;
  customerAddress?: string;
  operatorName?: string;
}

export interface SalesSummary {
  revenue: number;
  profit: number;
  transactionsCount: number;
  itemsProcessed: number;
}

export interface StoreConfig {
  name: string;
  nuit: string;
  contacts: string;
  address: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: 'entrada' | 'saida' | 'ajuste_positivo' | 'ajuste_negativo' | 'venda' | 'estorno' | 'cadastro';
  quantity: number; // positive delta of quantity changed (e.g. 5)
  prevQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: string; // ISO string
}

export type UserRole = 'vendedor' | 'fiel' | 'gestor';

export interface PlatformUser {
  id: string;
  name: string;
  role: UserRole;
  enabled: boolean;
  username?: string;
  password?: string;
}

export interface CashierClosure {
  id: string;
  operatorId: string;
  operatorName: string;
  openedAt: string; // ISO string
  closedAt: string; // ISO string
  salesCount: number;
  expectedCash: number; // calculated from sales
  physicalCash: number; // entered by user
  discrepancy: number; // physicalCash - expectedCash
  totalMpesa: number;
  totalEmola: number;
  totalCartao: number;
  totalSales: number;
  notes?: string;
}


