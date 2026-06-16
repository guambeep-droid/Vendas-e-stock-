/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { Product, CartItem, PaymentMethod, StoreConfig, PlatformUser } from '../types';
import ThermalReceipt from './ThermalReceipt';
import { printThermalReceipt } from '../utils/printUtils';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  DollarSign, 
  Receipt,
  CheckCircle,
  X,
  AlertCircle,
  ScanBarcode,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  Sparkles,
  QrCode,
  Plus,
  Printer,
  Lock
} from 'lucide-react';

interface PosViewProps {
  products: Product[];
  categories: string[];
  onCompleteSale: (
    cartItems: CartItem[],
    discount: number,
    paymentMethod: PaymentMethod,
    amountPaid?: number,
    customerName?: string,
    customerNuit?: string,
    customerAddress?: string
  ) => void;
  storeConfig: StoreConfig;
  currentUser: PlatformUser | null;
  onOpenClosureModal?: () => void;
}

export default function PosView({
  products,
  categories,
  onCompleteSale,
  storeConfig,
  currentUser,
  onOpenClosureModal,
}: PosViewProps) {
  // POS Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showDropdown, setShowDropdown] = useState(false);
  const [rightSearchQuery, setRightSearchQuery] = useState('');
  const [showRightDropdown, setShowRightDropdown] = useState(false);

  // States for products modal (to reduce template footprint on mobile devices)
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // Barcode Scanner Control States
  const [isScanning, setIsScanning] = useState(false);
  const [scannerSound, setScannerSound] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [scannerStatus, setScannerStatus] = useState<string>('Esperando por ativação...');
  const [simulatedCode, setSimulatedCode] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Clear camera error when active scanner is toggled off
  useEffect(() => {
    if (!isScanning) {
      setCameraError(null);
    }
  }, [isScanning]);

  // Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mpesa');
  const [cashReceived, setCashReceived] = useState<string>('');
  
  // Alert/Error banner
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  // Native Web Audio API beep synthesizer to flash standard successful response noise
  const playBeep = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High standard electronic tone
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio Context blocked by security policy:", e);
    }
  };

  // Auto add to cart upon code match detection
  const handleBarcodeDecoded = (codeText: string) => {
    const cleanedCode = codeText.trim();
    if (!cleanedCode) return;

    setLastScannedCode(cleanedCode);

    // Look up product by code SKU (case insensitive)
    const matchedProduct = products.find(
      (p) => p.code.toLowerCase() === cleanedCode.toLowerCase()
    );

    if (matchedProduct) {
      if (scannerSound) {
        playBeep();
      }
      
      handleAddToCart(matchedProduct);
      setScannerStatus(`Sucesso: ${matchedProduct.name} adicionado!`);
      
      setTimeout(() => {
        setScannerStatus('Câmera Ativa — Aponte para o código de barras');
      }, 1500);
    } else {
      if (scannerSound) {
        try {
          const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtxClass) {
            const ctx = new AudioCtxClass();
            const osc = ctx.createOscillator();
            const gn = ctx.createGain();
            osc.connect(gn); gn.connect(ctx.destination);
            osc.frequency.setValueAtTime(220, ctx.currentTime); // low buzz warn tone
            gn.gain.setValueAtTime(0.08, ctx.currentTime);
            osc.start(); osc.stop(ctx.currentTime + 0.25);
          }
        } catch(e) {}
      }
      setScannerStatus(`Código "${cleanedCode}" não cadastrado!`);
      setErrorAlert(`Código "${cleanedCode}" não foi encontrado no estoque.`);
    }
  };

  // Simulated scan triggers
  const handleSimulateScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedCode.trim()) return;
    handleBarcodeDecoded(simulatedCode.trim());
    setSimulatedCode('');
  };

  // Instantiates real Device Camera using Html5Qrcode safely
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    if (isScanning) {
      setScannerStatus('Iniciando webcam do dispositivo...');
      
      const startCamera = async () => {
        try {
          const container = document.getElementById("pos-barcode-scanner-viewport");
          if (!container || !isMounted) return;

          html5QrCode = new Html5Qrcode("pos-barcode-scanner-viewport");
          
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 15,
              qrbox: (width, height) => {
                const minEdge = Math.min(width, height);
                const boxWidth = Math.floor(minEdge * 0.75);
                return { width: boxWidth, height: Math.max(90, Math.floor(boxWidth * 0.455)) };
              },
              aspectRatio: 1.333333
            },
            (decodedText) => {
              if (isMounted) {
                handleBarcodeDecoded(decodedText);
              }
            },
            () => {
              // Silence spam log warnings about frame scanning failures
            }
          );
          if (isMounted) {
            setScannerStatus('Câmera Ativa — Aponte para o código de barras');
          } else {
            // Already unmounted or closed; immediately tear down
            if (html5QrCode.isScanning) {
              await html5QrCode.stop();
              html5QrCode.clear();
            }
          }
        } catch (err: any) {
          console.error("Erro no hardware da câmera:", err);
          if (isMounted) {
            const errMsg = err.message || String(err);
            setCameraError(errMsg);
            setScannerStatus(`Falha de câmera: ${errMsg}`);
          }
        }
      };

      const timer = setTimeout(() => {
        startCamera();
      }, 250);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (html5QrCode) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
              html5QrCode?.clear();
            }).catch(e => console.error("Erro ao desligar câmera:", e));
          }
        }
      };
    }
  }, [isScanning]);

  // Customer optional fields for checkout
  const [customerName, setCustomerName] = useState('');
  const [customerNuit, setCustomerNuit] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Simulated Receipt Modal after checkout succeeds
  const [receiptSale, setReceiptSale] = useState<{
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
  } | null>(null);

  // Draft checkout phase before committing database entries
  const [confirmingSale, setConfirmingSale] = useState<boolean>(false);

  // Clear alert after some seconds
  useEffect(() => {
    if (errorAlert) {
      const timer = setTimeout(() => setErrorAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorAlert]);

  // Filters
  const availableProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Global matching for the drop-down suggestion list (searches across all categories to speed up operations)
  const searchDropdownProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return false;
    return (
      p.name.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  });

  // Floating dropdown live matches (searching by name, category, or code SKU)
  const dropdownMatches = searchQuery.trim().length > 0
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const rightDropdownMatches = rightSearchQuery.trim().length > 0
    ? products.filter((p) =>
        p.name.toLowerCase().includes(rightSearchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(rightSearchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(rightSearchQuery.toLowerCase())
      )
    : [];

  // Filter products for the products modal (to find and stock audit quickly)
  const modalFilteredProducts = products.filter((p) => {
    const q = modalSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  // Numeric MZN helper
  const formatMZN = (val: number) => {
    return val.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MT';
  };

  // Format receipt data as simple plain-text summary in Portuguese for QR Code scanners
  const getReceiptQRValue = (sale: typeof receiptSale) => {
    if (!sale) return '';
    const formattedDate = new Date(sale.timestamp).toLocaleString('pt-MZ');
    const itemsText = sale.items
      .map((item) => `- ${item.quantity}un x ${item.product.name} (${formatMZN(item.product.salePrice * item.quantity)})`)
      .join('\n');

    const hasSaleTaxDetails = !!(sale.customerNuit?.trim() && sale.customerAddress?.trim());
    const baseVal = Math.max(0, sale.subtotal - sale.discount);
    const ivaVal = hasSaleTaxDetails ? baseVal * 0.16 : 0;

    return `*** RECIBO DIGITAL ***\n` +
      `SISTEMA CANTINA MASTER MOÇAMBIQUE 🇲🇿\n` +
      `------------------------------------\n` +
      `ID Registro: ${sale.saleId}\n` +
      `Data e Hora: ${formattedDate}\n` +
      `Canal de Pago: ${sale.paymentMethod}\n` +
      `------------------------------------\n` +
      `Artigos Comprados:\n` +
      `${itemsText}\n` +
      `------------------------------------\n` +
      `Subtotal: ${formatMZN(sale.subtotal)}\n` +
      `Desconto: ${formatMZN(sale.discount)}\n` +
      `${hasSaleTaxDetails ? `IVA (16%): ${formatMZN(ivaVal)}` : 'IVA: Isento'}\n` +
      `*PAGO EM METICAIS: ${formatMZN(sale.total)}*\n` +
      `------------------------------------\n` +
      `Nossos agradecimentos pela preferência!`;
  };

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    if (product.quantity === 0) {
      setErrorAlert('O produto está totalmente esgotado no estoque!');
      return;
    }

    // Capture product ID for green flash identification feedback
    setHighlightedProductId(product.id);
    const highlightTimer = setTimeout(() => {
      setHighlightedProductId((prev) => (prev === product.id ? null : prev));
    }, 2500);

    const existingCartItem = cart.find((item) => item.product.id === product.id);

    if (existingCartItem) {
      if (existingCartItem.quantity >= product.quantity) {
        setErrorAlert(`Limite de estoque atingido! (${product.quantity} un disponíveis)`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // Update Item Quantity directly in Cart
  const handleUpdateCartQty = (productId: string, newQty: number) => {
    const cartItem = cart.find((item) => item.product.id === productId);
    if (!cartItem) return;

    if (newQty <= 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
      return;
    }

    const productDef = products.find((p) => p.id === productId);
    if (productDef && newQty > productDef.quantity) {
      setErrorAlert(`Desculpe, só temos ${productDef.quantity} un em estoque.`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  // Click shortcut keys to pre-fill cash payments received
  const fillCashValue = (value: number) => {
    setCashReceived(value.toString());
  };

  // Compute subtotal, discount, total
  const subtotal = cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const baseAmount = Math.max(0, subtotal - discountAmount);
  const hasTaxDetails = customerNuit.trim() !== '' && customerAddress.trim() !== '';
  const ivaAmount = hasTaxDetails ? baseAmount * 0.16 : 0;
  const total = baseAmount + ivaAmount;
  
  // Troco computation
  const cashPaidNum = parseFloat(cashReceived) || 0;
  const change = paymentMethod === 'dinheiro' && cashPaidNum > total ? cashPaidNum - total : 0;

  // Finalize Checkout trigger - showing preview for confirmation first
  const handleCompletePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorAlert('Adicione pelo menos um produto ao carrinho primeiro!');
      return;
    }

    if (paymentMethod === 'dinheiro' && cashPaidNum < total) {
      setErrorAlert('Valor recebido em dinheiro é inferior ao total da compra!');
      return;
    }

    const simulatedSaleId = 'VNDA-' + Math.floor(100000 + Math.random() * 900000);
    const saleTimestamp = new Date().toISOString();

    setReceiptSale({
      items: [...cart],
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod,
      cashReceived: paymentMethod === 'dinheiro' ? cashPaidNum : undefined,
      change: paymentMethod === 'dinheiro' ? change : undefined,
      timestamp: saleTimestamp,
      saleId: simulatedSaleId,
      customerName: customerName.trim() || undefined,
      customerNuit: customerNuit.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      operatorName: currentUser?.name || 'Sistema',
    });

    // Enter draft confirmation phase
    setConfirmingSale(true);
  };

  // Commit database entry only after explicit user confirmation
  const handleConfirmAndComplete = () => {
    if (!receiptSale) return;

    onCompleteSale(
      receiptSale.items,
      receiptSale.discount,
      receiptSale.paymentMethod,
      receiptSale.cashReceived,
      receiptSale.customerName,
      receiptSale.customerNuit,
      receiptSale.customerAddress
    );

    // Venda registrada com sucesso, transition modal display to standard receipt form
    setConfirmingSale(false);

    // Clean active states for next transaction
    setCart([]);
    setDiscountPercent(0);
    setCashReceived('');
    setCustomerName('');
    setCustomerNuit('');
    setCustomerAddress('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="pos-system-grid">
      {/* Alert bar if triggers */}
      {errorAlert && (
        <div className="fixed bottom-6 right-6 z-55 bg-rose-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold leading-none">{errorAlert}</span>
        </div>
      )}

      {/* LEFT: Products Catalogue Browsing - Col Span 6 (Compactado em Botão para dispostivos móveis) */}
      <div className="lg:col-span-6 order-last" id="pos-catalogue-compact-deck">
        <div className="bg-white p-6 border border-slate-200/80 rounded-3xl shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
            <ShoppingCart className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">Catálogo de Produtos</h3>
            <p className="text-[10px] sm:text-xs text-slate-450 max-w-[280px]">
              Verifique códigos, preços e as quantidades de stock do seu inventário em tempo real.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setModalSearchQuery('');
              setIsProductsModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl shadow-md shadow-orange-600/10 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider active:scale-95"
            id="btn-open-products-list"
          >
            <ScanBarcode className="w-4 h-4 text-orange-200 animate-pulse" />
            <span>Lista de Produtos & Stock ({products.length})</span>
          </button>
        </div>
      </div>

      {/* RIGHT: Active Shopping Cart & Checkout Panels - Col Span 6 (Unificada terminal console) */}
      <div className="lg:col-span-6 flex flex-col gap-4 animate-in fade-in duration-300 order-first" id="pos-unified-checkout-deck">
        
        {/* Console de Faturamento Unificado */}
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col" id="unified-checkout-main-panel">
          
          <div className="p-5 space-y-4">
            {/* 1. COMPACT INTEGRATED SEARCH */}
            <div className="space-y-1.5 font-sans" id="pos-right-search-wrapper">
              <label className="text-xs font-black text-orange-600 uppercase tracking-wider block">
                🔍 1. Pesquisa e Scanner
              </label>
              
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome, categoria ou SKU do produto..."
                    value={rightSearchQuery}
                    onFocus={() => setShowRightDropdown(true)}
                    onChange={(e) => {
                      setRightSearchQuery(e.target.value);
                      setShowRightDropdown(true);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50 placeholder-slate-400 font-bold"
                  />
                  {rightSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setRightSearchQuery('');
                        setShowRightDropdown(false);
                      }}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-200 transition-colors"
                      title="Limpar pesquisa"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Autocomplete Suggestions Popup directly above current cart context */}
                  {rightSearchQuery.trim().length > 0 && showRightDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-45 bg-transparent" 
                        onClick={() => setShowRightDropdown(false)}
                      />
                      <div 
                        className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-250 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-100"
                        id="pos-right-predictive-search-dropdown"
                      >
                        {rightDropdownMatches.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500 font-medium bg-slate-50/50">
                            Nenhum produto correspondente a "<span className="font-extrabold text-slate-700">{rightSearchQuery}</span>"
                          </div>
                        ) : (
                          <>
                            <div className="p-2 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-455 flex justify-between">
                              <span>Resultados Rápidos ({rightDropdownMatches.length})</span>
                              <span className="text-[9px] text-orange-600 font-bold">Clique para adicionar imediato</span>
                            </div>
                            {rightDropdownMatches.slice(0, 8).map((product) => {
                              const isEsgotado = product.quantity === 0;
                              const isBaixoEstoque = product.quantity <= product.minStock;
                              return (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => {
                                    handleAddToCart(product);
                                    if (scannerSound) {
                                      playBeep();
                                    }
                                    setRightSearchQuery(''); // Closes and wipes on select
                                    setShowRightDropdown(false);
                                  }}
                                  className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors duration-150 cursor-pointer ${
                                    isEsgotado 
                                      ? 'opacity-60 bg-slate-50/50 cursor-not-allowed' 
                                      : 'hover:bg-orange-50/45 active:bg-orange-100/30'
                                  }`}
                                  disabled={isEsgotado}
                                >
                                  <div className="space-y-0.5 pr-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-bold text-slate-855 line-clamp-1">{product.name}</span>
                                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                                        {product.category}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                      <span>Cód: {product.code}</span>
                                      <span>•</span>
                                      <span className={`font-semibold ${isEsgotado ? 'text-red-500' : isBaixoEstoque ? 'text-amber-500' : 'text-emerald-600'}`}>
                                        {isEsgotado ? 'ESGOTADO' : `${product.quantity} un em stock`}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-black text-slate-900 font-mono">{formatMZN(product.salePrice)}</span>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all ${
                                      isEsgotado
                                        ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                        : 'bg-[#009739] text-white shadow-xs hover:bg-[#009739]/80'
                                    }`}>
                                      + Add
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsScanning(!isScanning)}
                  className={`px-4 py-2.5 h-[38px] rounded-xl border flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 text-xs font-black shrink-0 ${
                    isScanning
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/10'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800'
                  }`}
                  title="Scanner de Código de Barras por Câmera"
                >
                  <ScanBarcode className="w-4 h-4 text-orange-600" />
                  <span className="hidden sm:inline">{isScanning ? 'Fechar Câmera' : 'Bipar por Câmera'}</span>
                  <span className="sm:hidden">{isScanning ? 'Fechar' : 'Bipar'}</span>
                </button>
              </div>

              {/* Real-time Web Camera Barcode Scan Viewport and Simulator Controls */}
              {isScanning && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white space-y-3 animate-in slide-in-from-top-4 duration-250 relative overflow-hidden mt-3" id="pos-barcode-scanner-area">
                  {/* Elegant Mozambique flag trim corner details */}
                  <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-[#009739] rounded-full"></div>
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FFD100] rounded-full"></div>
                  <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-[#D81E05] rounded-full"></div>
                  <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-white rounded-full"></div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 w-6 h-6 flex items-center justify-center bg-[#009739]/25 text-emerald-400 rounded-lg animate-pulse shrink-0">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-200 leading-none">Leitor Óptico Integrado</h4>
                        <p className="text-[9px] text-slate-400 font-medium">Auto-detecção de códigos de barras (MZN)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 ml-auto">
                      {/* Audio buzzer feedback settings toggle */}
                      <button
                        type="button"
                        onClick={() => setScannerSound(!scannerSound)}
                        className={`p-1 rounded-md border text-xs cursor-pointer transition-colors ${
                          scannerSound 
                            ? 'bg-[#009739]/20 border-emerald-500/30 text-emerald-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                        title={scannerSound ? "Desativar bip" : "Ativar bip"}
                      >
                        {scannerSound ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsScanning(false)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-md cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Video preview or alert notice */}
                  <div className="relative bg-slate-950 rounded-xl h-[170px] flex flex-col justify-center items-center overflow-hidden border border-slate-800">
                    {/* Target placeholder for HTML5-QRCode to inject elements */}
                    <div id="pos-barcode-scanner-viewport" className="w-[100%] h-[100%] object-cover"></div>
                    
                    {/* Red optical scan laser guide motion indicator */}
                    {!cameraError && (
                      <div className="absolute left-0 right-0 h-0.5 bg-[#D81E05] shadow-[0_0_15px_#D81E05,0_0_25px_#D81E05] animate-laser pointer-events-none z-10"></div>
                    )}

                    {/* Camera access error overlay */}
                    {cameraError && (
                      <div className="absolute inset-0 bg-slate-950 border border-slate-800 p-3 flex flex-col justify-center items-center text-center z-20 space-y-2">
                        <div className="p-1 px-1.5 bg-rose-500/10 text-rose-500 rounded-full">
                          <CameraOff className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 max-w-[90%] font-sans">
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-500">Câmera Bloqueada / Indisponível</h5>
                          <p className="text-[9px] text-slate-400 leading-normal">
                            Restrições de segurança do iframe impediram o leitor.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center pt-0.5 font-sans">
                          <a 
                            href={window.location.href} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded text-[9px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-md cursor-pointer decoration-transparent"
                          >
                            <span>Abrir em Nova Aba ↗</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setCameraError(null)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Recarregar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Precise bottom status banner */}
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-950/95 px-3 py-1.5 text-center text-[9px] border-t border-slate-850 flex items-center justify-center gap-1 z-10">
                      <span className={`w-1.5 h-1.5 rounded-full ${cameraError ? 'bg-rose-500' : 'bg-emerald-450 animate-pulse'}`}></span>
                      <span className="font-semibold text-slate-300 truncate tracking-wide">{scannerStatus}</span>
                    </div>
                  </div>

                  {/* Simulated virtual inputs inside the checkout slot */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2 font-sans">
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400">
                      <Sparkles className="w-3.5 h-3.5 text-[#FFD100]" />
                      <span>Simulador de Leitor de Barras</span>
                    </div>
                    
                    <form onSubmit={handleSimulateScan} className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Insira o código do produto (Ex: 78910001, 10001001)..."
                        value={simulatedCode}
                        onChange={(e) => setSimulatedCode(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono font-semibold text-slate-205 text-slate-200 outline-none focus:border-emerald-500 whitespace-nowrap"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-[#009739] hover:bg-[#009739]/85 text-white font-extrabold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
                      >
                        Confirmar
                      </button>
                    </form>

                    {/* Instantly try specific products */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Atalho de bip rápido:</span>
                      <div className="flex flex-wrap gap-1">
                        {products.slice(0, 4).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleBarcodeDecoded(p.code)}
                            className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[9px] font-mono text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span>{p.name}</span>
                            <code className="text-[#FFD100]">[{p.code}]</code>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Scan History list */}
                  {lastScannedCode && (
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-850 rounded-lg text-[10px] border border-slate-800 text-slate-300 font-mono">
                      <span>Último SKU lido:</span>
                      <span className="font-bold text-emerald-400">{lastScannedCode}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. CARRINHO DE COMPRAS INTEGRADO */}
            <div className="space-y-1.5 font-sans">
              <div className="flex justify-between items-center text-[10.5px]">
                <label className="text-xs font-black text-orange-600 uppercase tracking-wider block">
                  🛒 2. Carrinho (Discriminação)
                </label>
              </div>
              <div className="bg-slate-50/50 border border-slate-200/60 rounded-xl p-3 max-h-[190px] overflow-y-auto divide-y divide-slate-150/50 scrollbar-thin">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-1.5">
                    <ShoppingCart className="w-8 h-8 text-slate-200 animate-bounce" />
                    <p className="text-xs font-bold text-slate-450">Nenhum produto no carrinho de compras.</p>
                    <p className="text-[10px] text-slate-400">Insira itens pesquisando acima, clicando abaixo ou no catálogo.</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const isHighlighted = item.product.id === highlightedProductId;
                    return (
                      <div 
                        key={item.product.id} 
                        className={`py-2 px-2 flex justify-between items-center gap-2 rounded-xl transition-all duration-300 ${
                          isHighlighted 
                            ? 'bg-emerald-50 border border-emerald-300/50 shadow-sm scale-[1.01] animate-pulse ring-2 ring-emerald-500/10' 
                            : 'border border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pl-1">
                          <p className="text-xs font-bold text-slate-800 truncate leading-tight flex items-center gap-1.5">
                            {item.product.name}
                            {isHighlighted && (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full select-none animate-bounce">
                                <ScanBarcode className="w-2.5 h-2.5" /> Identificado
                              </span>
                            )}
                          </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-slate-450 font-mono">
                          <span className="text-slate-400">Preço: {formatMZN(item.product.salePrice)}</span>
                          <span>•</span>
                          <span className="text-orange-600 font-bold">
                            Subtotal: {formatMZN(item.product.salePrice * item.quantity)}
                          </span>
                        </div>
                      </div>

                      {/* Qty action adjusters */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.product.id, item.quantity - 1)}
                          className="w-5 h-5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded font-bold text-[10px] flex items-center justify-center cursor-pointer select-none active:scale-90"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold font-mono w-5 text-center text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.product.id, item.quantity + 1)}
                          className="w-5 h-5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded font-bold text-[10px] flex items-center justify-center cursor-pointer select-none active:scale-90"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.product.id, 0)}
                          className="p-1 text-slate-450 hover:text-rose-600 ml-0.5 cursor-pointer transition-colors"
                          title="Remover"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. LOCAL DE FATURAÇÃO & PAGAMENTO */}
            <form onSubmit={handleCompletePayment} className="space-y-4 pt-3.5 border-t border-slate-100 font-sans" id="unified-payment-form">
              <label className="text-xs font-black text-orange-600 uppercase tracking-wider block">
                💼 3. Faturação
              </label>

              {/* Totals Summary Card */}
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                  <span>Subtotal do Pedido</span>
                  <span className="font-mono text-slate-800">{formatMZN(subtotal)}</span>
                </div>

                {/* Desconto */}
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">Desconto Especial</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={discountPercent || ''}
                      onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-12 text-center text-xs font-mono font-black py-0.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
                    />
                    <span className="text-slate-400">%</span>
                    {discountAmount > 0 && (
                      <span className="text-rose-600 font-mono font-bold text-[10px] ml-1">
                        (-{formatMZN(discountAmount)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Sem IVA */}
                <div className="flex justify-between items-center text-xs text-slate-400 font-medium pt-1 border-t border-slate-150">
                  <span>Valor sem IVA</span>
                  <span className="font-mono">{formatMZN(baseAmount)}</span>
                </div>

                {/* IVA */}
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-450 uppercase tracking-wider font-extrabold">
                    {hasTaxDetails ? "IVA (16% Autocalculado)" : "IVA (Isento)"}
                  </span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {hasTaxDetails ? `+${formatMZN(ivaAmount)}` : "Isento (0,00 MT)"}
                  </span>
                </div>

                {/* GRAND TOTAL */}
                <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-slate-250">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {hasTaxDetails ? "TOTAL DA FATURAÇÃO (COM IVA)" : "TOTAL DA FATURAÇÃO (ISENTO)"}
                  </span>
                  <span className="text-xl font-black font-mono text-[#009739]">
                    {formatMZN(total)}
                  </span>
                </div>
              </div>

              {/* Canal de Checkout */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Método de Checkout:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'mpesa', label: 'M-Pesa' },
                    { id: 'emola', label: 'e-Mola' },
                    { id: 'dinheiro', label: 'Dinheiro' },
                    { id: 'cartao', label: 'Cartão' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`py-2 px-1 text-[10px] font-black rounded-lg border cursor-pointer text-center leading-none transition-all duration-150 ${
                        paymentMethod === m.id
                          ? 'bg-orange-600 border-orange-600 text-white shadow-md scale-[1.03]'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dinheiro & Troco Calculator */}
              {paymentMethod === 'dinheiro' && (
                <div className="p-3 bg-orange-50/40 border border-orange-100 rounded-xl space-y-2.5 animate-in slide-in-from-top-3 duration-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-orange-950">Valor Recebido (MT):</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      step="1"
                      min="0"
                      className="w-24 px-2 py-1 text-xs font-mono font-black bg-white text-slate-850 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 select-none font-bold">
                    {[50, 100, 200, 500, 1000].map((v) => {
                      if (v < total && v !== 1000) return null;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => fillCashValue(v)}
                          className="px-2.5 py-1 text-[9.5px] font-black bg-white hover:bg-orange-50 border border-orange-200 text-orange-700 rounded-lg transition-all cursor-pointer shadow-xs"
                        >
                          {v} MT
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-orange-100 text-xs">
                    <span className="font-semibold text-slate-755">Troco do Cliente:</span>
                    <span className={`font-mono font-black text-sm ${change > 0 ? 'text-emerald-600 font-extrabold' : 'text-slate-400'}`}>
                      {formatMZN(change)}
                    </span>
                  </div>
                </div>
              )}

              {/* Dados do Cliente */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Identificação do Cliente (Opcional):</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome do Cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder-slate-400 bg-slate-50/50"
                  />
                  <input
                    type="text"
                    placeholder="NUIT"
                    value={customerNuit}
                    onChange={(e) => setCustomerNuit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder-slate-400 bg-slate-50/50"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Morada"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder-slate-400 bg-slate-50/50"
                />

                {customerNuit.trim() && customerAddress.trim() ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-[9px] font-bold leading-tight border border-blue-200 shadow-sm animate-none">
                    <span>🟢 Dados preenchidos (NUIT & Morada): IVA de 16% tributável para este cliente.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-bold leading-tight border border-emerald-200 shadow-sm animate-none">
                    <span>💡 Isenção de IVA ativa: NUIT e Morada em falta. Preencha ambos para aplicar 16% de IVA.</span>
                  </div>
                )}
              </div>

              {/* Submit Trigger checkout trigger */}
              <button
                type="submit"
                disabled={cart.length === 0}
                className={`w-full py-4 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
                  cart.length === 0
                    ? 'bg-slate-100 text-slate-400 border border-slate-200/55 cursor-not-allowed'
                    : 'bg-[#009739] hover:bg-[#009739]/90 text-white shadow-md font-black'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                CONCLUIR E EMITIR FATURA
              </button>
            </form>

          </div>
        </div>

        {/* Fecho de Caixa Action Card */}
        {onOpenClosureModal && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50/60 border border-orange-200/70 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs font-sans animate-in fade-in duration-350" id="pos-flow-cashier-closure-widget">
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-[11px] font-black text-orange-700 tracking-wider uppercase flex items-center gap-1.5 leading-none">
                <Lock className="w-4 h-4 text-orange-600 stroke-[2.5]" />
                Controlo de Caixa e Turnos
              </span>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight">
                Registe o saldo final e conclua o expediente do dia corrente.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenClosureModal}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98] shrink-0 text-center uppercase"
              title="Solicitar Fecho de Caixa"
            >
              Fechar Caixa
            </button>
          </div>
        )}

      </div>

      {/* Simulated Thermal Custom Printed Receipt Modal Pop-up */}
      {receiptSale && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto overflow-x-auto">
          <div className="bg-white p-5 sm:p-6 my-auto rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl relative overflow-y-auto overflow-x-auto max-h-[92vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setReceiptSale(null);
                setConfirmingSale(false);
              }}
              className="absolute right-5 top-5 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Elegant 76mm Thermal Receipt Component */}
            <ThermalReceipt 
              sale={receiptSale} 
              storeConfig={storeConfig} 
              confirmingSale={confirmingSale} 
            />

            {/* Print Confirmation triggers */}
            <div className="mt-4 flex flex-col gap-2 font-sans">
              {confirmingSale ? (
                <>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-bold bg-amber-50 border border-amber-200 p-2.5 rounded-xl justify-center shadow-xs">
                    <AlertCircle className="w-4 h-4 text-amber-550" />
                    Por favor, confirme os itens da fatura abaixo para concluir.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleConfirmAndComplete}
                      className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirmar Venda
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptSale(null);
                        setConfirmingSale(false);
                      }}
                      className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer transition-colors text-center"
                    >
                      Voltar e Ajustar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl justify-center shadow-xs animate-in fade-in duration-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Venda registrada com sucesso!
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (receiptSale) {
                          printThermalReceipt(receiptSale, storeConfig);
                        }
                      }}
                      className="py-3 px-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Recibo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptSale(null);
                        setConfirmingSale(false);
                      }}
                      className="py-3 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors text-center"
                    >
                      Nova Venda
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products & Stocks List Modal Overlay (Reduz o tamanho do template por dispostivos móveis) */}
      {isProductsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[90vh] sm:max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 relative">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-4 sm:p-5 text-white flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-500 stroke-[2.5]" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">Catálogo & Stock de Produtos</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Consulte quantidades, preços e adicione ao carrinho</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Fechar catálogo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Filter Toolbar */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar produto por nome, SKU, código de barras..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-bold text-slate-800 shadow-sm animate-none"
                  autoFocus
                />
                {modalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModalSearchQuery('')}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition-colors"
                    title="Limpar pesquisa"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              {/* Counter */}
              <div className="text-[11px] font-black font-mono text-slate-500 uppercase tracking-wider bg-slate-200/50 px-3 py-2 rounded-xl shrink-0">
                {modalFilteredProducts.length} Itens
              </div>
            </div>

            {/* Modal Content - Products Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-150/20 scrollbar-thin">
              {modalFilteredProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-medium font-sans">
                  Nenhum produto correspondente a "<span className="font-extrabold text-slate-700">{modalSearchQuery}</span>"
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {modalFilteredProducts.map((p) => {
                    const isOut = p.quantity === 0;
                    const isLow = p.quantity <= p.minStock && p.quantity > 0;

                    const inCartItem = cart.find((item) => item.product.id === p.id);
                    const inCartQty = inCartItem ? inCartItem.quantity : 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (!isOut) {
                            handleAddToCart(p);
                            if (scannerSound) {
                              playBeep();
                            }
                          }
                        }}
                        className={`bg-white border rounded-2xl p-4 flex flex-col justify-between h-[165px] cursor-pointer shadow-xs transition-all duration-200 hover:shadow-md select-none relative ${
                          isOut
                            ? 'border-red-200 bg-rose-50/20 cursor-not-allowed opacity-75'
                            : 'border-slate-200/85 hover:border-orange-400 active:scale-[0.98]'
                        }`}
                      >
                        {inCartQty > 0 && (
                          <span className="absolute top-2.5 right-2.5 bg-orange-600 text-white text-[10px] font-extrabold w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            {inCartQty}
                          </span>
                        )}

                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            {p.category}
                          </span>
                          <div className="text-xs font-bold text-slate-800 truncate leading-tight mt-0.5" title={p.name}>
                            {p.name}
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">SKU: {p.code}</p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                          <span className="text-xs font-black font-sans text-slate-900 leading-none">
                            {formatMZN(p.salePrice)}
                          </span>

                          <div className="flex justify-between items-center mt-1">
                            {isOut ? (
                              <span className="text-[8px] bg-rose-50 border border-rose-100/50 text-rose-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Esgotado
                              </span>
                            ) : isLow ? (
                              <span className="text-[8.5px] bg-amber-50 border border-amber-200 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Baixo: {p.quantity} un
                              </span>
                            ) : (
                              <span className="text-[8.5px] bg-emerald-50 border border-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded font-bold tracking-wider">
                                Stock: {p.quantity}
                              </span>
                            )}
                            
                            {!isOut && (
                              <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-orange-600 hover:text-white transition-colors">
                                + Add
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-150 flex justify-between items-center flex-wrap gap-2 text-xs font-sans">
              <span className="text-slate-500 font-medium font-mono text-[11px]">
                💡 Dica: Clique em qualquer produto para adicioná-lo diretamente ao carrinho.
              </span>
              <button
                type="button"
                onClick={() => setIsProductsModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                Voltar ao Terminal
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
