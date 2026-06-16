/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Sale } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: '78910001',
    name: 'Saco de Arroz Premium 5kg',
    category: 'Mercearia',
    costPrice: 280.0,
    salePrice: 420.0,
    quantity: 45,
    minStock: 10,
  },
  {
    id: 'prod-2',
    code: '78910002',
    name: 'Laurentina Preta (Garrafa 330ml)',
    category: 'Bebidas',
    costPrice: 55.0,
    salePrice: 95.0,
    quantity: 120,
    minStock: 25,
  },
  {
    id: 'prod-3',
    code: '78910503',
    name: 'Capulana Multicolor Estampada',
    category: 'Artesanato & Vestuário',
    costPrice: 220.0,
    salePrice: 490.0,
    quantity: 18,
    minStock: 5,
  },
  {
    id: 'prod-4',
    code: '78910004',
    name: 'Castanha de Caju Torrada Inhambane 500g',
    category: 'Mercearia',
    costPrice: 300.0,
    salePrice: 550.0,
    quantity: 8, // Stock Alerta!
    minStock: 10,
  },
  {
    id: 'prod-5',
    code: '78910005',
    name: 'Cerveja 2M Txiling (Lata 330ml)',
    category: 'Bebidas',
    costPrice: 45.0,
    salePrice: 80.0,
    quantity: 150,
    minStock: 30,
  },
  {
    id: 'prod-6',
    code: '78910006',
    name: 'Chamuças de Carne Caseiras (Pack 10 un)',
    category: 'Salgados / Pastelaria',
    costPrice: 120.0,
    salePrice: 250.0,
    quantity: 25,
    minStock: 8,
  },
  {
    id: 'prod-7',
    code: '78910007',
    name: 'Óleo de Cozinha Nacional 1L',
    category: 'Mercearia',
    costPrice: 80.0,
    salePrice: 140.0,
    quantity: 50,
    minStock: 15,
  },
  {
    id: 'prod-8',
    code: '78910008',
    name: 'Sabão em Barra Macaneta (Limpeza)',
    category: 'Limpeza & Higiene',
    costPrice: 25.0,
    salePrice: 45.0,
    quantity: 0, // Stock crítico (Esgotado)
    minStock: 12,
  }
];

// Helper to generate a past ISO date offset by X days
const getPastDateString = (daysAgo: number, hour: number = 14): string => {
  const date = new Date('2026-05-22T00:00:00Z');
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return date.toISOString();
};

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    timestamp: getPastDateString(6, 10),
    items: [
      { productId: 'prod-1', name: 'Saco de Arroz Premium 5kg', quantity: 2, costPrice: 280.0, salePrice: 420.0 },
      { productId: 'prod-5', name: 'Cerveja 2M Txiling (Lata 330ml)', quantity: 5, costPrice: 45.0, salePrice: 80.0 }
    ],
    subtotal: 1240.0,
    discount: 50.0,
    total: 1190.0,
    profit: (420.0 - 280.0) * 2 + (80.0 - 45.0) * 5 - 50.0, 
    paymentMethod: 'mpesa'
  },
  {
    id: 'sale-2',
    timestamp: getPastDateString(5, 15),
    items: [
      { productId: 'prod-2', name: 'Laurentina Preta (Garrafa 330ml)', quantity: 10, costPrice: 55.0, salePrice: 95.0 },
      { productId: 'prod-4', name: 'Castanha de Caju Torrada Inhambane 500g', quantity: 2, costPrice: 300.0, salePrice: 550.0 }
    ],
    subtotal: 2050.0,
    discount: 0,
    total: 2050.0,
    profit: (95.0 - 55.0) * 10 + (550.0 - 300.0) * 2, 
    paymentMethod: 'cartao'
  },
  {
    id: 'sale-3',
    timestamp: getPastDateString(4, 11),
    items: [
      { productId: 'prod-6', name: 'Chamuças de Carne Caseiras (Pack 10 un)', quantity: 4, costPrice: 120.0, salePrice: 250.0 },
      { productId: 'prod-1', name: 'Saco de Arroz Premium 5kg', quantity: 1, costPrice: 280.0, salePrice: 420.0 }
    ],
    subtotal: 1420.0,
    discount: 20.0,
    total: 1400.0,
    profit: (250.0 - 120.0) * 4 + (420.0 - 280.0) - 20.0, 
    paymentMethod: 'emola'
  },
  {
    id: 'sale-4',
    timestamp: getPastDateString(3, 17),
    items: [
      { productId: 'prod-3', name: 'Capulana Multicolor Estampada', quantity: 2, costPrice: 220.0, salePrice: 490.0 }
    ],
    subtotal: 980.0,
    discount: 30.0,
    total: 950.0,
    profit: (490.0 - 220.0) * 2 - 30.0, 
    paymentMethod: 'mpesa'
  },
  {
    id: 'sale-5',
    timestamp: getPastDateString(2, 13),
    items: [
      { productId: 'prod-7', name: 'Óleo de Cozinha Nacional 1L', quantity: 2, costPrice: 80.0, salePrice: 140.0 },
      { productId: 'prod-5', name: 'Cerveja 2M Txiling (Lata 330ml)', quantity: 6, costPrice: 45.0, salePrice: 80.0 }
    ],
    subtotal: 760.0,
    discount: 0,
    total: 760.0,
    profit: (140.0 - 80.0) * 2 + (80.0 - 45.0) * 6, 
    paymentMethod: 'dinheiro',
    amountPaid: 800.0,
    change: 40.0
  },
  {
    id: 'sale-6',
    timestamp: getPastDateString(1, 16),
    items: [
      { productId: 'prod-1', name: 'Saco de Arroz Premium 5kg', quantity: 1, costPrice: 280.0, salePrice: 420.0 },
      { productId: 'prod-2', name: 'Laurentina Preta (Garrafa 330ml)', quantity: 12, costPrice: 55.0, salePrice: 95.0 },
      { productId: 'prod-4', name: 'Castanha de Caju Torrada Inhambane 500g', quantity: 1, costPrice: 300.0, salePrice: 550.0 }
    ],
    subtotal: 2110.0,
    discount: 110.0,
    total: 2000.0,
    profit: (420.0 - 280.0) * 1 + (95.0 - 55.0) * 12 + (550.0 - 300.0) * 1 - 110.0, 
    paymentMethod: 'mpesa'
  },
  {
    id: 'sale-7',
    timestamp: getPastDateString(0, 9),
    items: [
      { productId: 'prod-5', name: 'Cerveja 2M Txiling (Lata 330ml)', quantity: 3, costPrice: 45.0, salePrice: 80.0 }
    ],
    subtotal: 240.0,
    discount: 0,
    total: 240.0,
    profit: (80.0 - 45.0) * 3, 
    paymentMethod: 'dinheiro',
    amountPaid: 300.0,
    change: 60.0
  }
];

export const CATEGORIES = ['Mercearia', 'Bebidas', 'Artesanato & Vestuário', 'Salgados / Pastelaria', 'Limpeza & Higiene', 'Eletrónicos', 'Outros'];
