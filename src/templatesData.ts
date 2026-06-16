/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Sale } from './types';

// Helper to generate past dates relative to 2026-05-22T10:10:00Z
const getPastDateString = (daysAgo: number, hour: number = 14): string => {
  const date = new Date('2026-05-22T10:10:00Z');
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return date.toISOString();
};

export interface BusinessTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  themeColor: string; // for UI pills
  categories: string[];
  products: Product[];
  sales: Sale[];
}

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: 'mercearia',
    name: 'Cantina & Mercearia',
    tagline: 'Produtos alimentares e higiene diária',
    description: 'Básico e essencial para bairros e distritos. Focado em consumo rápido: arroz, óleo, sabão, massas e enlatados.',
    themeColor: 'bg-emerald-500 text-white hover:bg-emerald-600',
    categories: ['Mercearia', 'Bebidas', 'Limpeza & Higiene', 'Pastelaria & Salgados', 'Outros'],
    products: [
      {
        id: 'mer-1',
        code: '10001001',
        name: 'Saco de Arroz Premium 5kg',
        category: 'Mercearia',
        costPrice: 280.0,
        salePrice: 420.0,
        quantity: 40,
        minStock: 10,
      },
      {
        id: 'mer-2',
        code: '10001002',
        name: 'Óleo de Cozinha Nacional ' + '1L',
        category: 'Mercearia',
        costPrice: 95.0,
        salePrice: 150.0,
        quantity: 35,
        minStock: 15,
      },
      {
        id: 'mer-3',
        code: '10001003',
        name: 'Sabão em Barra Macaneta Azul',
        category: 'Limpeza & Higiene',
        costPrice: 25.0,
        salePrice: 45.0,
        quantity: 60,
        minStock: 12,
      },
      {
        id: 'mer-4',
        code: '10001004',
        name: 'Farinha de Milho Shima Top 5kg',
        category: 'Mercearia',
        costPrice: 180.0,
        salePrice: 260.0,
        quantity: 25,
        minStock: 8,
      },
      {
        id: 'mer-5',
        code: '10001005',
        name: 'Feijão Manteiga Nacional 1kg',
        category: 'Mercearia',
        costPrice: 110.0,
        salePrice: 185.0,
        quantity: 4, // Alerta stock baixo!
        minStock: 10,
      },
      {
        id: 'mer-6',
        code: '10001006',
        name: 'Massa Esparguete Nacional 500g',
        category: 'Mercearia',
        costPrice: 32.0,
        salePrice: 55.0,
        quantity: 80,
        minStock: 20,
      },
      {
        id: 'mer-7',
        code: '10001007',
        name: 'Açúcar Castanho da Maragra 1kg',
        category: 'Mercearia',
        costPrice: 65.0,
        salePrice: 95.0,
        quantity: 50,
        minStock: 15,
      },
      {
        id: 'mer-8',
        code: '10001008',
        name: 'Chamuças de Carne Frescas (Unidade)',
        category: 'Pastelaria & Salgados',
        costPrice: 12.0,
        salePrice: 25.0,
        quantity: 15,
        minStock: 10,
      }
    ],
    sales: [
      {
        id: 'VNDA-M001',
        timestamp: getPastDateString(2, 9),
        items: [
          { productId: 'mer-1', name: 'Saco de Arroz Premium 5kg', quantity: 1, costPrice: 280.0, salePrice: 420.0 },
          { productId: 'mer-2', name: 'Óleo de Cozinha Nacional 1L', quantity: 2, costPrice: 95.0, salePrice: 150.0 }
        ],
        subtotal: 720.0,
        discount: 20.0,
        total: 700.0,
        profit: (420.0 - 280.0) * 1 + (150.0 - 95.0) * 2 - 20.0,
        paymentMethod: 'mpesa'
      },
      {
        id: 'VNDA-M002',
        timestamp: getPastDateString(1, 14),
        items: [
          { productId: 'mer-3', name: 'Sabão em Barra Macaneta Azul', quantity: 4, costPrice: 25.0, salePrice: 45.0 },
          { productId: 'mer-4', name: 'Farinha de Milho Shima Top 5kg', quantity: 2, costPrice: 180.0, salePrice: 260.0 },
          { productId: 'mer-7', name: 'Açúcar Castanho da Maragra 1kg', quantity: 2, costPrice: 65.0, salePrice: 95.0 }
        ],
        subtotal: 890.0,
        discount: 0,
        total: 890.0,
        profit: (45.0 - 25.0) * 4 + (260.0 - 180.0) * 2 + (95.0 - 65.0) * 2,
        paymentMethod: 'dinheiro',
        amountPaid: 1000.0,
        change: 110.0
      },
      {
        id: 'VNDA-M003',
        timestamp: getPastDateString(0, 8),
        items: [
          { productId: 'mer-8', name: 'Chamuças de Carne Frescas (Unidade)', quantity: 12, costPrice: 12.0, salePrice: 25.0 }
        ],
        subtotal: 300.0,
        discount: 0,
        total: 300.0,
        profit: (25.0 - 12.0) * 12,
        paymentMethod: 'emola'
      }
    ]
  },
  {
    id: 'bebidas',
    name: 'Bar & Distribuidora Especial',
    tagline: 'Bebidas espirituosas, nacionais e gaseificadas',
    description: 'Configuração otimizada para depósitos e bares locais. Ideal para acompanhar o fluxo rápido de cerveja nacional gelada.',
    themeColor: 'bg-red-500 text-white hover:bg-red-600',
    categories: ['Cervejas', 'Gaseificados', 'Espirituosas & Vinhos', 'Petiscos', 'Outros'],
    products: [
      {
        id: 'beb-1',
        code: '20002001',
        name: 'Cerveja 2M Imperial Txiling (Lata 330ml)',
        category: 'Cervejas',
        costPrice: 48.0,
        salePrice: 80.0,
        quantity: 240,
        minStock: 48,
      },
      {
        id: 'beb-2',
        code: '20002002',
        name: 'Laurentina Preta (Garrafa 330ml)',
        category: 'Cervejas',
        costPrice: 55.0,
        salePrice: 95.0,
        quantity: 120,
        minStock: 24,
      },
      {
        id: 'beb-3',
        code: '20002003',
        name: 'Manica Clássica (Lata 330ml)',
        category: 'Cervejas',
        costPrice: 48.0,
        salePrice: 75.0,
        quantity: 180,
        minStock: 36,
      },
      {
        id: 'beb-4',
        code: '20002004',
        name: 'Gin Txilo Local 750ml',
        category: 'Espirituosas & Vinhos',
        costPrice: 450.0,
        salePrice: 750.0,
        quantity: 12,
        minStock: 3,
      },
      {
        id: 'beb-5',
        code: '20002005',
        name: 'Água Mineral da Namaacha 1.5L',
        category: 'Gaseificados',
        costPrice: 28.0,
        salePrice: 50.0,
        quantity: 6, // Baixo stock
        minStock: 12,
      },
      {
        id: 'beb-6',
        code: '20002006',
        name: 'Coca-Cola Gaseificada (Lata 330ml)',
        category: 'Gaseificados',
        costPrice: 32.0,
        salePrice: 55.0,
        quantity: 90,
        minStock: 24,
      },
      {
        id: 'beb-7',
        code: '20002007',
        name: 'Compal de Pêssego Original 1L',
        category: 'Gaseificados',
        costPrice: 90.0,
        salePrice: 150.0,
        quantity: 36,
        minStock: 10,
      },
      {
        id: 'beb-8',
        code: '20002008',
        name: 'Castanha de Caju de Inhambane Salgada 250g',
        category: 'Petiscos',
        costPrice: 150.0,
        salePrice: 280.0,
        quantity: 20,
        minStock: 5,
      }
    ],
    sales: [
      {
        id: 'VNDA-B001',
        timestamp: getPastDateString(3, 20),
        items: [
          { productId: 'beb-1', name: 'Cerveja 2M Imperial Txiling (Lata 330ml)', quantity: 24, costPrice: 48.0, salePrice: 80.0 },
          { productId: 'beb-8', name: 'Castanha de Caju de Inhambane Salgada 250g', quantity: 2, costPrice: 150.0, salePrice: 280.0 }
        ],
        subtotal: 2480.0,
        discount: 80.0,
        total: 2400.0,
        profit: (80.0 - 48.0) * 24 + (280.0 - 150.0) * 2 - 80.0,
        paymentMethod: 'mpesa'
      },
      {
        id: 'VNDA-B002',
        timestamp: getPastDateString(1, 21),
        items: [
          { productId: 'beb-2', name: 'Laurentina Preta (Garrafa 330ml)', quantity: 6, costPrice: 55.0, salePrice: 95.0 },
          { productId: 'beb-3', name: 'Manica Clássica (Lata 330ml)', quantity: 12, costPrice: 48.0, salePrice: 75.0 },
          { productId: 'beb-6', name: 'Coca-Cola Gaseificada (Lata 330ml)', quantity: 4, costPrice: 32.0, salePrice: 55.0 }
        ],
        subtotal: 1690.0,
        discount: 0,
        total: 1690.0,
        profit: (95.0 - 55.0) * 6 + (75.0 - 48.0) * 12 + (55.0 - 32.0) * 4,
        paymentMethod: 'cartao'
      }
    ]
  },
  {
    id: 'artesanato',
    name: 'Boutique de Capulanas & Artes',
    tagline: 'Tecidos típicos e arte tradicional de Moçambique',
    description: 'Layout ideal para lojas de moda africana, tecidos e artesanato típico destinando-se a turistas e residentes locais.',
    themeColor: 'bg-orange-500 text-white hover:bg-orange-600',
    categories: ['Capulanas', 'Acessórios criativos', 'Esculturas de Madeira', 'Vestuário Africano', 'Outros'],
    products: [
      {
        id: 'art-1',
        code: '30003001',
        name: 'Capulana de Algodão Estampa Maputo 4m',
        category: 'Capulanas',
        costPrice: 250.0,
        salePrice: 550.0,
        quantity: 24,
        minStock: 5,
      },
      {
        id: 'art-2',
        code: '30003002',
        name: 'Capulana Especial Brilho de Sofala',
        category: 'Capulanas',
        costPrice: 350.0,
        salePrice: 750.0,
        quantity: 15,
        minStock: 3,
      },
      {
        id: 'art-3',
        code: '30003003',
        name: 'Mala de Palha Trançada com Detalhe de Couro',
        category: 'Acessórios criativos',
        costPrice: 400.0,
        salePrice: 950.0,
        quantity: 8,
        minStock: 2,
      },
      {
        id: 'art-4',
        code: '30003004',
        name: 'Colar de Missangas Vermelho e Preto Macua',
        category: 'Acessórios criativos',
        costPrice: 85.0,
        salePrice: 220.0,
        quantity: 30,
        minStock: 4,
      },
      {
        id: 'art-5',
        code: '30003005',
        name: 'Escultura de Ébano Guerreiro Changana',
        category: 'Esculturas de Madeira',
        costPrice: 600.0,
        salePrice: 1500.0,
        quantity: 3,
        minStock: 1,
      },
      {
        id: 'art-6',
        code: '30003006',
        name: 'Camisete Estampa Capulana de Homem',
        category: 'Vestuário Africano',
        costPrice: 300.0,
        salePrice: 650.0,
        quantity: 12,
        minStock: 3,
      },
      {
        id: 'art-7',
        code: '30003007',
        name: 'Sandálias de Couro Artesanais unissexo',
        category: 'Vestuário Africano',
        costPrice: 220.0,
        salePrice: 490.0,
        quantity: 1, // Alerta: Última unidade!
        minStock: 5,
      }
    ],
    sales: [
      {
        id: 'VNDA-A001',
        timestamp: getPastDateString(4, 11),
        items: [
          { productId: 'art-1', name: 'Capulana de Algodão Estampa Maputo 4m', quantity: 2, costPrice: 250.0, salePrice: 550.0 },
          { productId: 'art-4', name: 'Colar de Missangas Vermelho e Preto Macua', quantity: 3, costPrice: 85.0, salePrice: 220.0 }
        ],
        subtotal: 1760.0,
        discount: 60.0,
        total: 1700.0,
        profit: (550.0 - 250.0) * 2 + (220.0 - 85.0) * 3 - 60.0,
        paymentMethod: 'mpesa'
      },
      {
        id: 'VNDA-A002',
        timestamp: getPastDateString(1, 16),
        items: [
          { productId: 'art-5', name: 'Escultura de Ébano Guerreiro Changana', quantity: 1, costPrice: 600.0, salePrice: 1500.0 }
        ],
        subtotal: 1500.0,
        discount: 100.0,
        total: 1400.0,
        profit: (1500.0 - 600.0) * 1 - 100.0,
        paymentMethod: 'emola'
      }
    ]
  },
  {
    id: 'quiosque',
    name: 'Quiosque de Recargas & Acessórios',
    tagline: 'Agente Autorizado M-Pesa, e-Mola e Informática',
    description: 'Para bancas de carregas móveis, venda de cabos, adaptadores, saldo digital e carregamentos de telefonia.',
    themeColor: 'bg-orange-500 text-white hover:bg-orange-600',
    categories: ['Recarga Digital', 'Serviço Agente', 'Acessórios Celular', 'Carregadores', 'Eletrónicos'],
    products: [
      {
        id: 'qui-1',
        code: '40004001',
        name: 'Saldo Vodacom Credelec Directo (100 MT)',
        category: 'Recarga Digital',
        costPrice: 92.0,
        salePrice: 100.0,
        quantity: 500,
        minStock: 50,
      },
      {
        id: 'qui-2',
        code: '40004002',
        name: 'Cartão de Recarga Physical Movitel 50 MT',
        category: 'Recarga Digital',
        costPrice: 46.0,
        salePrice: 50.0,
        quantity: 80,
        minStock: 20,
      },
      {
        id: 'qui-3',
        code: '40004003',
        name: 'Cabo de Dados USB Tipo-C Reforçado',
        category: 'Acessórios Celular',
        costPrice: 80.0,
        salePrice: 200.0,
        quantity: 35,
        minStock: 5,
      },
      {
        id: 'qui-4',
        code: '40004004',
        name: 'Fones de Ouvido Estéreo Básicos com micro',
        category: 'Acessórios Celular',
        costPrice: 110.0,
        salePrice: 250.0,
        quantity: 18,
        minStock: 6,
      },
      {
        id: 'qui-5',
        code: '40004005',
        name: 'Adaptador Carregador Rápido de Parede 2.4A',
        category: 'Carregadores',
        costPrice: 140.0,
        salePrice: 350.0,
        quantity: 2, // Stock Alerta!
        minStock: 5,
      },
      {
        id: 'qui-6',
        code: '40004006',
        name: 'Powerbank Portátil Moxom 10000mAh',
        category: 'Eletrónicos',
        costPrice: 550.0,
        salePrice: 1200.0,
        quantity: 8,
        minStock: 2,
      },
      {
        id: 'qui-7',
        code: '40004007',
        name: 'Cartão de Memória MicroSD Kingston 32GB',
        category: 'Eletrónicos',
        costPrice: 250.0,
        salePrice: 600.0,
        quantity: 15,
        minStock: 3,
      }
    ],
    sales: [
      {
        id: 'VNDA-Q001',
        timestamp: getPastDateString(1, 10),
        items: [
          { productId: 'qui-3', name: 'Cabo de Dados USB Tipo-C Reforçado', quantity: 2, costPrice: 80.0, salePrice: 200.0 },
          { productId: 'qui-5', name: 'Adaptador Carregador Rápido de Parede 2.4A', quantity: 1, costPrice: 140.0, salePrice: 350.0 }
        ],
        subtotal: 750.0,
        discount: 0,
        total: 750.0,
        profit: (200.0 - 80.0) * 2 + (350.0 - 140.0) * 1,
        paymentMethod: 'mpesa'
      },
      {
        id: 'VNDA-Q002',
        timestamp: getPastDateString(0, 11),
        items: [
          { productId: 'qui-1', name: 'Saldo Vodacom Credelec Directo (100 MT)', quantity: 3, costPrice: 92.0, salePrice: 100.0 },
          { productId: 'qui-6', name: 'Powerbank Portátil Moxom 10000mAh', quantity: 1, costPrice: 550.0, salePrice: 1200.0 }
        ],
        subtotal: 1500.0,
        discount: 50.0,
        total: 1450.0,
        profit: (100.0 - 92.0) * 3 + (1200.0 - 550.0) * 1 - 50.0,
        paymentMethod: 'dinheiro',
        amountPaid: 1500.0,
        change: 50.0
      }
    ]
  },
  {
    id: 'salao',
    name: 'Salão de Beleza & Barbearia Txiling',
    tagline: 'Serviços de estética, tranças e produtos capilares',
    description: 'Perfeito para salões cosméticos, estéticas de tranças e barbearias. Inclui produtos de tratamento e agendamentos de serviços.',
    themeColor: 'bg-purple-500 text-white hover:bg-purple-600',
    categories: ['Serviços Capilares', 'Estética Geral', 'Produtos de Cuidado', 'Maquilhagem', 'Limpeza'],
    products: [
      {
        id: 'sal-1',
        code: '50005001',
        name: 'Trança Cruzada Africana (Mão de Obra)',
        category: 'Serviços Capilares',
        costPrice: 400.0,
        salePrice: 1200.0,
        quantity: 100, // Stock virtual inesgotável para serviços
        minStock: 2,
      },
      {
        id: 'sal-2',
        code: '50005002',
        name: 'Corte de Cabelo Masculino & Linha Navalha',
        category: 'Serviços Capilares',
        costPrice: 50.0,
        salePrice: 200.0,
        quantity: 150,
        minStock: 5,
      },
      {
        id: 'sal-3',
        code: '50005003',
        name: 'Gel Condicionador Estilo Black 500g',
        category: 'Produtos de Cuidado',
        costPrice: 120.0,
        salePrice: 250.0,
        quantity: 25,
        minStock: 6,
      },
      {
        id: 'sal-4',
        code: '50005004',
        name: 'Manicure de Gel + Verniz Resistente',
        category: 'Estética Geral',
        costPrice: 180.0,
        salePrice: 450.0,
        quantity: 80,
        minStock: 4,
      },
      {
        id: 'sal-5',
        code: '50005005',
        name: 'Óleo de Rícino Nutritivo Moçambicano 100ml',
        category: 'Produtos de Cuidado',
        costPrice: 80.0,
        salePrice: 180.0,
        quantity: 3, // Baixo stock
        minStock: 8,
      },
      {
        id: 'sal-6',
        code: '50005006',
        name: 'Batom Mate Tons Escuros África Glamour',
        category: 'Maquilhagem',
        costPrice: 150.0,
        salePrice: 350.0,
        quantity: 16,
        minStock: 3,
      }
    ],
    sales: [
      {
        id: 'VNDA-S001',
        timestamp: getPastDateString(4, 15),
        items: [
          { productId: 'sal-1', name: 'Trança Cruzada Africana (Mão de Obra)', quantity: 1, costPrice: 400.0, salePrice: 1200.0 },
          { productId: 'sal-3', name: 'Gel Condicionador Estilo Black 500g', quantity: 1, costPrice: 120.0, salePrice: 250.0 }
        ],
        subtotal: 1450.0,
        discount: 50.0,
        total: 1400.0,
        profit: (1200.0 - 400.0) * 1 + (250.0 - 120.0) * 1 - 50.0,
        paymentMethod: 'mpesa'
      },
      {
        id: 'VNDA-S002',
        timestamp: getPastDateString(1, 10),
        items: [
          { productId: 'sal-2', name: 'Corte de Cabelo Masculino & Linha Navalha', quantity: 2, costPrice: 50.0, salePrice: 200.0 },
          { productId: 'sal-4', name: 'Manicure de Gel + Verniz Resistente', quantity: 1, costPrice: 180.0, salePrice: 450.0 }
        ],
        subtotal: 850.0,
        discount: 0,
        total: 850.0,
        profit: (200.0 - 50.0) * 2 + (450.0 - 180.0) * 1,
        paymentMethod: 'dinheiro',
        amountPaid: 1000.0,
        change: 150.0
      }
    ]
  }
];
