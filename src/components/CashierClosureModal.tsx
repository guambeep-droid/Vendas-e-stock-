import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  DollarSign, 
  Printer, 
  History, 
  Calendar, 
  AlertTriangle, 
  ArrowRight, 
  FileSpreadsheet, 
  Lock, 
  User, 
  Plus, 
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { Sale, StoreConfig, PlatformUser, CashierClosure, PaymentMethod } from '../types';

interface CashierClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: PlatformUser | null;
  sales: Sale[];
  closures: CashierClosure[];
  onSaveClosure: (closure: CashierClosure) => void;
  storeConfig: StoreConfig;
}

export default function CashierClosureModal({
  isOpen,
  onClose,
  currentUser,
  sales,
  closures,
  onSaveClosure,
  storeConfig,
}: CashierClosureModalProps) {
  const [activeTab, setActiveTab] = useState<'efectuar-fecho' | 'historico-fechos'>('efectuar-fecho');
  const [physicalCashStr, setPhysicalCashStr] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdClosure, setCreatedClosure] = useState<CashierClosure | null>(null);
  const [selectedHistoricalClosure, setSelectedHistoricalClosure] = useState<CashierClosure | null>(null);

  if (!isOpen || !currentUser) return null;

  // Find the last closure datetime for the current active operator
  const lastUserClosure = [...closures]
    .filter(c => c.operatorName === currentUser.name)
    .sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime())[0];

  const openingDate = lastUserClosure
    ? new Date(lastUserClosure.closedAt)
    : new Date(0); // Unix Epoch if no previous closure exists

  // Filter sales for current active operator since their last closure
  const activeSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    const isByOperator = sale.operatorName === currentUser.name;
    const isAfterOpening = saleDate > openingDate;
    return isByOperator && isAfterOpening;
  });

  // Aggregate stats
  let expectedCash = 0;
  let totalMpesa = 0;
  let totalEmola = 0;
  let totalCartao = 0;
  let totalSales = 0;

  activeSales.forEach(sale => {
    totalSales += sale.total;
    if (sale.paymentMethod === 'dinheiro') {
      expectedCash += sale.total;
    } else if (sale.paymentMethod === 'mpesa') {
      totalMpesa += sale.total;
    } else if (sale.paymentMethod === 'emola') {
      totalEmola += sale.total;
    } else if (sale.paymentMethod === 'cartao') {
      totalCartao += sale.total;
    }
  });

  const mpesaCount = activeSales.filter(s => s.paymentMethod === 'mpesa').length;
  const emolaCount = activeSales.filter(s => s.paymentMethod === 'emola').length;
  const cartaoCount = activeSales.filter(s => s.paymentMethod === 'cartao').length;
  const dinheiroCount = activeSales.filter(s => s.paymentMethod === 'dinheiro').length;

  const physicalCash = parseFloat(physicalCashStr) || 0;
  const discrepancy = physicalCash - expectedCash;

  // Quick cash counter aids based on Mozambican currency notes (Meticais: 20, 50, 100, 200, 500, 1000)
  const quickNotes = [20, 50, 100, 200, 500, 1000];
  const handleAddNotes = (val: number) => {
    const current = parseFloat(physicalCashStr) || 0;
    setPhysicalCashStr((current + val).toString());
  };

  const clearPhysicalCash = () => {
    setPhysicalCashStr('');
  };

  const handleSubmitClosure = (e: React.FormEvent) => {
    e.preventDefault();

    const closure: CashierClosure = {
      id: `FECHO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      openedAt: openingDate.getTime() === 0 
        ? (activeSales.length > 0 ? activeSales[activeSales.length - 1].timestamp : new Date().toISOString())
        : openingDate.toISOString(),
      closedAt: new Date().toISOString(),
      salesCount: activeSales.length,
      expectedCash: expectedCash,
      physicalCash: physicalCash,
      discrepancy: discrepancy,
      totalMpesa: totalMpesa,
      totalEmola: totalEmola,
      totalCartao: totalCartao,
      totalSales: totalSales,
      notes: notes.trim() || undefined,
    };

    onSaveClosure(closure);
    setCreatedClosure(closure);
    setIsSuccess(true);
    // Reset state
    setPhysicalCashStr('');
    setNotes('');
  };

  const handlePrintThermal = (closureObj: CashierClosure) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatCurrency = (val: number) => `${val.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;

    const htmlContent = `
      <html>
        <head>
          <title>Talão de Fecho de Caixa</title>
          <style>
            @media print {
              body { width: 80mm; margin: 0; padding: 5mm; font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.3; }
            }
            body { max-width: 320px; margin: 20px auto; padding: 15px; font-family: 'Courier New', Courier, monospace; font-size: 11.5px; line-height: 1.4; border: 1px dashed #ccc; box-sizing: border-box; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .double-divider { border-top: 2px double #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; }
            .header-title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
            .header-subtitle { font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
            .discrepancy-box { border: 1px solid #000; padding: 4px; margin: 8px 0; font-weight: bold; }
            .sign-area { margin-top: 30px; text-align: center; }
            .sign-line { border-top: 1px solid #000; width: 80%; margin: 20px auto 4px auto; }
            .sign-label { font-size: 9px; text-transform: uppercase; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="text-center">
            <span class="header-title">${storeConfig.name || 'CANTEEN MASTER'}</span><br/>
            <span class="header-subtitle">${storeConfig.address || 'MAPUTO, MZ'}</span><br/>
            <span class="header-subtitle">NUIT: ${storeConfig.nuit || '302195847'}</span><br/>
            <span style="font-size: 9px;">Tel: ${storeConfig.contacts || '---'}</span>
          </div>
          
          <div class="double-divider"></div>
          <div class="text-center font-bold" style="font-size: 12px; letter-spacing: 1px; margin: 4px 0;">
            TALÃO DE FECHO DE CAIXA
          </div>
          <div class="double-divider"></div>

          <div class="row"><span>ID Fecho:</span><span>${closureObj.id}</span></div>
          <div class="row"><span>Data Fecho:</span><span>${new Date(closureObj.closedAt).toLocaleString('pt-MZ')}</span></div>
          <div class="row"><span>Vendedor:</span><span class="font-bold">${closureObj.operatorName}</span></div>
          <div class="row"><span>Status:</span><span class="font-bold">FECHADO</span></div>
          
          <div class="divider"></div>
          <div class="text-center font-bold">PERÍODO DO TURNO</div>
          <div class="text-center" style="font-size: 10px;">
            De: ${new Date(closureObj.openedAt).toLocaleString('pt-MZ')}<br/>
            Até: ${new Date(closureObj.closedAt).toLocaleString('pt-MZ')}
          </div>
          <div class="divider"></div>

          <div class="row font-bold"><span>RESUMO DE VENDAS</span><span class="text-right">QTD / VALOR</span></div>
          <div class="divider"></div>
          
          <div class="row"><span>VENDAS EM DINHEIRO:</span><span>(${dinheiroCount}) ${formatCurrency(closureObj.expectedCash)}</span></div>
          <div class="row"><span>VENDAS EM M-PESA:</span><span>(${mpesaCount}) ${formatCurrency(closureObj.totalMpesa)}</span></div>
          <div class="row"><span>VENDAS EM E-MOLA:</span><span>(${emolaCount}) ${formatCurrency(closureObj.totalEmola)}</span></div>
          <div class="row"><span>VENDAS EM CARTÃO:</span><span>(${cartaoCount}) ${formatCurrency(closureObj.totalCartao)}</span></div>
          
          <div class="divider"></div>
          <div class="row font-bold" style="font-size: 12px;">
            <span>TOTAL FACTURADO:</span>
            <span>${formatCurrency(closureObj.totalSales)}</span>
          </div>
          <div class="double-divider"></div>
          
          <div class="text-center font-bold">CONCILIAÇÃO FÍSICA (DINHEIRO)</div>
          <div class="divider"></div>
          
          <div class="row"><span>DINHEIRO ESPERADO:</span><span>${formatCurrency(closureObj.expectedCash)}</span></div>
          <div class="row"><span>DINHEIRO FÍSICO CONTADO:</span><span class="font-bold">${formatCurrency(closureObj.physicalCash)}</span></div>
          
          <div class="discrepancy-box text-center">
            DIFERENÇA: ${closureObj.discrepancy > 0 ? '+' : ''}${formatCurrency(closureObj.discrepancy)}
            <br/>
            <span style="font-size: 9px; font-weight: normal;">
              ${closureObj.discrepancy === 0 
                ? 'CAIXA CONCILIADO COM SUCESSO' 
                : closureObj.discrepancy < 0 
                  ? 'QUEBRA DE CAIXA (SITUAÇÃO DE DÉFICIT)' 
                  : 'SOBRA DE CAIXA'}
            </span>
          </div>

          ${closureObj.notes ? `
          <div class="divider"></div>
          <div class="font-bold">Observações:</div>
          <div style="font-size: 9.5px; border-left: 2px solid #000; padding-left: 5px; font-style: italic;">
            ${closureObj.notes}
          </div>
          ` : ''}

          <div class="double-divider"></div>
          
          <div class="sign-area">
            <div class="sign-line"></div>
            <div class="sign-label">Operador (${closureObj.operatorName})</div>
          </div>

          <div class="sign-area">
            <div class="sign-line"></div>
            <div class="sign-label">Supervisor / Gestor</div>
          </div>

          <div class="double-divider"></div>
          <div class="text-center" style="font-size: 9px; font-style: italic; margin-top: 15px;">
            Processado por Canteen Master MZ<br/>
            Muito obrigado pelo seu bom turno de trabalho!
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const renderActiveClosureForm = () => {
    if (isSuccess && createdClosure) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 border border-slate-100 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Fecho de Caixa Concluído!</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm">
            O caixa de <strong>{currentUser.name}</strong> foi devidamente fechado. O relatório de turno foi consolidado e registrado sob o ID <strong>{createdClosure.id}</strong>.
          </p>

          <div className="w-full mt-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-left max-w-sm">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-100 pb-2 flex justify-between">
              <span>DETALHES DO TURNO</span>
              <span>RASCUNHO</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-650">
                <span>Período:</span>
                <span className="font-bold text-slate-805 text-[10px] truncate max-w-[170px]">
                  {new Date(createdClosure.openedAt).toLocaleString('pt-MZ')} até {new Date(createdClosure.closedAt).toLocaleTimeString('pt-MZ')}
                </span>
              </div>
              <div className="flex justify-between text-slate-650">
                <span>Quantidade Vendas:</span>
                <span className="font-extrabold text-slate-800">{createdClosure.salesCount} transações</span>
              </div>
              <div className="flex justify-between text-slate-650 border-t border-slate-100 pt-1.5 mt-1">
                <span>Vendas no M-Pesa/E-Mola:</span>
                <span className="font-bold text-slate-850">
                  {((createdClosure.totalMpesa + createdClosure.totalEmola)).toLocaleString('pt-MZ')} MT
                </span>
              </div>
              <div className="flex justify-between text-slate-650">
                <span>Dinheiro Esperado:</span>
                <span className="font-bold text-slate-850">
                  {createdClosure.expectedCash.toLocaleString('pt-MZ')} MT
                </span>
              </div>
              <div className="flex justify-between text-slate-650 font-bold border-t border-dashed border-slate-200 pt-2 text-slate-800">
                <span>Dinheiro Físico:</span>
                <span>{createdClosure.physicalCash.toLocaleString('pt-MZ')} MT</span>
              </div>
              <div className="flex justify-between pt-1 font-extrabold">
                <span>Diferença:</span>
                <span className={createdClosure.discrepancy === 0 
                  ? 'text-emerald-600' 
                  : createdClosure.discrepancy < 0 
                    ? 'text-rose-600' 
                    : 'text-amber-500'}>
                  {createdClosure.discrepancy > 0 ? '+' : ''}{createdClosure.discrepancy.toLocaleString('pt-MZ')} MT
                  {createdClosure.discrepancy === 0 && ' (Coerente)'}
                  {createdClosure.discrepancy < 0 && ' (Déficit)'}
                  {createdClosure.discrepancy > 0 && ' (Excesso)'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 w-full max-w-sm mt-6">
            <button
              onClick={() => handlePrintThermal(createdClosure)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-950 text-white hover:bg-slate-800 rounded-xl cursor-pointer shadow-md text-xs font-black transition-colors duration-150 uppercase"
            >
              <Printer className="w-4 h-4 text-[#FFD100]" />
              Imprimir Talão
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                setCreatedClosure(null);
                onClose();
              }}
              className="flex-1 px-4 py-2.5 bg-slate-150 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-800 cursor-pointer text-xs font-black uppercase transition-colors"
            >
              Concluído
            </button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmitClosure} className="space-y-5 animate-in fade-in duration-200">
        {/* Dynamic header stats of current shift */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white shadow-xl">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#009739] animate-pulse"></div>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Período de Vendas Activo</span>
            </div>
            <span className="text-[9px] font-mono bg-slate-850 px-2.5 py-1 text-slate-300 rounded-md border border-slate-800">
              {currentUser.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border-r border-slate-850 pr-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase">Qtd de Vendas</span>
              <p className="text-xl font-black text-white mt-1">
                {activeSales.length} <span className="text-xs text-slate-400 font-bold">Vendas</span>
              </p>
              <span className="text-[8px] font-mono text-slate-500 block mt-1">
                Desde: {openingDate.getTime() === 0 ? 'Primeiro Reg.' : openingDate.toLocaleString('pt-MZ')}
              </span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Total Facturado</span>
              <p className="text-xl font-black text-[#FFD100] mt-1">
                {totalSales.toLocaleString('pt-MZ')} <span className="text-xs font-bold text-[#FFD100]/80">MT</span>
              </p>
              <span className="text-[8px] font-mono text-[#009739] font-bold block mt-1">
                Lançado na Sua Conta
              </span>
            </div>
          </div>

          {/* Breakdown methods */}
          <div className="mt-4 pt-3.5 border-t border-slate-850 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-1.5">
              <span className="text-[8px] font-black text-slate-400 block uppercase">Dinheiro</span>
              <span className="font-mono font-black text-slate-205 mt-1 block">{expectedCash.toLocaleString('pt-MZ')} MT</span>
            </div>
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-1.5">
              <span className="text-[8px] font-black text-red-400 block uppercase">M-Pesa</span>
              <span className="font-mono font-black text-red-200 mt-1 block">{totalMpesa.toLocaleString('pt-MZ')} MT</span>
            </div>
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-1.5">
              <span className="text-[8px] font-black text-emerald-400 block uppercase">e-Mola</span>
              <span className="font-mono font-black text-emerald-250 mt-1 block">{totalEmola.toLocaleString('pt-MZ')} MT</span>
            </div>
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-1.5">
              <span className="text-[8px] font-black text-blue-400 block uppercase">Cartão</span>
              <span className="font-mono font-black text-blue-200 mt-1 block">{totalCartao.toLocaleString('pt-MZ')} MT</span>
            </div>
          </div>
        </div>

        {activeSales.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            <AlertTriangle className="w-7 h-7 text-amber-500 mx-auto mb-2.5" />
            <h4 className="text-xs font-black uppercase text-slate-700">Sem vendas no período activo</h4>
            <p className="text-[11px] text-slate-450 mt-1 max-w-xs mx-auto">
              Você ainda não registou nenhuma venda desde o início do seu turno ou desde o último fecho de caixa efectuado.
            </p>
          </div>
        ) : null}

        {/* Form elements for physical cash evaluation */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-orange-600" />
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">Conciliação Física de Dinheiro em Gaveta</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-1.5">
                Dinheiro em Caixa Esperado (Sistema):
              </label>
              <div className="bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl font-mono text-base font-black text-slate-800 flex justify-between items-center shadow-xs">
                <span>{expectedCash.toLocaleString('pt-MZ')} MT</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase font-black bg-slate-200/50 px-2 py-0.5 rounded-md">
                  Apenas Cash
                </span>
              </div>
              <p className="text-[9.5px] text-slate-450 mt-1.5 leading-snug">
                As vendas por meios digitais (M-Pesa, E-Mola, Cartão) não contam para o caixa físico e já estão garantidas na conta digital do estabelecimento.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                Valor Físico em Dinheiro Contado (MT):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={physicalCashStr}
                  onChange={(e) => setPhysicalCashStr(e.target.value)}
                  placeholder="Introduza o valor contado na gaveta"
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-55 focus:bg-white text-base font-mono font-extrabold text-slate-800 border-2 border-slate-200 focus:border-orange-500 rounded-xl outline-hidden shadow-xs transition-colors"
                />
                <button
                  type="button"
                  onClick={clearPhysicalCash}
                  title="Reiniciar valor"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-450 hover:text-rose-500 rounded-md transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick count helpers */}
              <div className="flex flex-wrap gap-1 pt-1.5">
                {quickNotes.map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => handleAddNotes(note)}
                    className="px-2 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-colors shrink-0"
                  >
                    +{note} MT
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time comparison card */}
          {physicalCashStr && (
            <div className={`p-4 rounded-xl border border-dashed transition-colors ${
              discrepancy === 0 
                ? 'bg-emerald-50/50 border-emerald-250 text-emerald-800' 
                : discrepancy < 0 
                  ? 'bg-rose-50/50 border-rose-250 text-rose-800' 
                  : 'bg-amber-50/50 border-amber-250 text-amber-800'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className={`w-4 h-4 ${discrepancy === 0 ? 'text-emerald-500' : discrepancy < 0 ? 'text-rose-500' : 'text-amber-550'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Cálculo de Diferença de Caixa</span>
              </div>
              <div className="flex justify-between items-baseline">
                <div className="text-[11px] leading-snug">
                  {discrepancy === 0 && (
                    <span className="font-extrabold">Caixa Coerente!</span>
                  )}
                  {discrepancy < 0 && (
                    <span><strong>Quebra de Caixa (Déficit):</strong> O valor em gaveta é menor do que o sistema esperava. Encontre a causa ou declare justificativa em observações.</span>
                  )}
                  {discrepancy > 0 && (
                    <span><strong>Excesso de Caixa (Sobra):</strong> O valor físico é maior do que o esperado em caixa. Verifique se esqueceu de registrar alguma venda.</span>
                  )}
                </div>
                <div className="text-right font-mono font-black text-sm whitespace-nowrap ml-4">
                  {discrepancy > 0 ? '+' : ''}{discrepancy.toLocaleString('pt-MZ')} MT
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">
              Motivo da Diferença / Observações do Turno (Opcional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Troco inicial de moedas, diferença devido a arredondamento, quebra reportada ao supervisor..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 text-xs border border-slate-200 focus:border-slate-350 focus:bg-white rounded-xl outline-hidden transition-colors"
            />
          </div>
        </div>

        {/* Submission button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 hover:bg-slate-100 border border-transparent rounded-xl text-xs font-black text-slate-600 transition-colors uppercase cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className="px-6 py-2.5 bg-orange-655 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition-colors uppercase cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-650/15"
          >
            Confirmar Fecho de Caixa
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    );
  };

  const renderHistoricalClosures = () => {
    // Filter history based on operator role. Vendedores can only view their own shifts, Gestores see everything
    const filteredClosures = closures.filter(c => 
      currentUser.role === 'gestor' ? true : c.operatorName === currentUser.name
    ).sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime());

    if (selectedHistoricalClosure) {
      const c = selectedHistoricalClosure;
      return (
        <div className="space-y-4 animate-in fade-in duration-200">
          <button
            onClick={() => setSelectedHistoricalClosure(null)}
            className="flex items-center gap-1 text-[11px] font-black uppercase text-orange-600 hover:text-orange-700 cursor-pointer mb-2"
          >
            &larr; Voltar para o Histórico de Fechos
          </button>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-300">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <span className="text-white text-xs font-black uppercase">
                Fecho de Caixa: {c.id}
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20 px-2 py-0.5 rounded-md">
                RELAÇÃO CONSOLIDA
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
              <div>
                <p className="text-slate-400">OPERADOR:</p>
                <p className="font-extrabold text-white mt-1 uppercase">{c.operatorName}</p>
              </div>
              <div>
                <p className="text-slate-400">STATUS TURNO:</p>
                <p className="font-extrabold text-white mt-1 uppercase">FECHADO / CONCILIADO</p>
              </div>
              <div className="col-span-2 border-t border-slate-800 pt-3">
                <p className="text-slate-400">COBERTURA DO PERÍODO DO TURNO:</p>
                <p className="font-semibold text-slate-200 mt-1">
                  De: {new Date(c.openedAt).toLocaleString('pt-MZ')}<br/>
                  Até: {new Date(c.closedAt).toLocaleString('pt-MZ')}
                </p>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-800 pt-3.5 mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Vendas em Caixa (Físico Esperado):</span>
                <span className="font-mono text-slate-100">{c.expectedCash.toLocaleString('pt-MZ')} MT</span>
              </div>
              <div className="flex justify-between text-white font-extrabold">
                <span>Vendas em Meios Digitais Mpesa/eMola:</span>
                <span className="font-mono text-emerald-400">{((c.totalMpesa + c.totalEmola)).toLocaleString('pt-MZ')} MT</span>
              </div>
              <div className="flex justify-between">
                <span>Vendas em Cartão de Crédito/Débito:</span>
                <span className="font-mono text-slate-100">{c.totalCartao.toLocaleString('pt-MZ')} MT</span>
              </div>
              <div className="flex justify-between font-black text-sm text-[#FFD100] border-t border-slate-800 pt-2">
                <span>TOTAL GLOBAL FACTURADO:</span>
                <span className="font-mono">{c.totalSales.toLocaleString('pt-MZ')} MT</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3.5 mt-3.5 space-y-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Dinheiro em Caixa Esperado (Sistema):</span>
                <span className="font-mono font-bold text-slate-300">{c.expectedCash.toLocaleString('pt-MZ')} MT</span>
              </div>
              <div className="flex justify-between text-slate-400 font-bold">
                <span>Dinheiro Físico Contado (Informado):</span>
                <span className="font-mono text-white">{c.physicalCash.toLocaleString('pt-MZ')} MT</span>
              </div>
              <div className="flex justify-between font-black border-t border-slate-800 pt-1.5 mt-1">
                <span>Diferença / Ajuste:</span>
                <span className={c.discrepancy === 0 
                  ? 'text-emerald-405' 
                  : c.discrepancy < 0 
                    ? 'text-rose-500' 
                    : 'text-amber-400'}>
                  {c.discrepancy > 0 ? '+' : ''}{c.discrepancy.toLocaleString('pt-MZ')} MT
                  {c.discrepancy === 0 && ' (Sem Desvios)'}
                  {c.discrepancy < 0 && ' (Quebra de Gaveta)'}
                  {c.discrepancy > 0 && ' (Excesso)'}
                </span>
              </div>
            </div>

            {c.notes && (
              <div className="mt-4 bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-[11px] text-slate-400 italic">
                <span className="not-italic font-bold text-slate-300 block mb-1">Justificação & Observações:</span>
                "{c.notes}"
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              onClick={() => handlePrintThermal(c)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white hover:text-white rounded-xl text-xs font-black cursor-pointer shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#FFD100]" />
              Gerar Talão Termal
            </button>
            <button
              onClick={() => setSelectedHistoricalClosure(null)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-250 hover:bg-slate-300 border border-slate-200 rounded-xl text-xs font-black text-slate-755 cursor-pointer transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }

    if (filteredClosures.length === 0) {
      return (
        <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl animate-in fade-in duration-200">
          <History className="w-8 h-8 text-slate-305 mx-auto mb-2" />
          <h4 className="text-xs font-bold uppercase text-slate-600">Sem histórico de turnos</h4>
          <p className="text-[11px] text-slate-450 mt-1 max-w-xs mx-auto">
            Não existem fechos de caixa registados para este utilizador na base de dados local.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 animate-in fade-in duration-150">
        <div className="bg-slate-100/50 border border-slate-200 rounded-xl p-3 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <span>Relatório de Fecho</span>
          <span>Valores de Gaveta</span>
        </div>
        <div className="space-y-2">
          {filteredClosures.map((c) => {
            const formattedDate = new Date(c.closedAt).toLocaleDateString('pt-MZ');
            const formattedTime = new Date(c.closedAt).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' });
            return (
              <div
                key={c.id}
                onClick={() => setSelectedHistoricalClosure(c)}
                className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer transition-all duration-150 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                      {c.id}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[9.5px] text-slate-450 font-semibold uppercase">
                      <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> {formattedDate} às {formattedTime}</span>
                      <span>&bull;</span>
                      <span className="text-slate-500 font-bold">Por: {c.operatorName.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-extrabold text-slate-800 font-mono">
                    {c.totalSales.toLocaleString('pt-MZ')} MT
                  </p>
                  <p className={`text-[9px] font-bold mt-1 font-mono tracking-wider ${
                    c.discrepancy === 0 
                      ? 'text-emerald-600' 
                      : c.discrepancy < 0 
                        ? 'text-rose-600' 
                        : 'text-amber-500'
                  }`}>
                    DIF: {c.discrepancy > 0 ? '+' : ''}{c.discrepancy.toLocaleString('pt-MZ')} MT
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Top brand accent in Mozambique flag color strips representing regional service and compliance */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#D81E05] via-[#FFD100] to-[#009739]"></div>

        {/* Header container */}
        <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/10">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-tight">Fecho de Caixa e Turnos</h3>
              <p className="text-[10.5px] font-semibold text-slate-450 uppercase tracking-wide mt-0.5">
                Validação de Saldo Físico & Controle de Arrecadação
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-150 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational navigation tabs (if not looking at success state) */}
        {!isSuccess && (
          <div className="px-6 bg-slate-50 border-b border-slate-200/60 flex gap-2">
            <button
              onClick={() => {
                setActiveTab('efectuar-fecho');
                setSelectedHistoricalClosure(null);
              }}
              className={`py-3 px-3 text-xs font-black uppercase tracking-wider relative cursor-pointer border-b-2 transition-all duration-150 ${
                activeTab === 'efectuar-fecho'
                  ? 'border-orange-500 text-slate-800'
                  : 'border-transparent text-slate-455 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                Efectuar Fecho de Caixa
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('historico-fechos');
                setSelectedHistoricalClosure(null);
              }}
              className={`py-3 px-3 text-xs font-black uppercase tracking-wider relative cursor-pointer border-b-2 transition-all duration-150 ${
                activeTab === 'historico-fechos'
                  ? 'border-orange-500 text-slate-800'
                  : 'border-transparent text-slate-455 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <History className="w-4 h-4" />
                Histórico de Fechos
              </div>
            </button>
          </div>
        )}

        {/* Scrollable canvas core content */}
        <div className="p-6 overflow-y-auto flex-1 min-w-0">
          {isSuccess ? renderActiveClosureForm() : (activeTab === 'efectuar-fecho' ? renderActiveClosureForm() : renderHistoricalClosures())}
        </div>
        
        {/* Footnote decoration */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3 text-center flex justify-between items-center text-[9.5px] font-extrabold text-slate-400 tracking-wide uppercase">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" /> Operador: {currentUser.name} ({currentUser.role})
          </span>
          <span>Canteen Master MZ &bull; Fiscalizado</span>
        </div>
      </div>
    </div>
  );
}
