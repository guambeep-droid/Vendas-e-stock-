/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { Product, StockMovement } from '../types';
import { 
  Package, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  X,
  FileSpreadsheet,
  Shuffle,
  ScanBarcode,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  PackagePlus,
  History,
  TrendingDown,
  TrendingUp,
  FileText,
  Calendar,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  categories: string[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onAddProductsBatch?: (products: Omit<Product, 'id'>[]) => void;
  onUpdateProduct: (product: Product, reason?: string) => void;
  onDeleteProduct: (productId: string) => void;
  onAddCategory: (category: string) => void;
  whatsappNumber: string;
  onUpdateWhatsappNumber: (num: string) => void;
  movements: StockMovement[];
  onQuickAdjust: (product: Product, delta: number) => void;
}

// WhatsApp URL helper
const getWhatsappLowStockLink = (phone: string, product: Product) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const msg = `*My Sales & Stocks: Alerta de Stock Baixo* 🚨\n\nAtenção, o produto *${product.name}* (Cód: ${product.code}) atingiu o nível crítico.\n\n• *Stock Físico Atual:* *${product.quantity} un*\n• *Mínimo Recomendado:* *${product.minStock} un*\n\n_Por favor, providencie o reabastecimento comercial._`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
};

export default function InventoryView({
  products,
  categories,
  onAddProduct,
  onAddProductsBatch,
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  whatsappNumber,
  onUpdateWhatsappNumber,
  movements = [],
  onQuickAdjust,
}: InventoryViewProps) {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState<'todos' | 'saudavel' | 'baixo' | 'zerado'>('todos');
  
  // Navigation State
  const [activeSubTab, setActiveSubTab] = useState<'produtos' | 'movimentos'>('produtos');

  // Movements View Filters & Search
  const [movementSearch, setMovementSearch] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('todos');

  // New/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // "Adicionar Stock" Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockSelectedProduct, setStockSelectedProduct] = useState<Product | null>(null);
  const [stockAddQty, setStockAddQty] = useState<number>(10);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockAddReason, setStockAddReason] = useState('Abastecimento de estoque');

  // Selected Product for details pop-up
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);

  // Report state for showing a micro-report text feedback on stock addition/registration
  const [lastReport, setLastReport] = useState<{
    type: 'cadastro' | 'estoque';
    productName: string;
    code: string;
    quantityAdded: number;
    finalQuantity: number;
    timestamp: string;
  } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: categories[0] || 'Outros',
    costPrice: 0,
    salePrice: 0,
    quantity: 0,
    minStock: 5,
  });

  // Batch Excel Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedProducts, setParsedProducts] = useState<{
    status: 'novo' | 'atualizar_stock' | 'invalido';
    errorMsg?: string;
    code: string;
    name: string;
    category: string;
    costPrice: number;
    salePrice: number;
    quantity: number;
    minStock: number;
  }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // 1. Template Download
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          'Código': '1001',
          'Nome': 'Coca-Cola Caneco 330ml',
          'Categoria': 'Bebidas',
          'Preço Custo': 45.00,
          'Preço Venda': 65.00,
          'Quantidade': 120,
          'Estoque Mínimo': 10
        },
        {
          'Código': '1002',
          'Nome': 'Arroz Tio Lucas 5kg',
          'Categoria': 'Mercearia',
          'Preço Custo': 280.00,
          'Preço Venda': 350.00,
          'Quantidade': 40,
          'Estoque Mínimo': 5
        },
        {
          'Código': '1003',
          'Nome': 'Sabão em Pó Omo 1kg',
          'Categoria': 'Limpeza',
          'Preço Custo': 180.00,
          'Preço Venda': 230.00,
          'Quantidade': 25,
          'Estoque Mínimo': 5
        }
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      const wscols = [
        { wch: 15 }, // Código
        { wch: 30 }, // Nome
        { wch: 18 }, // Categoria
        { wch: 15 }, // Preço Custo
        { wch: 15 }, // Preço Venda
        { wch: 15 }, // Quantidade
        { wch: 15 }  // Estoque Mínimo
      ];
      ws['!cols'] = wscols;

      XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
      XLSX.writeFile(wb, 'modelo_importacao_produtos.xlsx');
    } catch (err: any) {
      console.error('Falha ao baixar modelo:', err);
    }
  };

  // 2. Excel Parsing and Validation
  const handleExcelUpload = (file: File) => {
    if (!file) return;
    setImportFileName(file.name);
    setImportError(null);
    setParsedProducts([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          throw new Error('O ficheiro Excel está vazio ou não tem folhas de cálculo.');
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          throw new Error('Nenhum registo de produto encontrado na primeira folha de cálculo.');
        }

        const processed = jsonData.map((row) => {
          const normalized: any = {};
          
          Object.keys(row).forEach((key) => {
            const lowerKey = key.trim().toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip accents!
            
            if (['codigo', 'sku', 'codigo de barras', 'codigo de barra', 'barcode', 'cod'].includes(lowerKey)) {
              normalized.code = String(row[key] ?? '').trim();
            }
            else if (['nome', 'produto', 'designacao', 'nome do produto', 'item'].includes(lowerKey)) {
              normalized.name = String(row[key] ?? '').trim();
            }
            else if (['categoria', 'grupo', 'categorias', 'seccao', 'cat'].includes(lowerKey)) {
              normalized.category = String(row[key] ?? '').trim();
            }
            else if (['preco custo', 'preco de custo', 'custo', 'valor de custo', 'preco compra', 'valor custo', 'compra', 'precocusto'].includes(lowerKey)) {
              normalized.costPrice = Number(row[key]) || 0;
            }
            else if (['preco venda', 'preco de venda', 'venda', 'valor de venda', 'preco comercial', 'valor venda', 'precovenda'].includes(lowerKey)) {
              normalized.salePrice = Number(row[key]) || 0;
            }
            else if (['stock', 'quantidade', 'stock atual', 'quantidade atual', 'qtd', 'estoque', 'unidades', 'unidade'].includes(lowerKey)) {
              normalized.quantity = Number(row[key]) || 0;
            }
            else if (['stock minimo', 'estoque minimo', 'minimo', 'alerta minimo', 'qtd minima', 'stock min', 'estoqueminimo'].includes(lowerKey)) {
              normalized.minStock = Number(row[key]) || 0;
            }
          });

          const itemCode = normalized.code || '';
          const itemName = normalized.name || '';
          const itemCategory = normalized.category || 'Geral';
          const itemQuantity = normalized.quantity !== undefined ? normalized.quantity : 0;
          const itemCostPrice = normalized.costPrice !== undefined ? normalized.costPrice : 0;
          const itemSalePrice = normalized.salePrice !== undefined ? normalized.salePrice : 0;
          const itemMinStock = normalized.minStock !== undefined ? normalized.minStock : 5;

          let status: 'novo' | 'atualizar_stock' | 'invalido' = 'novo';
          let errorMsg = '';

          if (!itemName) {
            status = 'invalido';
            errorMsg = 'Nome em falta';
          } else if (!itemCode) {
            status = 'invalido';
            errorMsg = 'Código/SKU em falta';
          } else {
            const existingProduct = products.find((p) => p.code === itemCode);
            if (existingProduct) {
              status = 'atualizar_stock';
            }
          }

          return {
            status,
            errorMsg,
            code: itemCode,
            name: itemName,
            category: itemCategory,
            costPrice: itemCostPrice,
            salePrice: itemSalePrice,
            quantity: itemQuantity,
            minStock: itemMinStock,
          };
        });

        setParsedProducts(processed);
      } catch (err: any) {
        setImportError(err.message || 'Erro ao processar o arquivo. Verifique se o formato e colunas seguem o modelo.');
        console.error('Erro de upload Excel:', err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 3. Confirm Excel Import
  const handleConfirmImport = () => {
    try {
      const validItems = parsedProducts.filter((p) => p.status !== 'invalido');
      if (validItems.length === 0) {
        setImportError('Nenhum item válido para importação.');
        return;
      }

      // Add missing categories
      validItems.forEach((item) => {
        if (item.category && !categories.includes(item.category)) {
          onAddCategory(item.category);
        }
      });

      const productsToAdd: Omit<Product, 'id'>[] = [];
      let updatedCount = 0;

      validItems.forEach((item) => {
        const existing = products.find((p) => p.code === item.code);
        if (existing) {
          const finalQty = existing.quantity + item.quantity;
          onUpdateProduct(
            {
              ...existing,
              quantity: finalQty,
              costPrice: item.costPrice > 0 ? item.costPrice : existing.costPrice,
              salePrice: item.salePrice > 0 ? item.salePrice : existing.salePrice,
            },
            `Abastecimento via Importação Excel (+${item.quantity} un)`
          );
          updatedCount++;
        } else {
          productsToAdd.push({
            code: item.code,
            name: item.name,
            category: item.category || 'Geral',
            costPrice: item.costPrice,
            salePrice: item.salePrice,
            quantity: item.quantity,
            minStock: item.minStock,
          });
        }
      });

      if (productsToAdd.length > 0) {
        if (onAddProductsBatch) {
          onAddProductsBatch(productsToAdd);
        } else {
          productsToAdd.forEach((p) => onAddProduct(p));
        }
      }

      setLastReport({
        type: 'cadastro',
        productName: `Importação em Lote Concluída`,
        code: `${validItems.length} SKU(s) processados`,
        quantityAdded: productsToAdd.length,
        finalQuantity: validItems.length,
        timestamp: new Date().toLocaleTimeString('pt-MZ'),
      });

      setIsImportModalOpen(false);
      setParsedProducts([]);
      setImportFileName(null);
    } catch (err: any) {
      setImportError(`Erro fatal na importação: ${err.message || err}`);
    }
  };

  // Barcode Scanner Control States
  const [isScanning, setIsScanning] = useState(false);
  const [scannerSound, setScannerSound] = useState(true);
  const [scannerStatus, setScannerStatus] = useState<string>('Esperando por ativação...');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Clear camera error and status when scanner is toggled off
  useEffect(() => {
    if (!isScanning) {
      setCameraError(null);
      setScannerStatus('Esperando por ativação...');
    }
  }, [isScanning]);

  // Turn off scanner if modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      setIsScanning(false);
    }
  }, [isModalOpen]);

  // Audio synthesizer beep for successful scan
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
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio Context blocked by policy:", e);
    }
  };

  const handleBarcodeDecoded = (codeText: string) => {
    const cleanedCode = codeText.trim();
    if (!cleanedCode) return;

    if (scannerSound) {
      playBeep();
    }

    setFormData((prev) => ({ ...prev, code: cleanedCode }));
    setScannerStatus(`Sucesso: "${cleanedCode}" inserido!`);
    
    // Auto scale close scanning shortly after detection
    setTimeout(() => {
      setIsScanning(false);
    }, 900);
  };

  // Real Camera hardware integration via HTML5-QrCode
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    if (isScanning) {
      setScannerStatus('Iniciando webcam do dispositivo...');
      
      const startCamera = async () => {
        try {
          const container = document.getElementById("inventory-barcode-scanner-viewport");
          if (!container || !isMounted) return;

          html5QrCode = new Html5Qrcode("inventory-barcode-scanner-viewport");
          
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
              // Ignore failure frames silently
            }
          );
          if (isMounted) {
            setScannerStatus('Câmera Ativa — Aponte para o código de barras');
          } else {
            if (html5QrCode.isScanning) {
              await html5QrCode.stop();
              html5QrCode.clear();
            }
          }
        } catch (err: any) {
          console.error("Erro no hardware da câmera em estoque:", err);
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
            }).catch(e => console.error("Erro ao desligar câmera em estoque:", e));
          }
        }
      };
    }
  }, [isScanning]);

  // Category creation addition state
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Apply filters
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === 'saudavel') {
      matchesStatus = p.quantity > p.minStock;
    } else if (selectedStatus === 'baixo') {
      matchesStatus = p.quantity <= p.minStock && p.quantity > 0;
    } else if (selectedStatus === 'zerado') {
      matchesStatus = p.quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filtered movements for the movements listing sub-tab
  const filteredMovements = movements.filter((mov) => {
    // 1. Search Query filter (matches product name or SKU)
    const matchesSearch = 
      mov.productName.toLowerCase().includes(movementSearch.toLowerCase()) ||
      mov.productSku.toLowerCase().includes(movementSearch.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Type Filter
    if (movementTypeFilter === 'todos') return true;
    if (movementTypeFilter === 'cadastro') return mov.type === 'cadastro';
    if (movementTypeFilter === 'entrada') return mov.type === 'entrada';
    if (movementTypeFilter === 'saida') return mov.type === 'saida';
    if (movementTypeFilter === 'venda') return mov.type === 'venda';
    if (movementTypeFilter === 'estorno') return mov.type === 'estorno';
    if (movementTypeFilter === 'ajustes') {
      return mov.type === 'ajuste_positivo' || mov.type === 'ajuste_negativo';
    }

    return true;
  });

  // Calculate current catalog stats
  const totalStockCost = products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0);
  const totalStockRevenue = products.reduce((sum, p) => sum + p.quantity * p.salePrice, 0);
  const totalStockProfit = totalStockRevenue - totalStockCost;

  // Format Helper
  const formatMZN = (val: number) => {
    return val.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MT';
  };

  // Generate random Barcode prefix 789 + 5 digitos
  const handleGenerateBarcode = () => {
    const randomCode = '789' + Math.floor(10000 + Math.random() * 90000).toString();
    setFormData((prev) => ({ ...prev, code: randomCode }));
  };

  // Open Add Product Dialog
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      code: '',
      name: '',
      category: categories[0] || 'Outros',
      costPrice: 10,
      salePrice: 20,
      quantity: 15,
      minStock: 5,
    });
    setShowNewCatInput(false);
    setIsModalOpen(true);
  };

  // Open Add Stock Dialog
  const handleOpenAddStock = () => {
    setStockSelectedProduct(null);
    setStockAddQty(10);
    setStockSearchQuery('');
    setStockAddReason('Abastecimento mercantil');
    setIsStockModalOpen(true);
  };

  // Handle Add Stock Submit
  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockSelectedProduct || stockAddQty <= 0) return;

    const finalQty = stockSelectedProduct.quantity + stockAddQty;
    onUpdateProduct({
      ...stockSelectedProduct,
      quantity: finalQty,
    }, stockAddReason.trim() || 'Abastecimento mercantil');
    
    setLastReport({
      type: 'estoque',
      productName: stockSelectedProduct.name,
      code: stockSelectedProduct.code,
      quantityAdded: stockAddQty,
      finalQuantity: finalQty,
      timestamp: new Date().toLocaleTimeString('pt-MZ'),
    });

    setIsStockModalOpen(false);
  };

  // Open Edit Product Dialog
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      category: product.category,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      quantity: product.quantity,
      minStock: product.minStock,
    });
    setShowNewCatInput(false);
    setIsModalOpen(true);
  };

  // Handle Form field changes with numeric parsing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (['costPrice', 'salePrice', 'quantity', 'minStock'].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Add category handler
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim()) {
      const formatted = newCatName.trim();
      onAddCategory(formatted);
      setFormData((prev) => ({ ...prev, category: formatted }));
      setNewCatName('');
      setShowNewCatInput(false);
    }
  };

  // Save changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      return; 
    }

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...formData,
      });
    } else {
      onAddProduct(formData);
      setLastReport({
        type: 'cadastro',
        productName: formData.name,
        code: formData.code,
        quantityAdded: formData.quantity,
        finalQuantity: formData.quantity,
        timestamp: new Date().toLocaleTimeString('pt-MZ'),
      });
    }
    setIsModalOpen(false);
  };

  // Safe stock adjuster click (+ / -)
  const handleAdjustQuantity = (product: Product, adjustment: number) => {
    onQuickAdjust(product, adjustment);
  };

  // Simulate exporting inventory CSV
  const handleExportCSV = () => {
    const headers = 'Código,Produto,Categoria,Preço Custo,Preço Venda,Estoque Atual,Estoque Mínimo,Status\n';
    const rows = products.map((p) => {
      const status = p.quantity === 0 ? 'Zerado' : p.quantity <= p.minStock ? 'Baixo' : 'Saudável';
      return `"${p.code}","${p.name.replace(/"/g, '""')}","${p.category}",${p.costPrice},${p.salePrice},${p.quantity},${p.minStock},"${status}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_estoque_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export stock movements history log as CSV
  const handleExportMovementsCSV = () => {
    const headers = 'ID Movimento,Data/Hora,Produto,SKU,Tipo Operação,Quantidade Alterada,Stock Anterior,Stock Novo,Motivo/Notas\n';
    const rows = filteredMovements.map((mov) => {
      const dateObj = new Date(mov.timestamp);
      const formattedDate = dateObj.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + dateObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
      
      let opTypeLabel = '';
      switch (mov.type) {
        case 'cadastro': opTypeLabel = 'Cadastro'; break;
        case 'entrada': opTypeLabel = 'Abastecimento'; break;
        case 'ajuste_positivo': opTypeLabel = 'Ajuste (+)'; break;
        case 'saida': opTypeLabel = 'Retirada'; break;
        case 'ajuste_negativo': opTypeLabel = 'Ajuste (-)'; break;
        case 'venda': opTypeLabel = 'Venda POS'; break;
        case 'estorno': opTypeLabel = 'Estorno'; break;
        default: opTypeLabel = mov.type;
      }
      
      const escapedReason = mov.reason.replace(/"/g, '""');
      const escapedName = mov.productName.replace(/"/g, '""');
      
      return `"${mov.id}","${formattedDate}","${escapedName}","${mov.productSku}","${opTypeLabel}",${mov.quantity},${mov.prevQuantity},${mov.newQuantity},"${escapedReason}"`;
    }).join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `movimentacoes_estoque_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="inventory-view-section">
      {/* Stock Executive Metrics Frame */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="inventory-totals-cards">
        <div className="p-5 bg-white border border-slate-205/80 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stock Total a Preço de Custo</span>
          <p className="text-xl font-black font-mono text-slate-800 mt-1">{formatMZN(totalStockCost)}</p>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">Investimento real em aquisição</div>
        </div>

        <div className="p-5 bg-white border border-slate-205/80 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Retorno de Venda Previsto</span>
          <p className="text-xl font-black font-mono text-slate-800 mt-1">{formatMZN(totalStockRevenue)}</p>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">Faturamento bruto após escoamento</div>
        </div>

        <div className="p-5 bg-white border border-slate-205/80 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Margem Líquida Estimada</span>
          <p className="text-xl font-black font-mono text-emerald-600 mt-1">{formatMZN(totalStockProfit)}</p>
          <div className="mt-2 text-[10px] text-emerald-600 font-bold">Expectativa líquida de faturamento</div>
        </div>
      </div>

      {/* Real-time Operation Micro-Report Banner */}
      {lastReport && (
        <div className="bg-emerald-50/60 border border-emerald-150 rounded-2xl p-4.5 text-slate-800 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-3 duration-200" id="last-action-report-banner">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100/70 rounded-xl text-emerald-700 shrink-0 mt-0.5">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-800 bg-emerald-150/50 px-2 py-0.5 rounded-md font-mono">
                  {lastReport.type === 'cadastro' ? 'Novo Cadastro' : 'Entrada de Stock'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium font-mono">{lastReport.timestamp}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800 mt-1.5">
                Relatório Técnico: <span className="font-black text-emerald-950 font-sans">{lastReport.productName}</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {lastReport.type === 'cadastro' ? (
                  <>
                    Produto cadastrado com sucesso sob o SKU <strong className="font-mono text-slate-700">{lastReport.code}</strong>. 
                    Lote inicial de <strong>{lastReport.quantityAdded} un.</strong> já está disponível no catálogo de vendas.
                  </>
                ) : (
                  <>
                    Abastecimento concluído! Foram acrescentadas <strong className="text-emerald-700 font-bold">+{lastReport.quantityAdded} un.</strong>. 
                    O estoque atual foi atualizado de forma segura de <span className="line-through text-slate-450 font-mono">{(lastReport.finalQuantity - lastReport.quantityAdded)} un.</span> para <strong className="text-emerald-700 font-bold font-mono">{lastReport.finalQuantity} un.</strong>.
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastReport(null)}
            className="self-end sm:self-center text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 bg-emerald-100/50 hover:bg-emerald-200/50 text-emerald-800 rounded-xl border border-emerald-200/30 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            Confirmar Relatório
          </button>
        </div>
      )}

      {/* Sub-Tab Navigation Switcher */}
      <div className="flex bg-slate-200/50 p-1 rounded-2xl max-w-xs" id="inventory-subtabs">
        <button
          onClick={() => setActiveSubTab('produtos')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            activeSubTab === 'produtos'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-orange-500" />
          Produtos
        </button>
        <button
          onClick={() => setActiveSubTab('movimentos')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
            activeSubTab === 'movimentos'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
          }`}
        >
          <History className="w-3.5 h-3.5 text-slate-600" />
          Movimentos
        </button>
      </div>

      {/* Control Actions / Search and Filters */}
      {activeSubTab === 'produtos' && (
        <>
          <div className="bg-white p-6 border border-slate-200/80 rounded-2xl shadow-xs space-y-5">
        {/* Upper catalog header with export */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Catálogo de Produtos ({filteredProducts.length} listados)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Gerenciamento de SKUs, preços, custos, balanço e margens de venda.</p>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4.5 py-2.5 hover:bg-emerald-50/50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-200 h-11 self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {/* Buttons laid out horizontally: One on left side, one on right side (slighly larger) */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-1 w-full" id="inventory-horizontal-actions">
          {/* Adicionar Stock Button (Left side) */}
          <button
            onClick={handleOpenAddStock}
            className="flex-1 justify-center px-4 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all duration-200 whitespace-nowrap h-11 sm:h-12 active:scale-[0.98]"
          >
            <PackagePlus className="w-4.5 h-4.5 text-slate-500" />
            Adicionar Stock
          </button>

          {/* Importar Excel Button */}
          <button
            onClick={() => {
              setImportError(null);
              setParsedProducts([]);
              setImportFileName(null);
              setIsImportModalOpen(true);
            }}
            className="flex-1 justify-center px-4 py-2.5 sm:py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all duration-200 whitespace-nowrap h-11 sm:h-12 active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
            Importar de Excel
          </button>

          {/* General Add Button / Cadastrar Produto (Right side) */}
          <button
            onClick={handleOpenAdd}
            className="flex-1 justify-center px-4 py-2.5 sm:py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md shadow-orange-600/15 hover:shadow-lg transition-all duration-200 whitespace-nowrap h-11 sm:h-12 active:scale-[0.98]"
          >
            <Plus className="w-4.5 h-4.5 text-orange-105" />
            Cadastrar Produto
          </button>
        </div>

        {/* Filters grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Search */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome comercial ou código SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder-slate-400 bg-slate-50"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 px-3 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer font-medium text-slate-700"
            >
              <option value="Todas">Todas as Categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tabs/Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-50 px-3 py-2 text-xs border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer font-medium text-slate-700"
            >
              <option value="todos">Todos os Status</option>
              <option value="saudavel">Estoque Saudável</option>
              <option value="baixo">Estoque Baixo</option>
              <option value="zerado">Estoques Zerados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid table list */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-slate-405">
            <Package className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <p className="text-sm font-semibold">Nenhum produto atende aos filtros atuais.</p>
            <p className="text-xs text-slate-400 mt-1">Experimente mudar o termo de pesquisa ou limpar os filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6 w-[35%]">Código SKU</th>
                  <th className="py-3.5 px-6">Nome Comercial (Clique para ver detalhes)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                {filteredProducts.map((p) => {
                  const isOut = p.quantity === 0;

                  return (
                    <tr
                      key={p.id}
                      className={`transition-all duration-150 border-l-2 ${
                        isOut 
                          ? 'bg-rose-50/20 hover:bg-rose-100/30 border-l-rose-500' 
                          : 'hover:bg-indigo-50/20 border-l-transparent hover:border-l-indigo-400'
                      }`}
                      id={`row-product-${p.id}`}
                    >
                      {/* Code SKU */}
                      <td className="py-4 px-6 font-mono font-bold text-slate-500 select-all" id={`row-code-${p.id}`}>
                        {p.code}
                      </td>

                      {/* Name (Clickable) */}
                      <td className="py-4 px-6" id={`row-name-${p.id}`}>
                        <button
                          onClick={() => setSelectedDetailProduct(p)}
                          className="text-left font-black text-slate-800 hover:text-indigo-600 hover:underline cursor-pointer transition-colors focus:outline-none flex items-center gap-2 group w-full"
                          type="button"
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md transition-all">
                            Ver mais ↗
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}

      {/* activeSubTab === 'movimentos' view */}
      {activeSubTab === 'movimentos' && (
        <div className="bg-white p-6 border border-slate-200/80 rounded-2xl shadow-xs space-y-5 animate-in fade-in duration-200" id="movements-log-card">
          {/* Upper movements header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-orange-500" />
                Registo de Movimentos de Stock ({movements.length} registados)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Histórico completo de entradas, saídas, estornos, vendas e ajustes manuais de estoque.</p>
            </div>
            {movements.length > 0 && (
              <div className="flex flex-row flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleExportMovementsCSV}
                  className="px-4 py-2 hover:bg-emerald-50/50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-200 h-10"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Exportar Movimentos
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Tem certeza de que deseja limpar todo o histórico de movimentações? Esta ação não pode ser desfeita.')) {
                      localStorage.setItem('estoque-movimentos-v1', JSON.stringify([]));
                      window.location.reload(); // Quick browser refresh to re-sync state
                    }
                  }}
                  className="px-4 py-2 hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-200 h-10"
                >
                  <RotateCcw className="w-4 h-4" />
                  Limpar Registos
                </button>
              </div>
            )}
          </div>

          {/* Filters Area for Movements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Pesquisar por SKU ou Produto..."
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/50"
              />
            </div>

            <div>
              <select
                value={movementTypeFilter}
                onChange={(e) => setMovementTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50/55 text-slate-650"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="cadastro">Cadastros Iniciais</option>
                <option value="entrada">Abastecimentos (Soma)</option>
                <option value="saida">Retiradas / Exclusões</option>
                <option value="ajustes">Ajustes Rápidos (Manuais)</option>
                <option value="venda">Vendas no Sistema</option>
                <option value="estorno">Estornos / Devoluções</option>
              </select>
            </div>

            <div className="p-2 bg-slate-50 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 border border-slate-100">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Fuso Horário de Moçambique</span>
            </div>
          </div>

          {/* List of Movements */}
          {filteredMovements.length === 0 ? (
            <div className="py-12 text-center text-slate-450 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-3.5" />
              <p className="text-sm font-black">Nenhuma movimentação encontrada</p>
              <p className="text-xs text-slate-400 mt-1">Realize ajustes ou vendas para popular os registos históricos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/60 rounded-xl">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Data e Hora</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Produto / SKU</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Operação</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Qt. Alterada</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider text-center">Balanço de Stock</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">Motivo / Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/70">
                  {filteredMovements.map((mov) => {
                    const dateObj = new Date(mov.timestamp);
                    const formattedDate = dateObj.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) + ', ' + dateObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

                    let opLabel = '';
                    let opStyle = '';
                    let qtyPrefix = '';
                    let qtyStyle = '';

                    switch (mov.type) {
                      case 'cadastro':
                        opLabel = 'Cadastro';
                        opStyle = 'bg-blue-100 text-blue-700';
                        qtyPrefix = '';
                        qtyStyle = 'text-blue-600 font-bold';
                        break;
                      case 'entrada':
                      case 'ajuste_positivo':
                        opLabel = mov.type === 'entrada' ? 'Abastecimento' : 'Ajuste (+)';
                        opStyle = 'bg-emerald-100 text-emerald-800';
                        qtyPrefix = '+';
                        qtyStyle = 'text-emerald-600 font-black';
                        break;
                      case 'saida':
                      case 'ajuste_negativo':
                        opLabel = mov.type === 'saida' ? 'Retirada' : 'Ajuste (-)';
                        opStyle = 'bg-rose-100 text-rose-800';
                        qtyPrefix = '-';
                        qtyStyle = 'text-rose-600 font-extrabold';
                        break;
                      case 'venda':
                        opLabel = 'Venda POS';
                        opStyle = 'bg-slate-100 text-slate-700';
                        qtyPrefix = '-';
                        qtyStyle = 'text-slate-700 font-semibold';
                        break;
                      case 'estorno':
                        opLabel = 'Estorno';
                        opStyle = 'bg-amber-100 text-amber-800';
                        qtyPrefix = '+';
                        qtyStyle = 'text-amber-600 font-bold';
                        break;
                    }

                    return (
                      <tr key={mov.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">{formattedDate}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800 leading-tight">{mov.productName}</p>
                          <p className="font-mono text-[9px] text-slate-400 uppercase mt-0.5">SKU: {mov.productSku}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${opStyle}`}>
                            {opLabel}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-center whitespace-nowrap ${qtyStyle}`}>
                          {qtyPrefix}{mov.quantity}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-[10px] text-slate-500 whitespace-nowrap">
                          {mov.prevQuantity} ➔ <b className="text-slate-850 font-bold">{mov.newQuantity}</b>
                        </td>
                        <td className="px-4 py-3 text-slate-650 max-w-xs truncate" title={mov.reason}>
                          {mov.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Product ADD / EDIT Modal Sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto overflow-x-auto">
          <div className="bg-white p-5 sm:p-7 my-auto rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl relative overflow-y-auto overflow-x-auto max-h-[92vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-1 rounded-lg hover:bg-slate-105 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-orange-600" />
              {editingProduct ? 'Editar Informações do Produto' : 'Cadastrar Novo Produto Comercial'}
            </h3>

            {/* Main Fields Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nome Comercial do Produto *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Tênis de Corrida Esportivo"
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder-slate-400 bg-slate-50"
                />
              </div>

              {/* SKU & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Código SKU ou Barras *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="Ex: 78910541"
                      required
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => setIsScanning(!isScanning)}
                      title={isScanning ? "Fechar Leitor" : "Escanear com a Câmera"}
                      className={`px-3 border rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                        isScanning 
                          ? 'bg-rose-600 border-rose-600 text-white hover:bg-rose-500' 
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ScanBarcode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      title="Gerar código de barras"
                      className="px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Categoria</label>
                  {showNewCatInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nova categoria..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50 animate-in slide-in-from-left-2 duration-150"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        className="px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewCatInput(false)}
                        className="p-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full bg-slate-50 px-3 py-2 text-xs border border-slate-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer font-medium text-slate-700"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowNewCatInput(true)}
                        className="p-2 bg-slate-100 hover:bg-slate-205 border border-slate-200 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                        title="Criar nova Categoria"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Camera Scanner Viewport inside Modal when isScanning is true */}
              {isScanning && (
                <div className="border border-slate-200 rounded-2xl bg-slate-900 p-4 text-white overflow-hidden space-y-3 relative mx-auto max-w-full">
                  <div className="flex justify-between items-center bg-slate-950/45 p-2 rounded-xl border border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-orange-400" />
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-300">Leitor do Estoque Ativo</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setScannerSound(!scannerSound)}
                        title={scannerSound ? "Desativar som do BIP" : "Ativar som do BIP"}
                        className="p-1 px-2 border border-slate-800 hover:bg-slate-800 rounded-lg text-[9px] font-bold tracking-widest flex items-center gap-1 text-slate-300 cursor-pointer"
                      >
                        {scannerSound ? <Volume2 className="w-3 h-3 text-emerald-450" /> : <VolumeX className="w-3 h-3 text-slate-400" />}
                        <span>SOM</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsScanning(false)}
                        className="p-1 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="relative aspect-video max-h-[160px] bg-black/40 rounded-xl overflow-hidden border border-slate-800/80 flex justify-center items-center">
                    {/* Viewport for HTML5-QRCode */}
                    <div id="inventory-barcode-scanner-viewport" className="w-[100%] h-[100%] object-cover"></div>

                    {!cameraError && (
                      <div className="absolute left-0 right-0 h-0.5 bg-[#D81E05] shadow-[0_0_15px_#D81E05,0_0_25px_#D81E05] animate-laser pointer-events-none z-10"></div>
                    )}

                    {cameraError && (
                      <div className="absolute inset-0 bg-slate-950 p-3 flex flex-col justify-center items-center text-center z-20 space-y-2">
                        <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-full">
                          <CameraOff className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 font-sans">
                          <h6 className="text-[10px] font-black uppercase tracking-wider text-rose-500 font-bold">Acesso à Câmera Bloqueado</h6>
                          <p className="text-[9px] text-slate-400 leading-normal max-w-[90%] mx-auto">
                            O navegador bloqueou o acesso devido a restrições de iframe. Abra o app numa nova guia.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={window.location.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-[8px] uppercase tracking-wider transition-colors flex items-center gap-1 shadow-md cursor-pointer decoration-transparent font-sans"
                          >
                            <span>Abrir em Nova Aba ↗</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setCameraError(null)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-[8px] uppercase tracking-wider transition-colors cursor-pointer font-sans"
                          >
                            Tentar De Novo
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Precise status banner inside active view */}
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-950/90 px-3 py-1.5 text-center text-[9px] border-t border-slate-850 flex items-center justify-center gap-1.5 z-10">
                      <span className={`w-1.5 h-1.5 rounded-full ${cameraError ? 'bg-rose-500' : 'bg-emerald-450 animate-pulse'}`}></span>
                      <span className="font-semibold text-slate-300 truncate">{scannerStatus}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cost Price & Sale Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Preço de Custo (MT) *</label>
                  <input
                    type="number"
                    name="costPrice"
                    value={formData.costPrice || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex justify-between">
                    <span>Preço de Venda (MT) *</span>
                    {formData.salePrice > formData.costPrice && (
                      <span className="text-[9px] text-emerald-600 font-extrabold pb-0.5 normal-case">
                        Markup +{(( (formData.salePrice - formData.costPrice) / formData.salePrice ) * 100).toFixed(0)}%
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice || ''}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* Quantity Stock & Min Alert Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estoque Inicial (Itens) *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Limite de Alerta Mínimo *</label>
                  <input
                    type="number"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-slate-50"
                  />
                </div>
              </div>

              {/* Cancel or Save triggers */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 border border-slate-205 text-slate-500 rounded-xl cursor-pointer transition-colors duration-150"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md shadow-orange-600/10 cursor-pointer transition-colors duration-200"
                >
                  {editingProduct ? 'Salvar Edição' : 'Adicionar ao Estoque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adicionar Stock Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white p-5 sm:p-7 my-auto rounded-2xl w-full max-w-lg border border-slate-200 shadow-2xl relative overflow-y-auto max-h-[92vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            <button
              onClick={() => setIsStockModalOpen(false)}
              className="absolute right-5 top-5 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4 shrink-0">
              <Package className="w-5 h-5 text-emerald-650" />
              Acrescentar Stock / Repor Produto
            </h3>

            {/* Select product section */}
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {!stockSelectedProduct ? (
                <div className="space-y-3 p-0.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pesquise o produto para abastecer</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Pesquisar por nome ou SKU..."
                        value={stockSearchQuery}
                        onChange={(e) => setStockSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Filtered list inside modal */}
                  <div className="space-y-1.5 max-h-[220px] overflow-y-auto border border-slate-100 rounded-xl p-1 bg-slate-50/50">
                    {(() => {
                      const query = stockSearchQuery.toLowerCase();
                      const matched = products.filter(
                        (p) =>
                          p.name.toLowerCase().includes(query) ||
                          p.code.toLowerCase().includes(query)
                      );
                      
                      if (matched.length === 0) {
                        return (
                          <div className="text-center py-6 text-slate-400 text-xs">
                            Nenhum produto cadastrado encontrado.
                          </div>
                        );
                      }

                      return matched.map((p) => {
                        const isOut = p.quantity === 0;
                        const isLow = p.quantity <= p.minStock && p.quantity > 0;
                        
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setStockSelectedProduct(p);
                              setStockAddQty(p.quantity === 0 ? 10 : 1);
                            }}
                            className="w-full text-left p-2.5 hover:bg-emerald-50 rounded-lg flex items-center justify-between border border-transparent hover:border-emerald-100 transition-all duration-150 cursor-pointer group"
                          >
                            <div className="pr-2">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{p.name}</p>
                              <p className="text-[9.5px] text-slate-400 font-mono mt-0.5">SKU: {p.code} • {p.category}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isOut ? (
                                <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                                  ZERADO (0)
                                </span>
                              ) : isLow ? (
                                <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                  CRÍTICO ({p.quantity})
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-600 border border-slate-205 text-[9px] font-semibold px-1.5 py-0.5 rounded-md font-mono">
                                  {p.quantity} un
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Suggest Quick replenishment for low/zero items */}
                  {(() => {
                    const lowStockItems = products.filter(p => p.quantity <= p.minStock);
                    if (lowStockItems.length > 0) {
                      return (
                        <div className="pt-2 border-t border-slate-100 mt-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Produtos necessitando de reposição rápida</p>
                          <div className="flex flex-wrap gap-1.5">
                            {lowStockItems.slice(0, 4).map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setStockSelectedProduct(p);
                                  setStockAddQty(p.quantity === 0 ? 15 : 10);
                                }}
                                className="text-[9.5px] font-bold px-2.5 py-1.5 bg-rose-50/50 hover:bg-rose-50 border border-rose-150/50 text-rose-700 rounded-lg cursor-pointer transition-colors flex items-center gap-1 hover:border-rose-300"
                              >
                                <span>{p.name}</span>
                                <span className="font-mono text-[8px] bg-rose-200/50 px-1 py-0.2 rounded-sm text-rose-800">{p.quantity}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <form onSubmit={handleAddStockSubmit} className="space-y-4">
                  {/* Selected Product Card representation */}
                  <div className="p-3.5 bg-emerald-50/45 border border-emerald-150/40 rounded-xl relative flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-bold tracking-widest text-emerald-700 uppercase bg-emerald-100/60 px-1.5 py-0.5 rounded-sm">Produto Selecionado</span>
                      <h4 className="text-xs font-black text-slate-800 mt-1.5">{stockSelectedProduct.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {stockSelectedProduct.code} • {stockSelectedProduct.category}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStockSelectedProduct(null)}
                      className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Alterar
                    </button>
                  </div>

                  {/* Quick stats preview */}
                  <div className="grid grid-cols-2 gap-3 pb-1">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Stock Atual</span>
                      <p className="text-sm font-bold font-mono text-slate-700 mt-0.5">{stockSelectedProduct.quantity} un</p>
                    </div>
                    <div className="p-3 bg-emerald-50/30 border border-emerald-110/50 rounded-xl">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Novo Stock Estimado</span>
                      <p className="text-sm font-extrabold font-mono text-emerald-650 mt-0.5">
                        {stockSelectedProduct.quantity + (stockAddQty || 0)} un
                      </p>
                    </div>
                  </div>

                  {/* Quantity fields picker */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quantidade a Acrescentar (Unidades)</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStockAddQty(prev => Math.max(1, prev - 5))}
                        className="w-10 h-10 border border-slate-205 hover:bg-slate-50 text-slate-600 text-sm font-extrabold rounded-xl flex items-center justify-center cursor-pointer select-none active:scale-[0.96]"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockAddQty(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 border border-slate-205 hover:bg-slate-50 text-slate-600 text-sm font-extrabold rounded-xl flex items-center justify-center cursor-pointer select-none active:scale-[0.96]"
                      >
                        -1
                      </button>
                      <input
                        type="number"
                        min="1"
                        required
                        value={stockAddQty}
                        onChange={(e) => setStockAddQty(parseInt(e.target.value) || 1)}
                        className="flex-1 h-10 text-center font-bold text-base font-mono border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setStockAddQty(prev => prev + 1)}
                        className="w-10 h-10 border border-slate-205 hover:bg-slate-50 text-slate-600 text-sm font-extrabold rounded-xl flex items-center justify-center cursor-pointer select-none active:scale-[0.96]"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockAddQty(prev => prev + 5)}
                        className="w-10 h-10 border border-slate-205 hover:bg-slate-50 text-slate-600 text-sm font-extrabold rounded-xl flex items-center justify-center cursor-pointer select-none active:scale-[0.96]"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Stock Addition Reason (Motivo) */}
                  <div className="space-y-1.5 focus-within:text-emerald-600 transition-colors">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Motivo da Reposição / Ajuste *</label>
                    <input
                      type="text"
                      placeholder="Ex: Abastecimento regular do fornecedor, devolução, etc."
                      value={stockAddReason}
                      onChange={(e) => setStockAddReason(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 border border-slate-205 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl outline-none placeholder:text-slate-450 bg-slate-50/50"
                    />
                  </div>

                  {/* Submission and option actions */}
                  <div className="pt-5 mt-4 border-t border-slate-100 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setStockSelectedProduct(null)}
                      className="px-4 py-2 hover:bg-slate-100 border border-slate-205 text-slate-500 rounded-xl cursor-pointer transition-colors duration-150"
                    >
                      Voltar ao catálogo
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/10 cursor-pointer transition-colors duration-200 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Repor / Injetar Stock
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Excel Batch Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto" id="pos-excel-import-modal-backdrop">
          <div className="bg-white p-5 sm:p-7 my-auto rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl relative overflow-y-auto max-h-[92vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 flex flex-col" id="pos-excel-import-modal-content">
            {/* Close button */}
            <button
              onClick={() => {
                setIsImportModalOpen(false);
                setParsedProducts([]);
                setImportFileName(null);
                setImportError(null);
              }}
              className="absolute right-5 top-5 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Cadastrar Grupo de Produtos via Excel (.xlsx / .xls)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Introduza produtos em massa no sistema com actualização automática de estoque para os códigos existentes.
              </p>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* Instructions and Download Template Row */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">Precisa do modelo de formatação?</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Baixe o nosso modelo Excel contendo as colunas corretas para que o sistema reconheça os produtos perfeitamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shrink-0 text-[11px] transition-colors self-start sm:self-auto"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Descarregar Modelo
                </button>
              </div>

              {/* Drag n drop Dropzone */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleExcelUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50/40' 
                    : 'border-slate-200 hover:border-slate-350 bg-slate-50/30 hover:bg-slate-50/80'
                }`}
                onClick={() => document.getElementById('excel-file-selector')?.click()}
              >
                <input
                  type="file"
                  id="excel-file-selector"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleExcelUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  {importFileName ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">Ficheiro selecionado:</p>
                      <p className="text-[11px] font-mono font-bold text-emerald-700">{importFileName}</p>
                      <p className="text-[10px] text-slate-400">Clique ou arraste outro ficheiro para substituir</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700">Arraste o ficheiro Excel ou clique para selecionar</p>
                      <p className="text-[11px] text-slate-400">Suporta arquivos .xlsx, .xls e .csv (Planilha de Inventário)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Alert Display */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in slide-in-from-top-2 duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <span className="font-bold">Erro de Validação:</span> {importError}
                  </div>
                </div>
              )}

              {/* Preview block of parsed records */}
              {parsedProducts.length > 0 && (
                <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Pré-visualização do Ficheiro ({parsedProducts.length} itens detectados)</span>
                    <span className="text-[10px] text-slate-400 font-medium">Os primeiros 6 registos:</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 max-h-[220px] overflow-y-auto w-full">
                    <table className="w-full text-left border-collapse text-[10.5px]">
                      <thead>
                        <tr className="bg-slate-100/80 text-[9.5px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                          <th className="py-2.5 px-3">Código</th>
                          <th className="py-2.5 px-3">Produto</th>
                          <th className="py-2.5 px-3">Categoria</th>
                          <th className="py-2.5 px-3 text-right">Qtd</th>
                          <th className="py-2.5 px-3 text-right">Custo / Venda</th>
                          <th className="py-2.5 px-3 text-center">Acção</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-600 font-sans">
                        {parsedProducts.slice(0, 6).map((item, idx) => (
                          <tr key={idx} className={item.status === 'invalido' ? 'bg-rose-50/40 text-rose-800' : 'hover:bg-slate-50/60'}>
                            <td className="py-2 px-3 font-mono font-bold select-all text-slate-500">{item.code || 'Vazio!'}</td>
                            <td className="py-2 px-3 font-bold text-slate-800 truncate max-w-[140px]">{item.name || <span className="text-rose-500 font-black italic">Sem Nome</span>}</td>
                            <td className="py-2 px-3">
                              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase text-[9px] tracking-wider">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">{item.quantity} un</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-500">
                              {item.costPrice} / {item.salePrice}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {item.status === 'novo' ? (
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[8.5px] uppercase border border-emerald-100/50">
                                  + Novo
                                </span>
                              ) : item.status === 'atualizar_stock' ? (
                                <span className="px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-705 font-bold text-[8.5px] uppercase border border-amber-100/50" title="Código de barras já existe no catálogo. Será adicionada quantidade no estoque.">
                                  + Repor
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-black text-[8.5px] uppercase" title={item.errorMsg}>
                                  Erro
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 bg-emerald-50/30 border border-emerald-100/50 rounded-xl text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Novos Cadastro</span>
                      <p className="text-base font-mono font-extrabold text-emerald-700 mt-0.5">
                        {parsedProducts.filter(p => p.status === 'novo').length} item(s)
                      </p>
                    </div>
                    <div className="p-2.5 bg-amber-50/30 border border-amber-100/50 rounded-xl text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Actualizar Stock</span>
                      <p className="text-base font-mono font-extrabold text-amber-705 mt-0.5">
                        {parsedProducts.filter(p => p.status === 'atualizar_stock').length} item(s)
                      </p>
                    </div>
                    <div className="p-2.5 bg-rose-50/20 border border-rose-100/40 rounded-xl text-center">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500">Registo Inválido</span>
                      <p className={`text-base font-mono font-extrabold mt-0.5 ${parsedProducts.filter(p => p.status === 'invalido').length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {parsedProducts.filter(p => p.status === 'invalido').length} item(s)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end gap-2 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedProducts([]);
                  setImportFileName(null);
                  setImportError(null);
                }}
                className="px-4 py-2 hover:bg-slate-100 border border-slate-205 text-slate-500 rounded-xl cursor-pointer transition-colors duration-150"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={parsedProducts.length === 0 || parsedProducts.filter(p => p.status !== 'invalido').length === 0}
                className={`px-5 py-2 rounded-xl font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  parsedProducts.length > 0 && parsedProducts.filter(p => p.status !== 'invalido').length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/10 cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar Importação de ({parsedProducts.filter(p => p.status !== 'invalido').length}) Itens
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal (Clamshell view showing hidden details) */}
      {selectedDetailProduct && (() => {
        // Resolve the real-time state of the product from our master state list
        const p = products.find(prod => prod.id === selectedDetailProduct.id) || selectedDetailProduct;
        const isLow = p.quantity <= p.minStock && p.quantity > 0;
        const isOut = p.quantity === 0;
        const profitPerUnit = p.salePrice - p.costPrice;
        const profitMargin = p.salePrice > 0 ? (profitPerUnit / p.salePrice) * 105 : 0;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white p-5 sm:p-7 my-auto rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl relative overflow-y-auto max-h-[92vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 flex flex-col">
              {/* Close Button */}
              <button
                onClick={() => setSelectedDetailProduct(null)}
                className="absolute right-5 top-5 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title / Header */}
              <div className="mb-4 pr-8">
                <span className="text-[10px] font-extrabold tracking-widest text-indigo-650 uppercase bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-lg">
                  Ficha do Produto
                </span>
                <h3 className="text-sm font-black text-slate-900 mt-2 hover:text-indigo-650 transition-colors leading-snug">
                  {p.name}
                </h3>
                <p className="text-[10.5px] text-slate-400 font-mono mt-1 select-all">
                  SKU: <strong className="text-slate-600 font-bold">{p.code}</strong>
                </p>
              </div>

              {/* Details sections (Cards / Bento style) */}
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Status bar */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isOut ? 'bg-rose-50/55 border-rose-100 text-rose-800' :
                  isLow ? 'bg-amber-50/55 border-amber-100 text-amber-800' :
                  'bg-emerald-50/55 border-emerald-100 text-emerald-800'
                }`}>
                  <span className="text-xs font-bold">Estado do Estoque</span>
                  <span className="text-xs font-extrabold flex items-center gap-1">
                    {isOut ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Esgotado
                      </>
                    ) : isLow ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Crítico ({p.quantity} un)
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Seguro ({p.quantity} un)
                      </>
                    )}
                  </span>
                </div>

                {/* Specific features grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Categoria</span>
                    <p className="text-xs font-extrabold text-slate-700 mt-0.5 truncate">{p.category}</p>
                  </div>
                  
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Alerta de Baixo</span>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">≤ {p.minStock} un</p>
                  </div>
                </div>

                {/* Stock Controls (Quantity) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ajuste Rápido de Estoque</span>
                    <span className="text-xs font-mono font-black text-slate-800 bg-slate-200 px-2 py-0.5 rounded-md">
                      {p.quantity} unidades
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAdjustQuantity(p, -1)}
                      className="flex-1 py-1.5 bg-white text-slate-600 hover:bg-slate-100 border border-slate-205 font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer active:scale-95 select-none transition-colors"
                      type="button"
                    >
                      Diminuir (-1)
                    </button>
                    <button
                      onClick={() => handleAdjustQuantity(p, 1)}
                      className="flex-1 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer active:scale-95 select-none transition-all shadow-xs"
                      type="button"
                    >
                      Aumentar (+1)
                    </button>
                  </div>
                </div>

                {/* Pricing / Markup card */}
                <div className="p-3.5 bg-indigo-50/25 border border-indigo-100/50 rounded-xl space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9.5px] font-bold text-slate-400 block">Preço de Custo</span>
                      <span className="text-xs font-mono font-bold text-slate-600">{formatMZN(p.costPrice)}</span>
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-indigo-500 block">Preço de Venda</span>
                      <span className="text-xs font-mono font-black text-indigo-900">{formatMZN(p.salePrice)}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-indigo-100/40 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold">Lucro Unitário</span>
                    <span className={`font-mono font-black ${profitPerUnit >= 0 ? 'text-emerald-600' : 'text-rose-650'}`}>
                      {formatMZN(profitPerUnit)} ({profitMargin.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* Action buttons (WhatsApp, Edit, Trash) */}
                <div className="pt-3.5 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex gap-2">
                    {/* Send WhatsApp report button if stock is critically low or zero */}
                    {(isOut || isLow) && (
                      <a
                        href={getWhatsappLowStockLink(whatsappNumber, p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 hover:bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.005 5.148 5.117.03 11.432.03c3.058 0 5.932 1.192 8.095 3.358a11.336 11.336 0 0 1 3.357 8.1c-.007 6.284-5.119 11.405-11.43 11.405-1.996-.001-3.957-.521-5.694-1.51L0 24zm6.59-4.846c1.657.983 3.284 1.503 5.14 1.504 5.073 0 9.203-4.113 9.208-9.179.002-2.454-.955-4.761-2.693-6.499C16.565 3.282 14.25 2.32 11.8 2.32c-5.078 0-9.209 4.113-9.213 9.182-.001 1.956.517 3.6 1.493 5.234l-1.012 3.693 3.793-.995zM16.57 14.87c-.27-.135-1.59-.783-1.836-.873-.247-.09-.427-.135-.607.135-.18.27-.697.873-.855 1.053-.157.18-.315.202-.585.067-.27-.135-1.14-.42-2.172-1.341-.803-.715-1.345-1.6-1.503-1.87-.157-.27-.017-.417.118-.552.122-.122.27-.315.405-.472.135-.157.18-.27.27-.45.09-.18.045-.337-.022-.472-.068-.135-.607-1.463-.832-2.003-.22-.526-.44-.455-.607-.463-.157-.008-.337-.01-.517-.01s-.472.067-.72.337c-.247.27-.945.922-.945 2.247s.967 2.599 1.103 2.779c.135.18 1.902 2.904 4.609 4.073.644.279 1.147.445 1.539.57.647.206 1.235.177 1.701.107.518-.077 1.59-.651 1.815-1.281.225-.63.225-1.17.157-1.282-.067-.113-.247-.203-.517-.338z" />
                        </svg>
                        <span>WhatsApp Alerta</span>
                      </a>
                    )}

                    <button
                      onClick={() => {
                        handleOpenEdit(p);
                        setSelectedDetailProduct(null);
                      }}
                      className="flex-1 py-2 px-3 border border-slate-205 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      type="button"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      Editar Produto
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja excluir o produto "${p.name}"?`)) {
                        onDeleteProduct(p.id);
                        setSelectedDetailProduct(null);
                      }
                    }}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 text-[11px] font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    type="button"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    Excluir de Vez do Catálogo
                  </button>
                </div>
              </div>

              {/* Detail Footer */}
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedDetailProduct(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-colors cursor-pointer"
                  type="button"
                >
                  Fechar Ficha
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
