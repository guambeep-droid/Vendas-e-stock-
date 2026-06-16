/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Sale, PaymentMethod } from '../types';
import MetricCard from './MetricCard';
import ActivityChart from './ActivityChart';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  CreditCard,
  Plus,
  Send,
  MessageSquare,
  Zap,
  Search,
  CheckCircle,
  CheckCircle2,
  X,
  Wallet,
  Coins,
  Phone,
  Calendar,
  ChevronRight
} from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  onNavigateToTab: (tab: 'dashboard' | 'estoque' | 'pdv' | 'historico') => void;
  onQuickAddStock: (productId: string, count: number) => void;
  onQuickSale: (productId: string, paymentMethod: PaymentMethod) => void;
  whatsappNumber: string;
  onUpdateWhatsappNumber: (num: string) => void;
}

// WhatsApp URL generation helpers
export const getWhatsappLowStockLink = (phone: string, product: Product) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const msg = `*My Sales & Stocks: Alerta de Stock Baixo* 🚨\n\nAtenção, o produto *${product.name}* (Cód: ${product.code}) atingiu o nível crítico.\n\n• *Stock Físico Atual:* *${product.quantity} un*\n• *Mínimo Recomendado:* *${product.minStock} un*\n\n_Por favor, providencie o reabastecimento comercial._`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
};

export const getWhatsappGeneralReportLink = (phone: string, products: Product[]) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const lowStockProducts = products.filter(p => p.quantity <= p.minStock);
  
  let listText = '';
  lowStockProducts.forEach((p, index) => {
    listText += `${index + 1}. *${p.name}* (Cód: ${p.code})\n    *Stock Atual:* ${p.quantity} un (Mínimo: ${p.minStock} un)\n\n`;
  });
  
  const msg = `*My Sales & Stocks: Relatório Geral de Rutura de Stock* 🚨\n\nLista de itens abaixo do limite de segurança:\n\n${listText}Número total de produtos em alerta: *${lowStockProducts.length}*\n\n_Por favor, proceda com o reabastecimento._`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
};

export default function DashboardView({
  products,
  sales,
  onNavigateToTab,
  onQuickAddStock,
  onQuickSale,
  whatsappNumber,
  onUpdateWhatsappNumber,
}: DashboardViewProps) {
  // Quick Sale UI State
  const [quickSaleSearch, setQuickSaleSearch] = useState('');
  const [quickSaleMethod, setQuickSaleMethod] = useState<PaymentMethod>('dinheiro');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // 1. Calculate general stats
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const uniqueProductsCount = products.length;
  const lowStockCount = products.filter((p) => p.quantity <= p.minStock).length;

  // 2. Format Metical (MT)
  const formatMZN = (val: number) => {
    return val.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MT';
  };

  // Calculate total acquisition cost for physical stock sold
  const totalCost = sales.reduce((sum, s) => {
    const saleCost = s.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
    return sum + saleCost;
  }, 0);

  const ticketMedio = sales.length > 0 ? totalRevenue / sales.length : 0;

  // Breakdown of revenue by payment channels
  const revenueByPayment: Record<PaymentMethod, number> = {
    dinheiro: 0,
    mpesa: 0,
    emola: 0,
    cartao: 0
  };

  sales.forEach(sale => {
    if (revenueByPayment[sale.paymentMethod] !== undefined) {
      revenueByPayment[sale.paymentMethod] += sale.total;
    } else {
      revenueByPayment[sale.paymentMethod] = sale.total;
    }
  });

  // Helper payment icon and text mappings
  const getPaymentDetails = (method: PaymentMethod | string) => {
    switch (method) {
      case 'mpesa':
      case 'pix':
        return { 
          label: 'M-Pesa (Vodacom)', 
          color: 'bg-emerald-500', 
          textColor: 'text-emerald-600',
          borderColor: 'border-emerald-100',
          bgColor: 'bg-emerald-50/60',
          icon: <Phone className="w-4 h-4 text-emerald-600" />
        };
      case 'emola':
        return { 
          label: 'e-Mola (Movitel)', 
          color: 'bg-orange-500', 
          textColor: 'text-orange-600',
          borderColor: 'border-orange-100',
          bgColor: 'bg-orange-50/60',
          icon: <Coins className="w-4 h-4 text-orange-600" />
        };
      case 'dinheiro':
        return { 
          label: 'Numerário (Físico)', 
          color: 'bg-emerald-600', 
          textColor: 'text-emerald-600',
          borderColor: 'border-emerald-100',
          bgColor: 'bg-emerald-50/60',
          icon: <Wallet className="w-4 h-4 text-emerald-600" />
        };
      case 'cartao':
      case 'credito':
      case 'debito':
      default:
        return { 
          label: 'Cartão Bancário', 
          color: 'bg-slate-700', 
          textColor: 'text-slate-700',
          borderColor: 'border-slate-205',
          bgColor: 'bg-slate-50',
          icon: <CreditCard className="w-4 h-4 text-slate-700" />
        };
    }
  };

  const handleQuickSaleTrigger = (product: Product) => {
    if (product.quantity <= 0) return;
    onQuickSale(product.id, quickSaleMethod);
    
    const methodNames: Record<PaymentMethod, string> = {
      dinheiro: 'Dinheiro',
      cartao: 'Cartão',
      mpesa: 'M-Pesa 🇲🇿',
      emola: 'e-Mola 📱'
    };
    
    setSuccessToast(`Sucesso! 1 un. de "${product.name}" vendida por ${formatMZN(product.salePrice)} via ${methodNames[quickSaleMethod]}.`);
    
    // Auto-dismiss within 3.5s
    setTimeout(() => {
      setSuccessToast((curr) => {
        return curr && curr.includes(product.name) ? null : curr;
      });
    }, 3500);
  };

  // 3. Find Best Selling Products
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  
  sales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = { name: item.name, qty: 0, revenue: 0 };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].revenue += item.quantity * item.salePrice;
    });
  });

  const bestSellers = Object.entries(productSalesMap)
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxSellsQty = bestSellers.length > 0 ? bestSellers[0].qty : 1;

  // 4. Calculate Payment Methods Breakdown
  const paymentMethodsCounts = {
    dinheiro: 0,
    cartao: 0,
    mpesa: 0,
    emola: 0,
  };

  sales.forEach((s) => {
    // support any legacy data fallback safely
    const method = s.paymentMethod as any;
    if (method === 'pix') {
      paymentMethodsCounts.mpesa += s.total;
    } else if (method === 'credito' || method === 'debito') {
      paymentMethodsCounts.cartao += s.total;
    } else if (paymentMethodsCounts[s.paymentMethod] !== undefined) {
      paymentMethodsCounts[s.paymentMethod] += s.total;
    }
  });

  const totalPaymentSum = Object.values(paymentMethodsCounts).reduce((a, b) => a + b, 0) || 1;

  const paymentLabels: Record<keyof typeof paymentMethodsCounts, { name: string; color: string }> = {
    dinheiro: { name: 'Dinheiro em Espécie (Meticais)', color: 'bg-emerald-550' },
    cartao: { name: 'Cartão de Débito/Crédito (BIM/BCI)', color: 'bg-orange-500' },
    mpesa: { name: 'M-Pesa (Vodacom)', color: 'bg-emerald-600' },
    emola: { name: 'e-Mola (Movitel)', color: 'bg-orange-405' },
  };

  // 5. Critical low stock items
  const criticalItems = products
    .filter((p) => p.quantity <= p.minStock)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  // 6. Filter products for the Quick Sale (1-Clique) module
  const filteredQuickSaleProducts = products
    .filter((p) => {
      const query = quickSaleSearch.toLowerCase().trim();
      if (!query) return true; // show all (first 6) if query is empty
      return (
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    })
    .slice(0, 6);

  return (
    <div className="space-y-6" id="dashboard-view-container">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="executive-metrics-grid">
        <MetricCard
          title="Faturamento Bruto"
          value={formatMZN(totalRevenue)}
          icon={TrendingUp}
          subtext="+12.4% em relação ao planejado"
          subtextColor="text-emerald-600"
          colorVariant="orange"
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatMZN(totalProfit)}
          icon={DollarSign}
          subtext={`Margem operacional de: ${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'}%`}
          subtextColor="text-orange-600 font-bold"
          colorVariant="emerald"
        />
        <MetricCard
          title="Itens no Catálogo"
          value={uniqueProductsCount}
          icon={Package}
          subtext="Categorias de produtos ativas"
          colorVariant="orange"
        />
        <MetricCard
          title="Alertas de Estoque"
          value={lowStockCount}
          icon={AlertTriangle}
          subtext={lowStockCount > 0 ? `${lowStockCount} produtos abaixo do ideal` : 'Estoque regulado saudável'}
          subtextColor={lowStockCount > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600'}
          colorVariant={lowStockCount > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* Main Charts & Breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (Span 2) */}
        <div className="lg:col-span-2">
          <ActivityChart sales={sales} />
        </div>

        {/* Payment Type Distribution */}
        <div className="p-6 bg-white border border-slate-200/85 rounded-2xl shadow-xs flex flex-col justify-between" id="payment-distribution-panel">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1.5">
              <CreditCard className="w-4 h-4 text-orange-500" />
              Preferencia de Pagamentos
            </h3>
            <p className="text-xs text-slate-400 mb-6">Distribuição das compras pelos canais de recebimento do caixa.</p>
          </div>

          <div className="space-y-5">
            {Object.entries(paymentMethodsCounts).map(([method, sum]) => {
              const key = method as keyof typeof paymentMethodsCounts;
              const percentage = Math.round((sum / totalPaymentSum) * 100);
              return (
                <div key={method} className="space-y-1.5" id={`payment-item-${method}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{paymentLabels[key].name}</span>
                    <span className="font-mono text-slate-500 font-medium">
                      {formatMZN(sum)} <span className="font-extrabold text-slate-800">({percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${paymentLabels[key].color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
            Atualizado automaticamente em tempo real a cada checkout.
          </div>
        </div>
      </div>

      {/* SECTION: FLUXO DE CAIXA (Cash Flow Dashboard Details) */}
      <div className="space-y-4 border-t border-slate-150 pt-6" id="dashboard-cashflow-section">
        
        {/* Title indicator row */}
        <h3 className="text-[11px] font-black text-slate-450 uppercase tracking-widest pl-1 flex items-center gap-1.5">
          <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
            <Coins className="w-3.5 h-3.5" />
          </span>
          Visão Geral do Fluxo do Caixa
        </h3>

        {/* Dynamic Cash Flow Metric highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="cashflow-metric-indicators">
          
          {/* Metric 1: Total Entries Inflow */}
          <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entrada Brutal (Receita)</span>
              <p className="text-lg font-black font-mono text-slate-800">{formatMZN(totalRevenue)}</p>
              <span className="text-[9px] font-medium text-slate-400 block mt-0.5">Dinheiro recebido em caixa</span>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>

          {/* Metric 2: Estimated Outflow/Cost of Stock */}
          <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custo do Stock Vendido</span>
              <p className="text-lg font-black font-mono text-amber-600">{formatMZN(totalCost)}</p>
              <span className="text-[9px] font-medium text-slate-400 block mt-0.5">Investimento na aquisição dos itens</span>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>

          {/* Metric 3: Profit Margins Net */}
          <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Líquido (Lucro)</span>
              <p className="text-lg font-black font-mono text-emerald-600">{formatMZN(totalProfit)}</p>
              <span className="text-[9px] font-medium text-emerald-500 block mt-0.5 font-bold">
                Retorno líquido lucrativo: +{totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Metric 4: Ticket Medio */}
          <div className="bg-white border border-slate-200 shadow-xs p-5 rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Médio por Fatura</span>
              <p className="text-lg font-black font-mono text-slate-800">{formatMZN(ticketMedio)}</p>
              <span className="text-[9px] font-medium text-slate-400 block mt-0.5">Tickets de {sales.length} vendas</span>
            </div>
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

        </div>

        {/* Twin Panel Grid: Liquidation Channels vs Recent Entries */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="cashflow-twin-panel">
          
          {/* Left Block: Payment channels breakdown (2/5 columns) */}
          <div className="lg:col-span-2 bg-white border border-slate-200 shadow-xs p-5 rounded-2xl space-y-4">
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Entradas por Canal de Liquidação</h4>
              <p className="text-[10px] text-slate-400 mt-1">Comparativo de saldos captados pelas carteiras móveis e numerários.</p>
            </div>

            <div className="space-y-3.5 pt-2">
              {(['mpesa', 'emola', 'dinheiro', 'cartao'] as PaymentMethod[]).map((method) => {
                const valueOfMethod = revenueByPayment[method] || 0;
                const details = getPaymentDetails(method);
                const percent = totalRevenue > 0 ? (valueOfMethod / totalRevenue) * 100 : 0;

                return (
                  <div key={method} className="space-y-1 px-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        {details.icon}
                        <span className="font-semibold text-slate-700">{details.label}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">{formatMZN(valueOfMethod)}</span>
                    </div>
                    {/* Visual Progress Line */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full ${details.color}`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] text-slate-400">
                      <span>Proporção de entradas</span>
                      <span className="font-bold">{percent.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Block: Recent Lançamentos table (3/5 columns) */}
          <div className="lg:col-span-3 bg-white border border-slate-200 shadow-xs p-5 rounded-2xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Lançamentos Recentes em Caixa</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Últimos registos de vendas e fluxo correspondente.</p>
                </div>
                <div className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Modo Activo
                </div>
              </div>

              {sales.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Coins className="w-8 h-8 text-slate-350 mx-auto" />
                  <p className="text-xs text-slate-455 font-medium">Sem lançamentos de caixa detectados.</p>
                  <p className="text-[10px] text-slate-400">Inicie as suas vendas utilizando o menu do PDV.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold text-[10px]">
                        <th className="py-2">Ref Venda</th>
                        <th className="py-2">Data e Hora</th>
                        <th className="py-2">Canal</th>
                        <th className="py-2 text-right">Inflow Brutal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/50">
                      {sales.slice(-5).reverse().map((sale) => {
                        const pm = getPaymentDetails(sale.paymentMethod);
                        return (
                          <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 font-mono text-[9px] text-slate-500 font-semibold">{sale.id}</td>
                            <td className="py-2.5 text-[10px] text-slate-500 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(sale.timestamp).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5">
                              <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${pm.borderColor} ${pm.textColor} ${pm.bgColor}`}>
                                <span className={`w-1 h-1 rounded-full ${pm.color}`}></span>
                                {sale.paymentMethod.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-mono font-black text-slate-805">
                              {formatMZN(sale.total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {sales.length > 0 && (
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-medium">Balanço de fluxo actualizado há instantes</span>
                <button 
                  onClick={() => onNavigateToTab('historico')}
                  className="text-[10px] font-black text-orange-600 hover:text-orange-700 transition-colors uppercase tracking-wider flex items-center gap-0.5"
                >
                  Ver Faturas Completas
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* SECTION: Venda Rápida (1-Clique) */}
      <div className="p-6 bg-white border border-slate-200/85 rounded-2xl shadow-xs space-y-4" id="quick-sale-panel">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Zap className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
              Módulo de Venda Rápida (Registo em 1-Clique)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Clique em qualquer produto para registrar uma venda de 1 unidade sem sair do Dashboard.</p>
          </div>
          
          <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
            {/* Quick search specifically for quick sale */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por nome ou código..."
                value={quickSaleSearch}
                onChange={(e) => setQuickSaleSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50 placeholder-slate-400 font-medium rounded-xl"
              />
              {quickSaleSearch && (
                <button
                  type="button"
                  onClick={() => setQuickSaleSearch('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Success Alert Banner (Confirms physical deduction & log update) */}
        {successToast && (
          <div className="p-3.5 bg-emerald-500 border border-emerald-450/40 rounded-xl text-white shadow-md shadow-emerald-500/10 flex items-center justify-between animate-in fade-in slide-in-from-top-3 duration-250">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4.5 h-4.5 shrink-0 text-white" />
              <p className="text-xs font-bold leading-normal">{successToast}</p>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-600/40 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Configuration strip to pre-choose the sale payment method */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Canal de Caixa pré-selecionado:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['dinheiro', 'mpesa', 'emola', 'cartao'] as PaymentMethod[]).map((method) => {
              const isSelected = quickSaleMethod === method;
              const labels: Record<PaymentMethod, { label: string }> = {
                dinheiro: { label: '💵 Dinheiro' },
                mpesa: { label: '🇲🇿 M-Pesa' },
                emola: { label: '📱 e-Mola' },
                cartao: { label: '💳 Cartão' },
              };
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setQuickSaleMethod(method)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/50'
                  }`}
                >
                  <span>{labels[method].label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick sale grid cards */}
        {filteredQuickSaleProducts.length === 0 ? (
          <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Package className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
            <p className="text-xs font-semibold">Nenhum produto corresponde à filtragem de busca rápida.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredQuickSaleProducts.map((p) => {
              const matchesMinStock = p.quantity <= p.minStock;
              const isZero = p.quantity === 0;
              return (
                <div 
                  key={p.id} 
                  className={`p-4 bg-white border rounded-xl flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs transition-shadow duration-200 ${
                    isZero 
                      ? 'border-red-400 bg-rose-50/30' 
                      : matchesMinStock 
                      ? 'border-amber-100 bg-amber-50/5' 
                      : 'border-slate-150'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-extrabold text-slate-800 line-clamp-1">{p.name}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-550 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                        {p.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono text-slate-450">Cód: {p.code}</span>
                      <div className="flex items-center gap-1 font-mono font-bold">
                        <span>Qtd:</span>
                        <span className={isZero ? 'text-rose-600' : matchesMinStock ? 'text-amber-600' : 'text-emerald-600'}>
                          {isZero ? 'ESGOTADO' : `${p.quantity} un`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-xs font-mono font-extrabold text-slate-900">{formatMZN(p.salePrice)}</span>
                    <button
                      type="button"
                      onClick={() => handleQuickSaleTrigger(p)}
                      disabled={isZero}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer active:scale-95 ${
                        isZero
                          ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-2xs active:scale-98'
                      }`}
                      title={isZero ? 'Não é possível registar venda sem stock' : `Vender 1 unidade de ${p.name}`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{isZero ? 'Esgotado' : 'Vender 1'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Critical Stock Items */}
        <div className="p-6 bg-white border border-slate-200/85 rounded-2xl shadow-xs" id="critical-stock-panel">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                Estoque Necessitando Reposição
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Produtos que atingiram ou estão abaixo da quantidade de giro ideal.</p>
            </div>
            <button
              onClick={() => onNavigateToTab('estoque')}
              className="text-xs text-orange-600 hover:text-orange-700 font-bold hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              Ir para Estoque
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* WhatsApp Alert Configuration Panel */}
          <div className="mb-5 p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-3" id="whatsapp-setting-box">
            <div className="flex items-center gap-2">
              <div className="p-1 px-1.5 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.005 5.148 5.117.03 11.432.03c3.058 0 5.932 1.192 8.095 3.358a11.336 11.336 0 0 1 3.357 8.1c-.007 6.284-5.119 11.405-11.43 11.405-1.996-.001-3.957-.521-5.694-1.51L0 24zm6.59-4.846c1.657.983 3.284 1.503 5.14 1.504 5.073 0 9.203-4.113 9.208-9.179.002-2.454-.955-4.761-2.693-6.499C16.565 3.282 14.25 2.32 11.8 2.32c-5.078 0-9.209 4.113-9.213 9.182-.001 1.956.517 3.6 1.493 5.234l-1.012 3.693 3.793-.995zM16.57 14.87c-.27-.135-1.59-.783-1.836-.873-.247-.09-.427-.135-.607.135-.18.27-.697.873-.855 1.053-.157.18-.315.202-.585.067-.27-.135-1.14-.42-2.172-1.341-.803-.715-1.345-1.6-1.503-1.87-.157-.27-.017-.417.118-.552.122-.122.27-.315.405-.472.135-.157.18-.27.27-.45.09-.18.045-.337-.022-.472-.068-.135-.607-1.463-.832-2.003-.22-.526-.44-.455-.607-.463-.157-.008-.337-.01-.517-.01s-.472.067-.72.337c-.247.27-.945.922-.945 2.247s.967 2.599 1.103 2.779c.135.18 1.902 2.904 4.609 4.073.644.279 1.147.445 1.539.57.647.206 1.235.177 1.701.107.518-.077 1.59-.651 1.815-1.281.225-.63.225-1.17.157-1.282-.067-.113-.247-.203-.517-.338z" />
                </svg>
              </div>
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Configurar Alerta Mestre WhatsApp</span>
            </div>
            
            <p className="text-[10px] text-emerald-700 font-medium leading-normal">
              Insira o contacto telefónico de destino (Moçambique +258 por defeito). O app gerará hiperligações oficiais de disparo no clique.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 font-bold text-xs font-mono">
                  +
                </span>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => onUpdateWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="258840000000"
                  className="w-full pl-6 pr-3 py-2 bg-white border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/25 rounded-xl text-xs font-mono font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              {lowStockCount > 0 && (
                <a
                  href={getWhatsappGeneralReportLink(whatsappNumber, products)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  id="whatsapp-bulk-alert-btn"
                  title="Enviar relatório completo consolidado via WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Alerta Geral ({lowStockCount})</span>
                </a>
              )}
            </div>
          </div>

          {criticalItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Parabéns! Nenhum produto com estoque crítico.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {criticalItems.map((item) => (
                <div key={item.id} className="py-4 flex justify-between items-center gap-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] bg-slate-100 text-slate-550 px-1.5 py-0.5 rounded font-mono font-bold tracking-tight">
                        Cód: {item.code}
                      </span>
                      <span className="text-xs text-slate-400">
                        Configuração Mínima: <span className="font-mono font-bold text-slate-600">{item.minStock}</span> un
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg ${
                        item.quantity === 0
                          ? 'bg-rose-50 text-rose-600 border border-rose-100/50'
                          : 'bg-amber-50 text-amber-700 border border-amber-100/50'
                      }`}
                    >
                      {item.quantity === 0 ? 'ZERADO' : `${item.quantity} un`}
                    </span>
                    
                    {/* Send Single WhatsApp Alert Button */}
                    <a
                      href={getWhatsappLowStockLink(whatsappNumber, item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-emerald-600 hover:text-white hover:bg-emerald-600 border border-slate-200 hover:border-emerald-500 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                      title={`Enviar alerta do ${item.name} por WhatsApp`}
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.005 5.148 5.117.03 11.432.03c3.058 0 5.932 1.192 8.095 3.358a11.336 11.336 0 0 1 3.357 8.1c-.007 6.284-5.119 11.405-11.43 11.405-1.996-.001-3.957-.521-5.694-1.51L0 24zm6.59-4.846c1.657.983 3.284 1.503 5.14 1.504 5.073 0 9.203-4.113 9.208-9.179.002-2.454-.955-4.761-2.693-6.499C16.565 3.282 14.25 2.32 11.8 2.32c-5.078 0-9.209 4.113-9.213 9.182-.001 1.956.517 3.6 1.493 5.234l-1.012 3.693 3.793-.995zM16.57 14.87c-.27-.135-1.59-.783-1.836-.873-.247-.09-.427-.135-.607.135-.18.27-.697.873-.855 1.053-.157.18-.315.202-.585.067-.27-.135-1.14-.42-2.172-1.341-.803-.715-1.345-1.6-1.503-1.87-.157-.27-.017-.417.118-.552.122-.122.27-.315.405-.472.135-.157.18-.27.27-.45.09-.18.045-.337-.022-.472-.068-.135-.607-1.463-.832-2.003-.22-.526-.44-.455-.607-.463-.157-.008-.337-.01-.517-.01s-.472.067-.72.337c-.247.27-.945.922-.945 2.247s.967 2.599 1.103 2.779c.135.18 1.902 2.904 4.609 4.073.644.279 1.147.445 1.539.57.647.206 1.235.177 1.701.107.518-.077 1.59-.651 1.815-1.281.225-.63.225-1.17.157-1.282-.067-.113-.247-.203-.517-.338z" />
                      </svg>
                    </a>

                    <button
                      onClick={() => onQuickAddStock(item.id, 15)}
                      title="Adicionar +15 unidades"
                      className="p-2 text-orange-600 hover:text-white hover:bg-orange-600 border border-slate-200 hover:border-orange-500 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Popular Best Selling Products */}
        <div className="p-6 bg-white border border-slate-200/85 rounded-2xl shadow-xs" id="best-sellers-panel">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4.5 h-4.5 text-orange-600" />
                Série de Produtos Mais Vendidos
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Os 5 itens de maior giro comercial no histórico do caixa.</p>
            </div>
            <button
              onClick={() => onNavigateToTab('pdv')}
              className="text-xs text-orange-600 hover:text-orange-700 font-bold hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              Frente de Vendas
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {bestSellers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Nenhuma venda registrada até o momento.</p>
            </div>
          ) : (
            <div className="space-y-4.5">
              {bestSellers.map((item, idx) => {
                const percentRank = Math.round((item.qty / maxSellsQty) * 100);
                return (
                  <div key={item.id} className="flex items-center gap-3">
                    {/* Badge Position */}
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-[11px] ${
                      idx === 0 ? 'bg-amber-100 text-amber-800' :
                      idx === 1 ? 'bg-slate-100 text-slate-700' :
                      idx === 2 ? 'bg-orange-50 text-orange-850' : 'bg-slate-50 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    
                    {/* Progress Bar content */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-850 truncate max-w-[200px]">{item.name}</span>
                        <span className="font-mono text-slate-500 font-medium">
                          {item.qty} un • <span className="font-extrabold text-slate-800">{formatMZN(item.revenue)}</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-600 rounded-full transition-all duration-300"
                          style={{ width: `${percentRank}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
