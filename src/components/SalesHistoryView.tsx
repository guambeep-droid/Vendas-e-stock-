/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sale, StoreConfig, PlatformUser } from '../types';
import ThermalReceipt from './ThermalReceipt';
import { printThermalReceipt } from '../utils/printUtils';
import { 
  History, 
  Search, 
  Eye, 
  Calendar,
  X,
  Undo2,
  Receipt,
  Printer,
  FileSpreadsheet,
  Download
} from 'lucide-react';

interface SalesHistoryViewProps {
  sales: Sale[];
  onRollbackSale: (saleId: string) => void;
  storeConfig: StoreConfig;
  currentUser: PlatformUser | null;
}

export default function SalesHistoryView({
  sales,
  onRollbackSale,
  storeConfig,
  currentUser,
}: SalesHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'todos' | 'mpesa' | 'emola' | 'dinheiro' | 'cartao'>('todos');
  
  // Selected sale for detailed drill-down modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Print Statement State
  const [isPrintingStatement, setIsPrintingStatement] = useState(false);

  // Filter computation
  const filteredSales = sales.filter((s) => {
    const matchesId = s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProduct = s.items.some((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesSearch = matchesId || matchesProduct;

    const matchesMethod = methodFilter === 'todos' || s.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Currency helper
  const formatMZN = (val: number) => {
    return val.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MT';
  };

  const paymentLabels: Record<string, { label: string; badge: string }> = {
    dinheiro: { label: 'Dinheiro', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    cartao: { label: 'Cartão BIM/BCI', badge: 'bg-orange-50 text-orange-700 border-orange-100' },
    mpesa: { label: 'M-Pesa', badge: 'bg-red-50 text-red-705 border-red-100' },
    emola: { label: 'e-Mola', badge: 'bg-orange-50 text-orange-700 border-orange-100' },
  };

  // Billing statement aggregate metrics
  const totalFaturadoBruto = filteredSales.reduce((acc, s) => acc + s.subtotal, 0);
  const totalDescontos = filteredSales.reduce((acc, s) => acc + s.discount, 0);
  const totalFaturadoLiquido = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalLucro = filteredSales.reduce((acc, s) => acc + s.profit, 0);

  const totalMetodos = filteredSales.reduce((acc, s) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.total;
    return acc;
  }, {} as Record<string, number>);

  // Export current filtered sales as custom Portuguese-optimized billing extract CSV
  const handleExportCSV = () => {
    const BOM = '\uFEFF';
    const csvHeaders = 'ID da Transação;Data e Hora;Artigos Vendidos;Método de Pagamento;Subtotal (MT);Desconto (MT);Total Cobrado (MT);Margem de Lucro (MT);Nome do Cliente;NUIT do Cliente;Endereço do Cliente\n';
    
    const csvRows = filteredSales.map((s) => {
      const dateStr = new Date(s.timestamp).toLocaleString('pt-MZ');
      const itemsStr = s.items.map((it) => `${it.quantity}x ${it.name}`).join(' | ');
      const paymentMethodStr = paymentLabels[s.paymentMethod]?.label || s.paymentMethod;
      const clientName = s.customerName || 'Consumidor Final';
      const clientNuit = s.customerNuit || 'Isento';
      const clientAddress = s.customerAddress || 'N/A';
      
      const escapedItems = itemsStr.replace(/"/g, '""');
      const escapedClientName = clientName.replace(/"/g, '""');
      const escapedClientAddress = clientAddress.replace(/"/g, '""');
      
      return `"${s.id}";"${dateStr}";"${escapedItems}";"${paymentMethodStr}";${s.subtotal.toFixed(2)};${s.discount.toFixed(2)};${s.total.toFixed(2)};${s.profit.toFixed(2)};"${escapedClientName}";"${clientNuit}";"${escapedClientAddress}"`;
    }).join('\n');

    const blob = new Blob([BOM + csvHeaders + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `extrato_faturacao_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintStatement = () => {
    setIsPrintingStatement(true);
    setTimeout(() => {
      window.print();
      setIsPrintingStatement(false);
    }, 200);
  };

  return (
    <div className="space-y-6" id="sales-history-view">
      {/* Control filter blocks */}
      <div className="bg-white p-6 border border-slate-200/80 rounded-2xl shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-orange-500" />
              Histórico Geral de Faturamento ({filteredSales.length} transações)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Visão unificada das vendas fechadas no caixa e controle de estorno de mercadorias.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Export CVS Button */}
            <button
              onClick={handleExportCSV}
              disabled={filteredSales.length === 0}
              className={`px-3.5 py-2 border rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-205 cursor-pointer ${
                filteredSales.length === 0
                  ? 'bg-slate-50 border-slate-200 text-slate-350 cursor-not-allowed opacity-60'
                  : 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-600 hover:shadow-2xs active:scale-[0.98]'
              }`}
              title={filteredSales.length === 0 ? 'Sem dados para exportar' : 'Exportar Extrato em formato Excel/CSV'}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar (CSV)</span>
            </button>

            {/* Print Statement Button */}
            <button
              onClick={handlePrintStatement}
              disabled={filteredSales.length === 0}
              className={`px-3.5 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-205 cursor-pointer ${
                filteredSales.length === 0
                  ? 'bg-slate-50 border-slate-200 text-slate-350 cursor-not-allowed opacity-60'
                  : 'bg-orange-50 hover:bg-orange-100/70 border-orange-200 text-orange-600 hover:shadow-2xs active:scale-[0.98]'
              }`}
              title={filteredSales.length === 0 ? 'Sem dados para imprimir' : 'Imprimir extrato de auditoria formatado para 76mm'}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Extrato</span>
            </button>
          </div>
        </div>

        {/* Input filters row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Search bar ID or string product */}
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID da Venda (Ex: VNDA-123) ou termo das mercadorias vendidas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50 placeholder-slate-450 font-medium"
            />
          </div>

          {/* Payment Method filter Selector */}
          <div className="md:col-span-4">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="w-full bg-slate-50 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer font-bold text-slate-600"
            >
              <option value="todos">Todos os Métodos de Recebimento</option>
              <option value="mpesa">Faturação por M-Pesa</option>
              <option value="emola">Faturação por e-Mola</option>
              <option value="dinheiro">Dinheiro Físico (Meticais)</option>
              <option value="cartao">Cartão POS (BIM/BCI)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consolidated Metrics Summary Frame for current filtered view */}
      {filteredSales.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="billing-summary-metrics">
          {/* Total Transactions Card */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-3xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transações Emitidas</span>
            <p className="text-lg font-black font-mono text-slate-800 mt-0.5">{filteredSales.length}</p>
            <div className="mt-1.5 text-[9px] text-slate-400 font-medium font-sans">Lançamentos no filtro atual</div>
          </div>

          {/* Faturado Bruto Card */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-3xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bruto</span>
            <p className="text-lg font-black font-mono text-slate-800 mt-0.5">{formatMZN(totalFaturadoBruto)}</p>
            <div className="mt-1.5 text-[9px] text-slate-400 font-medium font-sans">Soma total sem descontos</div>
          </div>

          {/* Faturamento Líquido Card */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-3xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Faturado Líquido</span>
            <p className="text-lg font-black font-mono text-emerald-600 mt-0.5">{formatMZN(totalFaturadoLiquido)}</p>
            {totalDescontos > 0 ? (
              <div className="mt-1.5 text-[9px] text-rose-500 font-bold flex justify-between items-center font-sans">
                <span>-{formatMZN(totalDescontos)} em descontos</span>
              </div>
            ) : (
              <div className="mt-1.5 text-[9px] text-slate-400 font-medium font-sans">Nenhum desconto aplicado</div>
            )}
          </div>

          {/* Margem de Lucro Card */}
          <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-3xs flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Margem Líquida</span>
            <p className="text-lg font-black font-mono text-indigo-600 mt-0.5">{formatMZN(totalLucro)}</p>
            <div className="mt-1.5 text-[9px] text-indigo-600 font-bold font-sans">
              Rendimento real estimado
            </div>
          </div>
        </div>
      )}

      {/* Grid Table history feed */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {filteredSales.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <History className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-semibold">Nenhum registro de faturamento encontrado.</p>
            <p className="text-xs text-slate-400 mt-1">Realize checkouts na Frente de Vendas (PDV) para preencher os relatórios.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">ID Registro</th>
                  <th className="py-3 px-6">Data e Lançamento</th>
                  <th className="py-3 px-6">Operador</th>
                  <th className="py-3 px-6">Resumo das Mercadorias</th>
                  <th className="py-3 px-6 text-center">Método</th>
                  <th className="py-3 px-6 text-right">Subtotal</th>
                  <th className="py-3 px-6 text-right font-bold text-slate-750">Faturado Brut</th>
                  <th className="py-3 px-6 text-right text-emerald-600">Margem Líq.</th>
                  <th className="py-3 px-6 text-right">Visualização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {filteredSales.map((sale) => {
                  const dateFormatted = new Date(sale.timestamp).toLocaleString('pt-MZ');
                  
                  const itemsLabel = sale.items
                    .map((it) => `${it.quantity}x ${it.name}`)
                    .join(', ');

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* ID */}
                      <td className="py-4 px-6 font-mono text-orange-600 font-extrabold select-all">
                        {sale.id}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-slate-500 whitespace-nowrap">
                        {dateFormatted}
                      </td>

                      {/* Operator Name */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 bg-slate-150/70 border border-slate-200/50 px-2 py-0.5 rounded-lg text-[10px]">
                          {sale.operatorName || 'Sistema'}
                        </span>
                      </td>

                      {/* Items Join */}
                      <td className="py-4 px-6 max-w-[280px]">
                        <p className="font-bold text-slate-800 truncate" title={itemsLabel}>
                          {itemsLabel}
                        </p>
                      </td>

                      {/* Payment method */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                          paymentLabels[sale.paymentMethod]?.badge || 'bg-slate-100'
                        }`}>
                          {paymentLabels[sale.paymentMethod]?.label || sale.paymentMethod}
                        </span>
                      </td>

                      {/* Subtotal */}
                      <td className="py-4 px-6 text-right font-mono text-slate-400">
                        {formatMZN(sale.subtotal)}
                      </td>

                      {/* Total Net */}
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-800">
                        {formatMZN(sale.total)}
                      </td>

                      {/* Margem Lucro */}
                      <td className="py-4 px-6 text-right font-mono font-bold text-emerald-600">
                        {formatMZN(sale.profit)}
                      </td>

                      {/* Action triggers */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            title="Visualizar Cupom de Caixa"
                            className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-orange-500 cursor-pointer transition-colors duration-200"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {currentUser?.role === 'gestor' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Atenção: Deseja realmente ESTORNAR a venda ${sale.id}? Esta ação restaurará as quantidades vendidas de volta ao Estoque.`)) {
                                  onRollbackSale(sale.id);
                                }
                              }}
                              title="Estornar Venda (Devolver estoque)"
                              className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer transition-colors duration-200"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction drilling check receipt pop up details modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto overflow-x-auto">
          <div className="bg-white p-5 sm:p-6 my-auto rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl relative overflow-y-auto overflow-x-auto max-h-[92vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedSale(null)}
              className="absolute right-5 top-5 p-1 rounded-lg hover:bg-slate-105 text-slate-400 hover:text-slate-605 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-4 select-none">
              <Receipt className="w-5 h-5 text-orange-500" />
              Detalhamento de Transação
            </h3>

            {/* Simulated thermal slip layout */}
            <div className="bg-amber-50/10 border border-amber-200/50 p-5 rounded-2xl font-mono text-[11px] text-slate-700 space-y-4">
              <div className="text-center pb-3 border-b border-dashed border-slate-305">
                <h4 className="font-extrabold text-[12px] text-slate-900 uppercase leading-snug">{storeConfig?.name || 'SISTEMA DE VENDAS'}</h4>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">FACTURA SIMPLIFICADA</p>
                <p className="text-[9px] text-slate-500 font-bold">NUIT: {storeConfig?.nuit || '302195847'}</p>
                {storeConfig?.contacts && (
                  <p className="text-[8px] text-slate-400 font-semibold leading-none">CONT.: {storeConfig.contacts}</p>
                )}
                {storeConfig?.address && (
                  <p className="text-[8px] text-slate-450 font-semibold uppercase truncate leading-none mt-0.5" title={storeConfig.address}>{storeConfig.address}</p>
                )}
                <p className="text-[10px] text-orange-500 font-bold mt-1.5 pt-1.5 border-t border-dashed border-slate-200/60">REGISTRO: {selectedSale.id}</p>
                <p className="text-[9px] text-slate-405 leading-none mt-1">
                  {new Date(selectedSale.timestamp).toLocaleString('pt-MZ')}
                </p>
                <p className="text-[9px] text-slate-500 font-bold mt-1">
                  OPERADOR: {selectedSale.operatorName || 'Sistema'}
                </p>
              </div>

              {/* Customer details nested */}
              {(selectedSale.customerName || selectedSale.customerNuit || selectedSale.customerAddress) && (
                <div className="pt-1 pb-3 border-b border-dashed border-slate-300 space-y-1 text-[10px] text-slate-500 font-sans">
                  <div className="font-bold text-[8px] text-slate-400 tracking-wider uppercase pb-0.5">DADOS DO CLIENTE</div>
                  {selectedSale.customerName && (
                    <div className="flex justify-between">
                      <span>NOME:</span>
                      <span className="font-bold text-slate-700 uppercase">{selectedSale.customerName}</span>
                    </div>
                  )}
                  {selectedSale.customerNuit && (
                    <div className="flex justify-between">
                      <span>NUIT:</span>
                      <span className="font-semibold text-slate-700">{selectedSale.customerNuit}</span>
                    </div>
                  )}
                  {selectedSale.customerAddress && (
                    <div className="flex justify-between">
                      <span>MORADA:</span>
                      <span className="font-semibold text-slate-700 uppercase truncate max-w-[150px]" title={selectedSale.customerAddress}>
                        {selectedSale.customerAddress}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Items Table details loop */}
              <div className="space-y-2.5 text-[10px]">
                {selectedSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="max-w-[190px]">
                      <span className="font-bold text-slate-800">
                        {item.quantity}x {item.name}
                      </span>
                      <p className="text-[8px] text-slate-400">Preço unit: {formatMZN(item.salePrice)}</p>
                    </div>
                    <span className="font-bold text-slate-800">{formatMZN(item.salePrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals split */}
              <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5 font-sans text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatMZN(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Desconto concedido:</span>
                    <span className="font-mono">-{formatMZN(selectedSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Valor sem IVA:</span>
                  <span className="font-mono">{formatMZN(Math.max(0, selectedSale.subtotal - selectedSale.discount))}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>IVA-Imposto (16%):</span>
                  <span className="font-mono">+{formatMZN(Math.max(0, selectedSale.subtotal - selectedSale.discount) * 0.16)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-850 text-xs border-t border-slate-105 pt-2 font-sans">
                  <span>PAGO EM METICAIS:</span>
                  <span className="text-emerald-600 font-bold font-mono">{formatMZN(selectedSale.total)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-teal-800 bg-teal-50 border border-teal-100 p-2 rounded-xl font-bold mt-2">
                  <span>Margem obtida:</span>
                  <span>{formatMZN(selectedSale.profit)}</span>
                </div>
              </div>

              {/* Payment selection meta */}
              <div className="text-[10px] space-y-1 pt-3 border-t border-dashed border-slate-300 font-sans text-slate-500">
                <div className="flex justify-between">
                  <span>Método de Pagamento:</span>
                  <span className="font-bold uppercase text-orange-500">{selectedSale.paymentMethod}</span>
                </div>
                {selectedSale.amountPaid !== undefined && (
                  <div className="flex justify-between">
                    <span>Valor Recebido:</span>
                    <span className="font-mono">{formatMZN(selectedSale.amountPaid)}</span>
                  </div>
                )}
                {selectedSale.change !== undefined && (
                  <div className="flex justify-between">
                    <span>Troco Devolvido:</span>
                    <span className="font-mono">{formatMZN(selectedSale.change)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Print and Close triggers */}
            <div className="mt-4 font-sans grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (selectedSale) {
                    const mappedSale = {
                      items: selectedSale.items.map((item) => ({
                        product: {
                          id: item.productId,
                          code: '',
                          name: item.name,
                          category: '',
                          costPrice: item.costPrice,
                          salePrice: item.salePrice,
                          quantity: 0,
                          minStock: 0,
                        },
                        quantity: item.quantity,
                      })),
                      subtotal: selectedSale.subtotal,
                      discount: selectedSale.discount,
                      total: selectedSale.total,
                      paymentMethod: selectedSale.paymentMethod,
                      cashReceived: selectedSale.amountPaid,
                      change: selectedSale.change,
                      timestamp: selectedSale.timestamp,
                      saleId: selectedSale.id,
                      customerName: selectedSale.customerName,
                      customerNuit: selectedSale.customerNuit,
                      customerAddress: selectedSale.customerAddress,
                      operatorName: selectedSale.operatorName,
                    };
                    printThermalReceipt(mappedSale, storeConfig);
                  }
                }}
                className="py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all text-center flex items-center justify-center gap-2 active:scale-97"
              >
                <Printer className="w-4 h-4 text-white" />
                Imprimir Recibo
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 cursor-pointer transition-all text-center active:scale-97"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Area (rendered outside of #root using a React Portal) */}
      {selectedSale && createPortal(
        <div className="hidden select-none">
          <ThermalReceipt
            sale={{
              items: selectedSale.items.map((item) => ({
                product: {
                  id: item.productId,
                  code: '',
                  name: item.name,
                  category: '',
                  costPrice: item.costPrice,
                  salePrice: item.salePrice,
                  quantity: 0,
                  minStock: 0,
                },
                quantity: item.quantity,
              })),
              subtotal: selectedSale.subtotal,
              discount: selectedSale.discount,
              total: selectedSale.total,
              paymentMethod: selectedSale.paymentMethod,
              cashReceived: selectedSale.amountPaid,
              change: selectedSale.change,
              timestamp: selectedSale.timestamp,
              saleId: selectedSale.id,
              customerName: selectedSale.customerName,
              customerNuit: selectedSale.customerNuit,
              customerAddress: selectedSale.customerAddress,
              operatorName: selectedSale.operatorName,
            }}
            storeConfig={storeConfig}
          />
        </div>,
        document.body
      )}

      {/* Printable Full Statement Area (rendered outside of #root using a React Portal) */}
      {isPrintingStatement && createPortal(
        <div id="print-receipt-portal" className="bg-white text-black p-4 max-w-[76mm] text-xs font-mono">
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-black mb-3">
            <h3 className="font-extrabold text-[12px] uppercase leading-tight">
              {storeConfig?.name || 'SISTEMA DE VENDAS'}
            </h3>
            <p className="text-[10px] font-bold">EXTRATO DE FATURAÇÃO</p>
            <p className="text-[8px] text-gray-700 font-bold">NUIT: {storeConfig?.nuit || '302195847'}</p>
            {storeConfig?.contacts && (
              <p className="text-[8px] text-gray-700">CONT.: {storeConfig.contacts}</p>
            )}
            <div className="text-[8px] text-gray-600 mt-1">
              Gerado em: {new Date().toLocaleString('pt-MZ')}
            </div>
            {searchQuery && (
              <div className="text-[8px] italic text-gray-600">
                Filtro de busca: "{searchQuery}"
              </div>
            )}
            {methodFilter !== 'todos' && (
              <div className="text-[8px] italic text-gray-600">
                Canal: {paymentLabels[methodFilter]?.label || methodFilter}
              </div>
            )}
          </div>

          {/* Consolidated Financial Stats */}
          <div className="space-y-1 text-[10px] pb-3 border-b border-dashed border-black mb-3">
            <div className="font-bold text-[8.5px] text-gray-500 uppercase tracking-wider pb-1">CONSOLIDAÇÃO FINANCEIRA</div>
            <div className="flex justify-between">
              <span>Transações no Filtro:</span>
              <span className="font-bold">{filteredSales.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Faturamento Bruto:</span>
              <span>{formatMZN(totalFaturadoBruto)}</span>
            </div>
            {totalDescontos > 0 && (
              <div className="flex justify-between">
                <span>Descontos Concedidos:</span>
                <span>-{formatMZN(totalDescontos)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-black pt-1 mt-1">
              <span>FATURAMENTO LÍQUIDO:</span>
              <span>{formatMZN(totalFaturadoLiquido)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-750">
              <span>MARGEM ESTIMADA:</span>
              <span>{formatMZN(totalLucro)}</span>
            </div>
          </div>

          {/* Share per Payment Method */}
          <div className="space-y-1 text-[10px] pb-3 border-b border-dashed border-black mb-3">
            <div className="font-bold text-[8.5px] text-gray-500 uppercase tracking-wider pb-1">RECEBIMENTOS POR CANAL</div>
            {Object.keys(paymentLabels).map((method) => {
              const val = totalMetodos[method] || 0;
              if (val === 0 && methodFilter !== 'todos' && methodFilter !== method) return null;
              return (
                <div key={method} className="flex justify-between">
                  <span className="uppercase">{paymentLabels[method]?.label || method}:</span>
                  <span className="font-semibold">{formatMZN(val)}</span>
                </div>
              );
            })}
          </div>

          {/* List of Sales */}
          <div className="space-y-2 text-[9.5px]">
            <div className="font-bold text-[8.5px] text-gray-500 uppercase tracking-wider pb-1">HISTÓRICO DE LANÇAMENTOS</div>
            {filteredSales.map((sale, idx) => {
              const itemsCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <div key={sale.id} className="border-b border-dotted border-gray-300 pb-1.5 last:border-b-0">
                  <div className="flex justify-between font-bold">
                    <span>{String(idx + 1).padStart(2, '0')}. {sale.id}</span>
                    <span>{formatMZN(sale.total)}</span>
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-600">
                    <span>{new Date(sale.timestamp).toLocaleString('pt-MZ').slice(0, 16)}</span>
                    <span className="uppercase">{itemsCount} un • {paymentLabels[sale.paymentMethod]?.label || sale.paymentMethod}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-6 pt-3 border-t border-dashed border-black leading-tight">
            <p className="text-[9px] font-bold">Cantina Master App</p>
            <p className="text-[7.5px] text-gray-500 mt-1">FFvendas • Moçambique POS system</p>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
