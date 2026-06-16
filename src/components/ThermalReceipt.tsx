/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CartItem, PaymentMethod, StoreConfig } from '../types';
import { Receipt, QrCode, Phone, MapPin, Layers, Coins, Landmark, CreditCard, Sparkles } from 'lucide-react';

interface ThermalReceiptProps {
  sale: {
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    change?: number;
    timestamp: string;
    saleId: string;
    customerName?: string;
    customerNuit?: string;
    customerAddress?: string;
    operatorName?: string;
  };
  storeConfig: StoreConfig;
  confirmingSale?: boolean;
}

export default function ThermalReceipt({
  sale,
  storeConfig,
  confirmingSale = false
}: ThermalReceiptProps) {
  
  const hasTaxDetails = !!(sale?.customerNuit?.trim() && sale?.customerAddress?.trim());
  const ivaVal = hasTaxDetails ? Math.max(0, sale.subtotal - sale.discount) * 0.16 : 0;

  // Numeric MZN Helper
  const formatMZN = (val: number) => {
    return val.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MT';
  };

  // Channel Icon selection
  const getChannelIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'dinheiro':
        return <Coins className="w-3.5 h-3.5 text-emerald-600" />;
      case 'cartao':
        return <CreditCard className="w-3.5 h-3.5 text-blue-600" />;
      case 'mpesa':
        return <Phone className="w-3.5 h-3.5 text-red-500" />;
      case 'emola':
        return <Landmark className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <Receipt className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Channel labels matching the application naming
  const getChannelLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'dinheiro':
        return 'Dinheiro / Numerário';
      case 'cartao':
        return 'Cartão / POS';
      case 'mpesa':
        return 'M-Pesa (Vodacom)';
      case 'emola':
        return 'e-Mola (Movitel)';
      default:
        return (method as string).toUpperCase();
    }
  };

  // Format receipt details as a plain-text payload for standard QR scanners
  const getReceiptQRValue = () => {
    if (!sale) return '';
    const formattedDate = new Date(sale.timestamp).toLocaleString('pt-MZ');
    const itemsText = sale.items
      .map((item, index) => `${index + 1}. ${item.product.name} (Qtd: ${item.quantity} x ${formatMZN(item.product.salePrice)}) = ${formatMZN(item.product.salePrice * item.quantity)}`)
      .join('\n');

    return `*** RECIBO DIGITAL HIERÁRQUICO ***\n` +
      `${storeConfig?.name || 'CANTINA DE VENDAS'}\n` +
      `NUIT: ${storeConfig?.nuit || '302195847'}\n` +
      `------------------------------------\n` +
      `ID Transação: ${sale.saleId}\n` +
      `Operador: ${sale.operatorName || 'Sistema'}\n` +
      `Data e Hora: ${formattedDate}\n` +
      `Estado: ${confirmingSale ? 'RASCUNHO' : 'PAGA'}\n` +
      `Método Pagamento: ${getChannelLabel(sale.paymentMethod)}\n` +
      `------------------------------------\n` +
      `Produtos:\n` +
      `${itemsText}\n` +
      `------------------------------------\n` +
      `Subtotal: ${formatMZN(sale.subtotal)}\n` +
      `Desconto: ${formatMZN(sale.discount)}\n` +
      `Valor sem IVA: ${formatMZN(Math.max(0, sale.subtotal - sale.discount))}\n` +
      `${hasTaxDetails ? `IVA (16%): ${formatMZN(ivaVal)}` : 'IVA: Isento (0,00 MT)'}\n` +
      `Total Final: ${formatMZN(sale.total)}\n` +
      `------------------------------------\n` +
      `Agradecemos a sua preferência!`;
  };

  return (
    <div 
      id="print-receipt-portal" 
      className="bg-amber-50/5 border border-amber-200/60 p-4 sm:p-5 rounded-2xl font-mono text-xs text-slate-700 space-y-4 shadow-xs max-w-full mx-auto"
      style={{ width: '100%', maxWidth: '340px' }}
    >
      {/* Receipt Logo & Store Metadata */}
      <div className="text-center space-y-1.5 pb-4 border-b border-dashed border-slate-300">
        <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center border border-slate-200/50">
          <Receipt className="w-5.5 h-5.5 text-slate-700" />
        </div>
        <h3 className="font-extrabold text-[13px] tracking-tight text-slate-900 uppercase leading-snug">
          {storeConfig?.name || 'CANTINA MOÇAMBICANA'}
        </h3>
        
        {/* State Tag */}
        <div className="inline-block px-2.5 py-0.5 rounded-full text-[8.5px] font-black border tracking-wider uppercase">
          {confirmingSale ? (
            <span className="text-amber-700 bg-amber-50 border-amber-200/65 animate-pulse">
              Rascunho de Fatura
            </span>
          ) : (
            <span className="text-emerald-700 bg-emerald-50 border-emerald-200/65">
              Fatura Simplificada
            </span>
          )}
        </div>

        <div className="text-[9px] text-slate-450 font-bold space-y-0.5 pt-1">
          <p className="flex items-center justify-center gap-1 font-mono">
            <span>NUIT:</span> 
            <span className="text-slate-600 font-extrabold">{storeConfig?.nuit || '302195847'}</span>
          </p>
          {storeConfig?.contacts && (
            <p className="flex items-center justify-center gap-1.5 font-mono">
              <Phone className="w-2.5 h-2.5" />
              <span>{storeConfig.contacts}</span>
            </p>
          )}
          {storeConfig?.address && (
            <p className="flex items-center justify-center gap-1 font-mono uppercase text-center leading-tight truncate px-2">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span>{storeConfig.address}</span>
            </p>
          )}
        </div>
      </div>

      {/* Sale Core Info Block */}
      <div className="space-y-1 text-[10px] text-slate-500 font-mono py-1">
        <div className="flex justify-between">
          <span>REGISTO ID:</span>
          <span className="font-extrabold text-slate-800">{sale.saleId}</span>
        </div>
        <div className="flex justify-between">
          <span>DATA REGISTO:</span>
          <span className="text-slate-700">
            {new Date(sale.timestamp).toLocaleString('pt-MZ')}
          </span>
        </div>
        <div className="flex justify-between">
          <span>OPERADOR:</span>
          <span className="text-slate-800 font-extrabold uppercase">
            {sale.operatorName || 'Sistema'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>SITUADO:</span>
          <span className="text-slate-800 font-extrabold uppercase">MAPUTO / MZ</span>
        </div>
      </div>

      {/* Client Information */}
      {(sale.customerName || sale.customerNuit || sale.customerAddress) ? (
        <div className="pt-2.5 border-t border-dashed border-slate-300 space-y-1 text-[10px] text-slate-500">
          <div className="text-[8.5px] font-black text-slate-400 tracking-wider uppercase pb-0.5">DADOS DO CLIENTE</div>
          {sale.customerName && (
            <div className="flex justify-between">
              <span>NOME:</span>
              <span className="font-bold text-slate-800 uppercase truncate max-w-[170px]">{sale.customerName}</span>
            </div>
          )}
          {sale.customerNuit && (
            <div className="flex justify-between">
              <span>NUIT:</span>
              <span className="font-extrabold text-slate-800">{sale.customerNuit}</span>
            </div>
          )}
          {sale.customerAddress && (
            <div className="flex justify-between">
              <span>MORADA:</span>
              <span className="font-semibold text-slate-800 uppercase truncate max-w-[170px]" title={sale.customerAddress}>
                {sale.customerAddress}
              </span>
            </div>
          )}
        </div>
      ) : null}

      {/* Items List Header */}
      <div className="pt-3 border-t border-dashed border-slate-300 space-y-2">
        <div className="flex justify-between font-extrabold text-[9px] text-slate-400 uppercase tracking-wider">
          <span>Descrição do Item</span>
          <span>VALOR (MT)</span>
        </div>
        
        {/* Dynamic items iteration */}
        <div className="space-y-2.5">
          {sale.items.map((item, index) => (
            <div key={item.product.id} className="text-[10px] space-y-0.5">
              <div className="flex justify-between items-start gap-1">
                <span className="font-extrabold text-slate-800 break-words flex-1 pr-1 font-mono">
                  {String(index + 1).padStart(2, '0')} • {item.product.name}
                </span>
                <span className="font-bold text-slate-805 shrink-0 font-mono">
                  {formatMZN(item.product.salePrice * item.quantity)}
                </span>
              </div>
              <div className="text-[9px] text-slate-400 font-sans tracking-wide leading-none flex items-center justify-between">
                <span>Categoria: {item.product.category}</span>
                <span className="font-mono">({item.quantity} un x {formatMZN(item.product.salePrice)})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subtotal, tax & discount list */}
      <div className="pt-3 border-t border-dashed border-slate-300 space-y-1.5 font-sans">
        <div className="flex justify-between text-[11px] text-slate-500 font-medium font-mono">
          <span>Subtotal:</span>
          <span>{formatMZN(sale.subtotal)}</span>
        </div>
        
        {sale.discount > 0 && (
          <div className="flex justify-between text-[11px] text-rose-600 font-extrabold font-mono">
            <span>Desconto Concedido:</span>
            <span>-{formatMZN(sale.discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-[11px] text-slate-500 font-medium font-mono">
          <span>Valor sem IVA:</span>
          <span>{formatMZN(Math.max(0, sale.subtotal - sale.discount))}</span>
        </div>

        <div className="flex justify-between text-[11px] text-slate-500 font-medium font-mono">
          <span>{hasTaxDetails ? 'IVA-Imposto (16%):' : 'IVA-Imposto (Isento):'}</span>
          <span>{formatMZN(ivaVal)}</span>
        </div>

        <div className="flex justify-between text-xs font-black border-t border-slate-200/50 pt-2 text-slate-850 font-sans">
          <span>{confirmingSale ? 'TOTAL DO RASCUNHO:' : 'VALOR A COBRAR (MZN):'}</span>
          <span className="text-[13px] text-emerald-600 font-mono font-black scale-y-105 inline-block">
            {formatMZN(sale.total)}
          </span>
        </div>
      </div>

      {/* Payment details summary */}
      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-[10px] space-y-1 text-slate-600 font-sans">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-slate-500">
            {getChannelIcon(sale.paymentMethod)}
            Canal Utilizado:
          </span>
          <span className="font-extrabold uppercase text-slate-800 font-mono">
            {getChannelLabel(sale.paymentMethod)}
          </span>
        </div>
        {sale.cashReceived !== undefined && sale.cashReceived > 0 && (
          <>
            <div className="flex justify-between items-center text-[9.5px]">
              <span className="text-slate-500 font-mono">Valor Pago pelo Cliente:</span>
              <span className="font-mono font-bold text-slate-700">{formatMZN(sale.cashReceived)}</span>
            </div>
            {sale.change !== undefined && sale.change > 0 && (
              <div className="flex justify-between items-center pt-0.5 border-t border-slate-100 font-mono">
                <span className="text-emerald-700 font-bold">Troco a Devolver:</span>
                <span className="font-mono font-black text-emerald-600 text-[11px]">{formatMZN(sale.change)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mozambique interactive digital QR payload */}
      <div className="flex flex-col items-center justify-center pt-3 border-t border-dashed border-slate-300 space-y-2 font-sans text-center">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1 justify-center">
          <QrCode className="w-3 h-3 text-emerald-600 shrink-0" />
          Fatura Digital QR
        </span>
        <p className="text-[7.5px] text-slate-400 leading-normal max-w-[200px]">
          Fins de validação fiscal do cliente de acordo com a Pauta Aduaneira. Aponte a sua câmara.
        </p>
        <div className="bg-white p-2 rounded-xl border border-slate-200/70 shadow-xs flex items-center justify-center mix-blend-multiply">
          <QRCodeSVG
            value={getReceiptQRValue()}
            size={105}
            level="H"
            fgColor="#1e293b"
            bgColor="#ffffff"
            includeMargin={false}
          />
        </div>
        
        {/* Footer words */}
        <div className="pt-2 font-mono text-[8.5px] text-slate-500/85">
          <div className="flex items-center justify-center gap-1 text-[8px] tracking-wide font-black uppercase text-slate-400">
            <Sparkles className="w-2.5 h-2.5 text-orange-500" />
            <span>Cantina Master App</span>
          </div>
          <p className="mt-0.5">Obrigado pela preferência e volte sempre!</p>
          <p className="text-[7px] text-slate-400 mt-0.5 font-bold">Produzido nos termos do Regulamento de Faturação de Moçambique</p>
        </div>
      </div>
    </div>
  );
}
