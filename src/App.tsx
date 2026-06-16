/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { Product, Sale, CartItem, PaymentMethod, StoreConfig, StockMovement, PlatformUser, UserRole, CashierClosure } from './types';
import { INITIAL_PRODUCTS, INITIAL_SALES, CATEGORIES } from './initialData';
import DashboardView from './components/DashboardView';
import InventoryView from './components/InventoryView';
import PosView from './components/PosView';
import SalesHistoryView from './components/SalesHistoryView';
import HomeView from './components/HomeView';
import UserManualModal from './components/UserManualModal';
import StoreConfigModal from './components/StoreConfigModal';
import UserManagementModal from './components/UserManagementModal';
import CashierClosureModal from './components/CashierClosureModal';
import LoginView from './components/LoginView';
import { BUSINESS_TEMPLATES, BusinessTemplate } from './templatesData';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  History, 
  Store, 
  User, 
  HelpCircle,
  BookOpen,
  TrendingDown,
  RefreshCw,
  Home,
  Star,
  Info,
  Menu,
  ChevronDown,
  ChevronUp,
  EyeOff,
  X,
  RotateCcw,
  Lock,
  LogOut
} from 'lucide-react';

const INITIAL_PLATFORM_USERS: PlatformUser[] = [
  { id: 'usr-1', name: 'Mário Silva (Gestor)', role: 'gestor', enabled: true, username: 'mario', password: '123' },
  { id: 'usr-2', name: 'Lucas Guambe (Vendedor)', role: 'vendedor', enabled: true, username: 'lucas', password: '123' },
  { id: 'usr-3', name: 'Sofia Mondlane (Fiel)', role: 'fiel', enabled: true, username: 'sofia', password: '123' },
];

export default function App() {
  // Tab Navigation state
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'estoque' | 'pdv' | 'historico'>('home');
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('mercearia');
  const [isUserManualOpen, setIsUserManualOpen] = useState(false);

  // Users state
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [currentUser, setCurrentUser] = useState<PlatformUser | null>(null);
  const [isUserMgmtOpen, setIsUserMgmtOpen] = useState(false);
  const [closures, setClosures] = useState<CashierClosure[]>([]);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);

  // Core App states preloaded with default mock datasets or browser cache local storage
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  // Centralized Quick adjustment modal states
  const [isQuickAdjustOpen, setIsQuickAdjustOpen] = useState(false);
  const [quickAdjustProduct, setQuickAdjustProduct] = useState<Product | null>(null);
  const [quickAdjustDelta, setQuickAdjustDelta] = useState<number>(0);
  const [quickAdjustReason, setQuickAdjustReason] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('258840000000');
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    name: 'CANTINAMASTER',
    nuit: '302195847',
    contacts: '+258 84 000 0000',
    address: 'Maputo, Moçambique'
  });
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Auto-hide floating dock when any input, textarea, or select has focus (signaling that the user is typing/editing)
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMobileNavExpanded, setIsMobileNavExpanded] = useState(false);

  useEffect(() => {
    const handleFocusChange = () => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toUpperCase();
        const isEditable = activeEl.getAttribute('contenteditable') === 'true';
        const isInputField = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT' || isEditable;
        
        setIsInputFocused(isInputField);
      } else {
        setIsInputFocused(false);
      }
    };

    // Listen to focus changes globally using the capturing phase for universal event intercept
    document.addEventListener('focus', handleFocusChange, true);
    document.addEventListener('blur', handleFocusChange, true);

    return () => {
      document.removeEventListener('focus', handleFocusChange, true);
      document.removeEventListener('blur', handleFocusChange, true);
    };
  }, []);

  // Load from LocalStorage once on startup
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('estoque-produtos-v1');
      const storedSales = localStorage.getItem('estoque-vendas-v1');
      const storedCategories = localStorage.getItem('estoque-categorias-v1');
      const storedTemplateId = localStorage.getItem('estoque-template-id-v1');
      const storedWhatsapp = localStorage.getItem('estoque-whatsapp-v1');

      if (storedTemplateId) {
        setCurrentTemplateId(storedTemplateId);
      }

      if (storedWhatsapp) {
        setWhatsappNumber(storedWhatsapp);
      }

      const storedStoreConfig = localStorage.getItem('estoque-store-config-v2');
      if (storedStoreConfig) {
        setStoreConfig(JSON.parse(storedStoreConfig));
      } else {
        // Automatically open configuration popup for a warm first-time onboarding
        setIsStoreModalOpen(true);
      }

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      } else {
        setProducts(INITIAL_PRODUCTS);
        localStorage.setItem('estoque-produtos-v1', JSON.stringify(INITIAL_PRODUCTS));
      }

      if (storedSales) {
        setSales(JSON.parse(storedSales));
      } else {
        setSales(INITIAL_SALES);
        localStorage.setItem('estoque-vendas-v1', JSON.stringify(INITIAL_SALES));
      }

      const storedMovements = localStorage.getItem('estoque-movimentos-v1');
      if (storedMovements) {
        setMovements(JSON.parse(storedMovements));
      } else {
        setMovements([]);
      }

      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        setCategories(CATEGORIES);
        localStorage.setItem('estoque-categorias-v1', JSON.stringify(CATEGORIES));
      }

      // Restore closures
      const storedClosures = localStorage.getItem('estoque-fechos-v1');
      if (storedClosures) {
        setClosures(JSON.parse(storedClosures));
      } else {
        setClosures([]);
      }

      // Restore platform users
      const storedUsers = localStorage.getItem('estoque-usuarios-v1');
      let currentUsersLocal: PlatformUser[] = [];
      if (storedUsers) {
        currentUsersLocal = JSON.parse(storedUsers);
        // Migrate/Merge initial demo user credentials if they are missing or outdated in localStorage
        currentUsersLocal = currentUsersLocal.map(u => {
          const matchInitial = INITIAL_PLATFORM_USERS.find(initial => initial.id === u.id);
          if (matchInitial) {
            return {
              ...u,
              username: u.username || matchInitial.username,
              password: u.password || matchInitial.password
            };
          }
          return u;
        });
        setUsers(currentUsersLocal);
        localStorage.setItem('estoque-usuarios-v1', JSON.stringify(currentUsersLocal));
      } else {
        currentUsersLocal = INITIAL_PLATFORM_USERS;
        setUsers(INITIAL_PLATFORM_USERS);
        localStorage.setItem('estoque-usuarios-v1', JSON.stringify(INITIAL_PLATFORM_USERS));
      }

      const storedCurrentUser = localStorage.getItem('estoque-currentUser-v1');
      if (storedCurrentUser) {
        const parsed = JSON.parse(storedCurrentUser);
        const activeAndEnabled = currentUsersLocal.find(u => u.id === parsed.id && u.enabled);
        if (activeAndEnabled) {
          setCurrentUser(activeAndEnabled);
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Falha ao restaurar dados do localStorage:', err);
      // Fallback
      setProducts(INITIAL_PRODUCTS);
      setSales(INITIAL_SALES);
      setMovements([]);
      setCategories(CATEGORIES);
      setUsers(INITIAL_PLATFORM_USERS);
      setCurrentUser(null);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Synchronizers that save states when changed
  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('estoque-produtos-v1', JSON.stringify(products));
  }, [products, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('estoque-vendas-v1', JSON.stringify(sales));
  }, [sales, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('estoque-movimentos-v1', JSON.stringify(movements));
  }, [movements, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('estoque-categorias-v1', JSON.stringify(categories));
  }, [categories, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('estoque-whatsapp-v1', whatsappNumber);
  }, [whatsappNumber, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('estoque-store-config-v2', JSON.stringify(storeConfig));
  }, [storeConfig, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('estoque-fechos-v1', JSON.stringify(closures));
  }, [closures, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    localStorage.setItem('estoque-usuarios-v1', JSON.stringify(users));
  }, [users, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    if (currentUser) {
      localStorage.setItem('estoque-currentUser-v1', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('estoque-currentUser-v1');
    }
  }, [currentUser, isInitializing]);

  const handleLogin = (user: PlatformUser) => {
    setCurrentUser(user);
  };

  const handleRegisterStore = (newStore: StoreConfig, adminUser: PlatformUser) => {
    setStoreConfig(newStore);
    setUsers((prevUsers) => {
      const exists = prevUsers.some(u => u.id === adminUser.id);
      if (exists) return prevUsers;
      return [...prevUsers, adminUser];
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Reactive access controller based on current user role
  useEffect(() => {
    if (isInitializing || !currentUser) return;
    if (currentUser.role === 'vendedor') {
      if (activeTab !== 'pdv' && activeTab !== 'historico') {
        setActiveTab('pdv');
      }
    } else if (currentUser.role === 'fiel') {
      if (activeTab !== 'estoque') {
        setActiveTab('estoque');
      }
    }
  }, [currentUser, activeTab, isInitializing]);

  // RESET DATABASE helper (re-seeds initial placeholder facts)
  const handleResetCatalog = () => {
    if (window.confirm('Tem certeza de que deseja resetar o banco de dados? Todo o estoque e vendas customizadas serão limpos e redefinidos com o catálogo de demonstração.')) {
      const activeTemplate = BUSINESS_TEMPLATES.find(t => t.id === currentTemplateId) || BUSINESS_TEMPLATES[0];
      setProducts(activeTemplate.products);
      setSales(activeTemplate.sales);
      setMovements([]);
      setCategories(activeTemplate.categories);
      setActiveTab('home');
    }
  };

  // HANDLER: Apply custom sector template
  const handleSelectTemplate = (template: BusinessTemplate) => {
    setProducts(template.products);
    setSales(template.sales);
    setMovements([]);
    setCategories(template.categories);
    setCurrentTemplateId(template.id);
    localStorage.setItem('estoque-template-id-v1', template.id);
    // Directly update local storage so references are in sync immediately
    localStorage.setItem('estoque-produtos-v1', JSON.stringify(template.products));
    localStorage.setItem('estoque-vendas-v1', JSON.stringify(template.sales));
    localStorage.setItem('estoque-movimentos-v1', JSON.stringify([]));
    localStorage.setItem('estoque-categorias-v1', JSON.stringify(template.categories));
  };

  // HELPER: Log Stock Movement
  const logStockMovement = (
    productId: string,
    productName: string,
    productSku: string,
    type: StockMovement['type'],
    quantity: number,
    prevQuantity: number,
    newQuantity: number,
    reason: string
  ) => {
    const newMovement: StockMovement = {
      id: 'MOV-' + Math.floor(100000 + Math.random() * 900000),
      productId,
      productName,
      productSku,
      type,
      quantity,
      prevQuantity,
      newQuantity,
      reason,
      timestamp: new Date().toISOString()
    };
    setMovements((prev) => [newMovement, ...prev]);
  };

  // HANDLER: Add new Product
  const handleAddProduct = (newProductData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...newProductData,
      id: 'prod-' + Math.floor(100000 + Math.random() * 900000),
    };
    setProducts((prev) => [newProduct, ...prev]);
    logStockMovement(
      newProduct.id,
      newProduct.name,
      newProduct.code,
      'cadastro',
      newProduct.quantity,
      0,
      newProduct.quantity,
      'Cadastro inicial do produto no catálogo'
    );
  };

  // HANDLER: Add batch of products (Excel Import)
  const handleAddProductsBatch = (newProductsList: Omit<Product, 'id'>[]) => {
    const preparedProducts: Product[] = newProductsList.map((p) => ({
      ...p,
      id: 'prod-' + Math.floor(100000 + Math.random() * 900000),
    }));
    setProducts((prev) => [...preparedProducts, ...prev]);

    const newMovements: StockMovement[] = preparedProducts.map((newProduct) => ({
      id: 'mov-' + Math.floor(100000 + Math.random() * 900000),
      productId: newProduct.id,
      productName: newProduct.name,
      productSku: newProduct.code,
      type: 'cadastro',
      quantity: newProduct.quantity,
      prevQuantity: 0,
      newQuantity: newProduct.quantity,
      reason: 'Cadastro em lote via importação Excel',
      timestamp: new Date().toISOString()
    }));
    setMovements((prev) => [...newMovements, ...prev]);
  };

  // HANDLER: Update product (Prices, quantities etc) with custom reasoning support
  const handleUpdateProduct = (updatedProduct: Product, reason?: string) => {
    const prevProduct = products.find((p) => p.id === updatedProduct.id);
    if (prevProduct && prevProduct.quantity !== updatedProduct.quantity) {
      const diff = updatedProduct.quantity - prevProduct.quantity;
      logStockMovement(
        updatedProduct.id,
        updatedProduct.name,
        updatedProduct.code,
        diff > 0 ? 'ajuste_positivo' : 'ajuste_negativo',
        Math.abs(diff),
        prevProduct.quantity,
        updatedProduct.quantity,
        reason || (diff > 0 ? 'Abastecimento manual de stock' : 'Ajuste manual de stock')
      );
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  };

  // HANDLER: Delete Product
  const handleDeleteProduct = (productId: string) => {
    const target = products.find(p => p.id === productId);
    if (target && window.confirm('Excluir este produto apagará sua referência no catálogo de estoque. Continuar?')) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      logStockMovement(
        target.id,
        target.name,
        target.code,
        'saida',
        target.quantity,
        target.quantity,
        0,
        'Produto excluído permanentemente do catálogo de vendas'
      );
    }
  };

  // HANDLER: Trigger Quick Stock Adjust with reason popup
  const triggerQuickAdjust = (product: Product, delta: number) => {
    setQuickAdjustProduct(product);
    setQuickAdjustDelta(delta);
    setQuickAdjustReason('');
    setIsQuickAdjustOpen(true);
  };

  // HANDLER: Quick Add stock quantity from dashboard metric shortcut
  const handleQuickAddStock = (productId: string, count: number) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      triggerQuickAdjust(prod, count);
    }
  };

  // HANDLER: Quick Sale from Dashboard (1-Clique)
  const handleQuickSale = (productId: string, paymentMethod: PaymentMethod = 'dinheiro') => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (product.quantity <= 0) return;

    const saleId = 'VNDA-' + Math.floor(100000 + Math.random() * 900000);

    // 1. Decrement product stock by exactly 1 unit
    setProducts((prevProducts) =>
      prevProducts.map((p) =>
        p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p
      )
    );

    // 2. Log movement
    logStockMovement(
      product.id,
      product.name,
      product.code,
      'venda',
      1,
      product.quantity,
      Math.max(0, product.quantity - 1),
      `Venda rápida (1-Clique) - Cupom #${saleId}`
    );

    // 3. Add single completed sale log
    const subtotal = product.salePrice;
    const total = product.salePrice;
    const profit = Math.max(0, total - product.costPrice);

    const saleItems = [
      {
        productId: product.id,
        name: product.name,
        quantity: 1,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
      },
    ];

    const newSale: Sale = {
      id: saleId,
      timestamp: new Date().toISOString(),
      items: saleItems,
      subtotal,
      discount: 0,
      total,
      profit,
      paymentMethod,
      operatorName: currentUser?.name || 'Sistema',
    };

    setSales((prevSales) => [newSale, ...prevSales]);
  };

  // HANDLER: Add single new Category identifier safely
  const handleAddCategory = (newCat: string) => {
    if (!categories.includes(newCat)) {
      setCategories((prev) => [...prev, newCat]);
    }
  };

  // HANDLER: POS Checkout Completion Sales Registry
  const handleCompleteSale = (
    cartItems: CartItem[],
    discountValue: number,
    paymentMethod: PaymentMethod,
    amountPaid?: number,
    customerName?: string,
    customerNuit?: string,
    customerAddress?: string
  ) => {
    const saleId = 'VNDA-' + Math.floor(100000 + Math.random() * 900000);

    // 1. Double check actual stock levels and subtract quantities
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const itemSold = cartItems.find((item) => item.product.id === p.id);
        if (itemSold) {
          return {
            ...p,
            quantity: Math.max(0, p.quantity - itemSold.quantity),
          };
        }
        return p;
      })
    );

    // 2. Log stock movements for each item sold in POS
    cartItems.forEach((item) => {
      const p = products.find((prod) => prod.id === item.product.id);
      if (p) {
        logStockMovement(
          p.id,
          p.name,
          p.code,
          'venda',
          item.quantity,
          p.quantity,
          Math.max(0, p.quantity - item.quantity),
          `Venda no PDV - Cupom #${saleId}`
        );
      }
    });

    // 3. Structuring new Sale Transaction
    const subtotal = cartItems.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
    const baseAmount = Math.max(0, subtotal - discountValue);
    const ivaAmount = baseAmount * 0.16;
    const total = baseAmount + ivaAmount;

    // Compute net profit margins: (Sale price - cost price) * items bought - proportional share of discount (without IVA)
    const totalCostOfLineItems = cartItems.reduce(
      (sum, item) => sum + item.product.costPrice * item.quantity,
      0
    );
    const profit = Math.max(0, baseAmount - totalCostOfLineItems);

    const saleItems = cartItems.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      costPrice: item.product.costPrice,
      salePrice: item.product.salePrice,
    }));

    const newSale: Sale = {
      id: saleId,
      timestamp: new Date().toISOString(),
      items: saleItems,
      subtotal,
      discount: discountValue,
      iva: ivaAmount,
      total,
      profit,
      paymentMethod,
      amountPaid,
      change: amountPaid && amountPaid > total ? amountPaid - total : undefined,
      customerName,
      customerNuit,
      customerAddress,
      operatorName: currentUser?.name || 'Sistema',
    };

    setSales((prevSales) => [newSale, ...prevSales]);
  };

  // HANDLER: ROLLBACK/STORNAR sale from history
  const handleRollbackSale = (saleId: string) => {
    const saleToRollback = sales.find((s) => s.id === saleId);
    if (!saleToRollback) return;

    // 1. Return items sold back to product quantities stock
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const lineItemReturned = saleToRollback.items.find((item) => item.productId === p.id);
        if (lineItemReturned) {
          return {
            ...p,
            quantity: p.quantity + lineItemReturned.quantity,
          };
        }
        return p;
      })
    );

    // 2. Log movements:
    saleToRollback.items.forEach((item) => {
      const p = products.find((prod) => prod.id === item.productId);
      if (p) {
        logStockMovement(
          p.id,
          p.name,
          p.code,
          'estorno',
          item.quantity,
          p.quantity,
          p.quantity + item.quantity,
          `Estorno / Devolução de Cupom #${saleToRollback.id}`
        );
      }
    });

    // 3. Remove transaction from historical log State
    setSales((prevSales) => prevSales.filter((s) => s.id !== saleId));
  };

  const handleSaveClosure = (newClosure: CashierClosure) => {
    setClosures((prev) => [newClosure, ...prev]);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-4 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-orange-500/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="text-center space-y-4 relative z-10">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono tracking-widest text-slate-450 uppercase animate-pulse">Carregando Canteen Master...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        users={users}
        onLogin={handleLogin}
        onRegisterStore={handleRegisterStore}
        storeConfig={storeConfig}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="main-application-frame">
      
      {/* RIGHT Panel: Header top bar + Main Canvas scroll area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        
        {/* Sleek Top Header Navigation Bar with Integrated Brand Header - Optimized for Mobile */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-45 px-4 py-3 sm:px-8 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex items-center justify-center shrink-0 overflow-hidden" id="cantina-master-stock-sales-logo">
              {/* Mozambican colored abstract radial background (warm sunburst representing Mozambique's prosperity and trade) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800"></div>
              
              {/* Capulana-inspired geometric corner dots in Mozambique colors (Green, Yellow, Red, White) */}
              <div className="absolute top-1 left-1.5 w-1 h-1 rounded-full bg-[#009739]" title="Frequência comercial"></div>
              <div className="absolute top-1.5 left-1 w-1 h-1 rounded-full bg-[#FFD100]" title="Riqueza mineral"></div>
              <div className="absolute bottom-1 right-1.5 w-1 h-1 rounded-full bg-[#D81E05]" title="Força local"></div>
              <div className="absolute bottom-1.5 right-1 w-1 h-1 rounded-full bg-white" title="Paz e estabilidade"></div>
              
              {/* Main Core Symbols representing Stock (Package/Box) and Sales (TrendingUp Arrow) */}
              <div className="relative z-10 flex items-center justify-center">
                {/* Sleek golden-yellow neon-dashed circle depicting stock rotation and dynamic market cycles */}
                <div className="absolute w-6 h-6 sm:w-7 sm:h-7 border border-dashed border-[#FFD100]/25 rounded-full animate-pulse"></div>
                
                {/* The Stock Box (Package) */}
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-slate-100 relative z-10 stroke-[2]" />
                
                {/* Floating Mozambican-red & green sales tracker arrow swooping upward */}
                <div className="absolute -top-2 -right-2 bg-[#009739] text-white p-0.5 rounded-md shadow-md border border-[#FFD100]/40 flex items-center justify-center scale-75 sm:scale-90 z-20">
                  <TrendingUp className="w-3 text-white stroke-[3.5]" />
                </div>
              </div>
              
              {/* Fine artistic decorative Mozambique color trim on the left edge */}
              <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-gradient-to-b from-[#D81E05] via-[#FFD100] to-[#009739] rounded-r-lg"></div>
            </div>
            <div className="hidden min-[450px]:flex flex-col justify-center leading-tight">
              <span className="text-xs sm:text-sm font-black tracking-tight text-orange-600 uppercase">My Sales</span>
              <span className="text-[9px] sm:text-[11px] font-extrabold tracking-wider text-emerald-600 uppercase">& Stocks</span>
            </div>
          </div>

          {/* Profile and Manual Buttons in the Top-Right Corner */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Establishment Profile Avatar Button */}
            <button
              onClick={() => setIsStoreModalOpen(true)}
              className="flex items-center gap-1.5 group p-1 sm:p-1.5 sm:pr-3.5 hover:bg-orange-50/50 rounded-full transition-all duration-200 cursor-pointer text-left border border-slate-100 hover:border-orange-200/50 bg-white shadow-xs"
              id="store-profile-header-button"
              title="Perfil do Estabelecimento (Dados para Fatura)"
            >
              <div className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-black text-[10px] sm:text-[11px] shadow-sm shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200 uppercase shrink-0">
                {storeConfig.name ? storeConfig.name.substring(0, 2) : 'CM'}
                <span className="absolute bottom-0.5 right-0.5 block h-2 w-2 rounded-full ring-2 ring-white bg-emerald-500" />
              </div>
              <div className="hidden sm:flex flex-col min-w-[70px]">
                <span className="text-[10px] font-black text-slate-800 uppercase leading-none tracking-tight truncate max-w-[120px]">
                  {storeConfig.name || 'Minha Loja'}
                </span>
                <span className="text-[8px] font-black text-orange-600 uppercase mt-0.5 tracking-wider leading-none">
                  NUIT: {storeConfig.nuit || '---'}
                </span>
              </div>
            </button>
 
            {/* Operator / User levels switch button */}
            {currentUser && (
               <button
                 onClick={() => setIsUserMgmtOpen(true)}
                 className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-2.5 text-slate-705 hover:text-orange-700 hover:border-orange-200/60 bg-slate-50 hover:bg-orange-50/40 border border-slate-200 rounded-xl cursor-pointer transition-all duration-200 font-bold text-xs group shrink-0"
                 id="user-management-header-button"
                 title="Gestão de Operadores e Níveis de Acesso"
               >
                 <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] sm:text-[11px] font-black group-hover:bg-orange-600 transition-colors uppercase shrink-0">
                   {currentUser.name.substring(0, 1)}
                 </div>
                 <div className="hidden sm:flex flex-col items-start leading-[1] text-left">
                   <span className="text-[10px] font-black tracking-tight text-slate-850 truncate max-w-[85px]">
                     {currentUser.name.split(' ')[0]}
                   </span>
                   <span className="text-[7.5px] font-mono font-black text-orange-600 tracking-wider uppercase mt-0.5">
                     {currentUser.role === 'gestor' && 'Gestor'}
                     {currentUser.role === 'vendedor' && 'Vendedor'}
                     {currentUser.role === 'fiel' && 'Fiel'}
                   </span>
                 </div>
                 <ChevronDown className="w-3.5 h-3.5 text-slate-405 group-hover:text-orange-500 transition-colors shrink-0" />
               </button>
            )}



            <button
              onClick={() => setIsUserManualOpen(true)}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2.5 text-slate-600 hover:text-emerald-600 hover:border-emerald-200/60 bg-slate-50 hover:bg-emerald-50/50 border border-slate-205 rounded-xl cursor-pointer transition-all duration-200 font-bold text-xs group shrink-0"
              id="user-manual-header-button"
              title="Abrir Manual de Instruções do Usuário"
            >
              <BookOpen className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              <span className="hidden sm:inline">Manual do Usuário</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2.5 text-rose-650 hover:text-white hover:bg-rose-600 hover:border-rose-600 bg-rose-50/40 border border-rose-200 rounded-xl cursor-pointer transition-all duration-200 font-bold text-xs group shrink-0 shadow-xs"
              id="logout-header-button"
              title="Terminar Sessão de Operador"
            >
              <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-rose-500 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Content canvas container */}
        <main className="flex-1 p-8 pb-32 min-w-0" id="main-content-canvas">
          {isInitializing ? (
            <div className="py-24 text-center text-slate-400">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm font-semibold">Carregando estoque e configurações de caixa...</p>
            </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeView
                  products={products}
                  currentTemplateId={currentTemplateId}
                  onSelectTemplate={handleSelectTemplate}
                  onNavigateToTab={setActiveTab}
                  storeConfig={storeConfig}
                  onOpenStoreConfig={() => setIsStoreModalOpen(true)}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardView
                  products={products}
                  sales={sales}
                  onNavigateToTab={setActiveTab}
                  onQuickAddStock={handleQuickAddStock}
                  onQuickSale={handleQuickSale}
                  whatsappNumber={whatsappNumber}
                  onUpdateWhatsappNumber={setWhatsappNumber}
                />
              )}

              {activeTab === 'estoque' && (
                <InventoryView
                  products={products}
                  categories={categories}
                  onAddProduct={handleAddProduct}
                  onAddProductsBatch={handleAddProductsBatch}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onAddCategory={handleAddCategory}
                  whatsappNumber={whatsappNumber}
                  onUpdateWhatsappNumber={setWhatsappNumber}
                  movements={movements}
                  onQuickAdjust={triggerQuickAdjust}
                />
              )}

              {activeTab === 'pdv' && (
                <PosView
                  products={products}
                  categories={categories}
                  onCompleteSale={handleCompleteSale}
                  storeConfig={storeConfig}
                  currentUser={currentUser}
                  onOpenClosureModal={() => setIsClosureModalOpen(true)}
                />
              )}

              {activeTab === 'historico' && (
                <SalesHistoryView
                  sales={sales}
                  onRollbackSale={handleRollbackSale}
                  storeConfig={storeConfig}
                  currentUser={currentUser}
                />
              )}
            </>
          )}
        </main>

        {/* Simple elegant client side credit indicator */}
        <footer className="py-6 bg-white border-t border-slate-100 text-center text-xs text-slate-400 font-medium font-sans">
          Gerenciador de Estoque e Vendas Inteligente • Desenvolvido para Comerciantes © {new Date().getFullYear()} • Versão 1.5 PRO
        </footer>
      </div>

      {/* Barra de Menus Flutuante (Floating Navigation Dock) Container with Auto-Hide Transition */}
      <div 
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-350 ease-out ${
          isInputFocused 
            ? 'opacity-0 translate-y-24 pointer-events-none scale-90' 
            : 'opacity-100 translate-y-0 scale-100'
        }`} 
        id="floating-navigation-dock-wrapper"
      >
        {/* DESKTOP VIEW: Always expanded and fully visible */}
        <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-2xl shadow-[0_12px_45px_rgba(15,23,42,0.6)] gap-1 max-w-full hover:border-orange-500/40" id="floating-navigation-dock-desktop">
          {[
            { id: 'home', label: 'Início', icon: Home, visible: currentUser?.role === 'gestor' },
            { id: 'dashboard', label: 'Painel', icon: TrendingUp, visible: currentUser?.role === 'gestor' },
            { id: 'estoque', label: 'Estoque', icon: Package, visible: currentUser?.role === 'gestor' || currentUser?.role === 'fiel' },
            { id: 'pdv', label: 'Vender', icon: ShoppingCart, visible: currentUser?.role === 'gestor' || currentUser?.role === 'vendedor' },
            { id: 'historico', label: 'Vendas', icon: History, visible: currentUser?.role === 'gestor' || currentUser?.role === 'vendedor' }
          ].filter(item => item.visible).map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`relative px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl transition-all duration-200 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 cursor-pointer select-none group focus:outline-none ${
                  isActive
                    ? 'bg-orange-600 text-white font-extrabold scale-[1.03] border border-orange-500 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-115 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider block">
                  {item.label}
                </span>
                
                {/* Tooltip readable on hover */}
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-slate-100 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-xl whitespace-nowrap z-55">
                  {item.label}
                </div>

                {/* Active dot indicator with glow */}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 transition-all" />
                )}
              </button>
            );
          })}
        </div>

        {/* MOBILE VIEW: Collapsible and non-disruptive */}
        <div className="flex sm:hidden items-center justify-center" id="floating-navigation-dock-mobile">
          {!isMobileNavExpanded ? (
            /* Collapsed State on Mobile: A clean, minimal indicator button */
            <button
              onClick={() => setIsMobileNavExpanded(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-full shadow-[0_12px_40px_rgba(15,23,42,0.65)] hover:border-orange-500/40 cursor-pointer active:scale-95 transition-all duration-200 group"
              title="Expandir Menu de Navegação"
            >
              <div className="relative w-6 h-6 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm shadow-orange-500/10">
                {activeTab === 'home' && <Home className="w-3.5 h-3.5 stroke-[2.5]" />}
                {activeTab === 'dashboard' && <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />}
                {activeTab === 'estoque' && <Package className="w-3.5 h-3.5 stroke-[2.5]" />}
                {activeTab === 'pdv' && <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />}
                {activeTab === 'historico' && <History className="w-3.5 h-3.5 stroke-[2.5]" />}
                {/* Glowing live dot */}
                <span className="absolute -top-0.5 -right-0.5 block h-2 w-2 rounded-full ring-1 ring-slate-900 bg-emerald-400 animate-pulse" />
              </div>
              <span className="text-[10px] font-black uppercase text-slate-200 tracking-wider pl-0.5 pr-0.5">
                {activeTab === 'home' && 'Início'}
                {activeTab === 'dashboard' && 'Painel'}
                {activeTab === 'estoque' && 'Estoque'}
                {activeTab === 'pdv' && 'Vender'}
                {activeTab === 'historico' && 'Vendas'}
              </span>
              <div className="w-5 h-5 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                <Menu className="w-3.5 h-3.5" />
              </div>
            </button>
          ) : (
            /* Expanded State on Mobile: Shows tab buttons and offers a manual close action */
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-2xl shadow-[0_12px_45px_rgba(15,23,42,0.7)] gap-1 max-w-[95vw] animate-in slide-in-from-bottom-2 duration-200">
                {[
                  { id: 'home', label: 'Início', icon: Home, visible: currentUser?.role === 'gestor' },
                  { id: 'dashboard', label: 'Painel', icon: TrendingUp, visible: currentUser?.role === 'gestor' },
                  { id: 'estoque', label: 'Estoque', icon: Package, visible: currentUser?.role === 'gestor' || currentUser?.role === 'fiel' },
                  { id: 'pdv', label: 'Vender', icon: ShoppingCart, visible: currentUser?.role === 'gestor' || currentUser?.role === 'vendedor' },
                  { id: 'historico', label: 'Vendas', icon: History, visible: currentUser?.role === 'gestor' || currentUser?.role === 'vendedor' }
                ].filter(item => item.visible).map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsMobileNavExpanded(false); // Auto collapse on select to avoid blocking activity
                      }}
                      className={`relative px-2.5 py-1.5 rounded-xl transition-all duration-200 flex flex-col items-center gap-0.5 cursor-pointer select-none group focus:outline-none min-w-[54px] ${
                        isActive
                          ? 'bg-orange-600 text-white font-extrabold border border-orange-500 shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-450'}`} />
                      <span className="text-[8px] font-black uppercase tracking-wider block">
                        {item.label}
                      </span>
                    </button>
                  );
                })}

                {/* Explicit manual collapse button inside the mobile drawer */}
                <button
                  onClick={() => setIsMobileNavExpanded(false)}
                  className="p-1.5 px-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 transition-all border border-slate-800 flex flex-col items-center justify-center cursor-pointer ml-1"
                  title="Ocultar Menu"
                >
                  <EyeOff className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-[7px] font-black uppercase tracking-wider text-slate-400 mt-0.5">Fechar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Manual Overlay Modal */}
      <UserManualModal isOpen={isUserManualOpen} onClose={() => setIsUserManualOpen(false)} />

      {/* Store Configuration Modal */}
      <StoreConfigModal 
        isOpen={isStoreModalOpen} 
        onClose={() => setIsStoreModalOpen(false)} 
        config={storeConfig} 
        onSave={setStoreConfig} 
      />

      {/* User Levels Management Overlay Modal */}
      {currentUser && (
        <UserManagementModal 
          isOpen={isUserMgmtOpen} 
          onClose={() => setIsUserMgmtOpen(false)} 
          users={users} 
          currentUser={currentUser} 
          onUpdateUsers={setUsers} 
          onSwitchUser={(u) => {
            setCurrentUser(u);
          }} 
        />
      )}

      {/* Centralized Quick Stock Adjustment Modal with Required Motivo */}
      {isQuickAdjustOpen && quickAdjustProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center px-4 py-3.5 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-1 px-1.5 bg-slate-200 text-slate-750 text-[9px] font-mono tracking-wider uppercase font-black rounded-md">AJUSTE</span>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">Motivo de Ajuste</h3>
              </div>
              <button 
                onClick={() => setIsQuickAdjustOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-105 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Produto</span>
                <p className="text-xs font-black text-slate-800 leading-tight">{quickAdjustProduct.name}</p>
                <p className="text-[10px] font-mono text-slate-500 uppercase">CÓDIGO: {quickAdjustProduct.code}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center text-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Stock Anterior</span>
                  <span className="text-base font-mono font-black text-slate-700 mt-1">{quickAdjustProduct.quantity} un</span>
                </div>
                <div className="p-3 bg-orange-50/30 border border-orange-100 rounded-xl flex flex-col justify-center text-center">
                  <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider block">Diferença</span>
                  <span className={`text-base font-mono font-black mt-1 ${quickAdjustDelta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {quickAdjustDelta > 0 ? `+${quickAdjustDelta}` : quickAdjustDelta} un
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Novo Stock total:</span>
                <span className="text-sm font-mono font-black bg-white/10 px-2 rounded-md text-orange-450">
                  {Math.max(0, quickAdjustProduct.quantity + quickAdjustDelta)} un
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
                  Descreva o Motivo <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  placeholder="Por que está a alterar este stock rápido? (Ex: Produto quebrado, ajuste anual, etc...)"
                  rows={2}
                  value={quickAdjustReason}
                  onChange={(e) => setQuickAdjustReason(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl resize-none text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>

              {/* Suggestions */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Motivos Comuns:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Ajuste Físico",
                    "Produto Danificado",
                    "Validade Expirada",
                    "Reposição",
                    "Consumo Próprio"
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setQuickAdjustReason(sug)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-medium rounded-full text-[10px] cursor-pointer transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setIsQuickAdjustOpen(false)}
                className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-200 text-xs cursor-pointer"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!quickAdjustReason.trim()) {
                    alert('Por favor, informe o motivo para continuar.');
                    return;
                  }
                  const updatedQty = Math.max(0, quickAdjustProduct.quantity + quickAdjustDelta);
                  const updatedProduct: Product = {
                    ...quickAdjustProduct,
                    quantity: updatedQty
                  };
                  handleUpdateProduct(updatedProduct, quickAdjustReason.trim());
                  setIsQuickAdjustOpen(false);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                type="button"
              >
                Gravar Novo Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cashier Shift Closure Modal */}
      <CashierClosureModal
        isOpen={isClosureModalOpen}
        onClose={() => setIsClosureModalOpen(false)}
        currentUser={currentUser}
        sales={sales}
        closures={closures}
        onSaveClosure={handleSaveClosure}
        storeConfig={storeConfig}
      />
    </div>
  );
}
