import { CartItem, PaymentMethod, StoreConfig } from '../types';

export function printThermalReceipt(
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
  },
  storeConfig: StoreConfig
) {
  // Open an isolated, unbordered and clean browser tab targeted for printing the receipt specifically
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const formatMZN = (val: number) => {
    return val.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MT';
  };

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
        return String(method).toUpperCase();
    }
  };

  const formattedDate = new Date(sale.timestamp).toLocaleString('pt-MZ');
  const hasTaxDetails = !!(sale.customerNuit?.trim() && sale.customerAddress?.trim());
  const ivaVal = hasTaxDetails ? Math.max(0, sale.subtotal - sale.discount) * 0.16 : 0;

  const itemsHtml = sale.items
    .map((item, index) => {
      const itemNum = String(index + 1).padStart(2, '0');
      const totalItem = formatMZN(item.product.salePrice * item.quantity);
      return `
        <div style="margin-bottom: 5px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${itemNum} • ${item.product.name}</span>
            <span>${totalItem}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 8.5px; color: #444;">
            <span>Categoria: ${item.product.category}</span>
            <span>(${item.quantity} un x ${formatMZN(item.product.salePrice)})</span>
          </div>
        </div>
      `;
    })
    .join('');

  const customerHtml = (sale.customerName || sale.customerNuit || sale.customerAddress)
    ? `
      <div class="divider"></div>
      <div style="font-size: 9px; color: #111; line-height: 1.35; font-family: monospace;">
        <div class="font-bold" style="font-size: 8px; color: #555; text-transform: uppercase; margin-bottom: 2px;">DADOS DO CLIENTE</div>
        ${sale.customerName ? `<div class="row"><span>NOME/CLIENTE:</span><span class="font-bold">${sale.customerName.toUpperCase()}</span></div>` : ''}
        ${sale.customerNuit ? `<div class="row"><span>NUIT DO CLIENTE:</span><span class="font-bold">${sale.customerNuit}</span></div>` : ''}
        ${sale.customerAddress ? `<div class="row"><span>ENDEREÇO:</span><span class="font-bold">${sale.customerAddress.toUpperCase()}</span></div>` : ''}
      </div>
    `
    : '';

  const changeHtml = (sale.cashReceived !== undefined && sale.cashReceived > 0)
    ? `
      <div class="row"><span>VALOR RECEBIDO:</span><span>${formatMZN(sale.cashReceived)}</span></div>
      ${(sale.change !== undefined && sale.change > 0) ? `<div class="row font-bold" style="color: #047857;"><span>TROCO DEVOLVIDO:</span><span>${formatMZN(sale.change)}</span></div>` : ''}
    `
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Recibo de Venda simplificado — ${storeConfig.name || 'Canteen Master'}</title>
        <meta charset="utf-8">
        <style>
          @media print {
            body { 
              width: 76mm; 
              margin: 0 auto; 
              padding: 2mm; 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 10px; 
              line-height: 1.35; 
              color: #000; 
              background: #fff;
            }
            .no-print { display: none !important; }
            @page {
              size: auto;
              margin: 0;
            }
          }
          body { 
            max-width: 320px; 
            margin: 20px auto; 
            padding: 15px; 
            font-family: 'Courier New', Courier, monospace; 
            font-size: 11px; 
            line-height: 1.4; 
            border: 1px dashed #ccc; 
            background: #fff; 
            color: #000; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            border-radius: 8px;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .double-divider { border-top: 2px double #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; }
          .header-title { font-size: 13px; font-weight: bold; text-transform: uppercase; }
          .header-subtitle { font-size: 9px; text-transform: uppercase; margin-top: 2px; }
          .btn-print {
            display: block;
            width: 100%;
            padding: 11px;
            margin-bottom: 12px;
            background: #ea580c;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            text-align: center;
            font-family: system-ui, -apple-system, sans-serif;
            box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);
            transition: background 0.15s ease-in-out;
          }
          .btn-print:hover { background: #c2410c; }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">Confirmar e Imprimir Documento</button>
        </div>
        <div class="text-center">
          <span class="header-title">${storeConfig.name || 'CANTINA DE VENDAS'}</span><br/>
          <span class="header-subtitle">FATURA SIMPLIFICADA</span><br/>
          <span class="header-subtitle" style="font-weight: bold;">NUIT DA EMPRESA: ${storeConfig.nuit || '302195847'}</span><br/>
          ${storeConfig.contacts ? `<span class="header-subtitle">CONTAC.: ${storeConfig.contacts}</span><br/>` : ''}
          ${storeConfig.address ? `<span class="header-subtitle">${storeConfig.address}</span>` : ''}
        </div>
        
        <div class="double-divider"></div>
        <div class="row"><span>REGISTO ID:</span><span class="font-bold">${sale.saleId}</span></div>
        <div class="row"><span>DATA REGISTO:</span><span>${formattedDate}</span></div>
        <div class="row"><span>OPERADOR:</span><span class="font-bold uppercase">${sale.operatorName || 'SISTEMA'}</span></div>
        <div class="row"><span>SITUADOEM:</span><span class="font-bold">MAPUTO / MOÇAMBIQUE</span></div>
        
        ${customerHtml}
        
        <div class="divider"></div>
        <div style="font-size: 8.5px; font-weight: bold; color: #444; text-transform: uppercase; margin-bottom: 5px;" class="row">
          <span>DESCRIÇÃO DO ITEM</span>
          <span>VALOR (MT)</span>
        </div>
        
        ${itemsHtml}
        
        <div class="divider"></div>
        <div class="row"><span>SUBTOTAL DA VENDA:</span><span>${formatMZN(sale.subtotal)}</span></div>
        ${sale.discount > 0 ? `<div class="row font-bold" style="color: #b91c1c;"><span>DESCONTO DE VENDA:</span><span>-${formatMZN(sale.discount)}</span></div>` : ''}
        <div class="row"><span>VALOR SEM IVA:</span><span>${formatMZN(Math.max(0, sale.subtotal - sale.discount))}</span></div>
        <div class="row"><span>${hasTaxDetails ? 'IVA-IMPOSTO (16%):' : 'IVA-IMPOSTO (ISENTO):'}</span><span>${formatMZN(ivaVal)}</span></div>
        <div class="row font-bold" style="font-size: 13px; margin-top: 4px;"><span>VALOR TOTAL PAGO:</span><span>${formatMZN(sale.total)}</span></div>
        
        <div class="divider"></div>
        <div class="row"><span>CANAL UTILIZADO:</span><span class="font-bold uppercase">${getChannelLabel(sale.paymentMethod)}</span></div>
        ${changeHtml}
        
        <div class="double-divider"></div>
        <div class="text-center" style="font-size: 8px; color: #555; margin-top: 10px; line-height: 1.4;">
          <span class="font-bold">Canteen Master — Software de Gestão de Vendas</span><br/>
          <span>Obrigado pela preferência e volte sempre!</span><br/>
          <span>Produzido nos termos do Regulamento de Faturação de Moçambique</span>
        </div>
        
        <script>
          // Soft-trigger browser print dialog with slight timeout
          window.addEventListener('DOMContentLoaded', () => {
             setTimeout(() => {
                window.print();
             }, 350);
          });
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
