/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product, StoreConfig } from '../types';
import { BUSINESS_TEMPLATES, BusinessTemplate } from '../templatesData';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  History, 
  ChevronRight, 
  Layers
} from 'lucide-react';

interface HomeViewProps {
  products: Product[];
  currentTemplateId: string;
  onSelectTemplate: (template: BusinessTemplate) => void;
  onNavigateToTab: (tabId: 'home' | 'dashboard' | 'estoque' | 'pdv' | 'historico') => void;
  storeConfig?: StoreConfig;
  onOpenStoreConfig?: () => void;
}

export default function HomeView({
  products,
  currentTemplateId,
  onSelectTemplate,
  onNavigateToTab,
  storeConfig,
  onOpenStoreConfig,
}: HomeViewProps) {

  return (
    <div className="space-y-6 animate-in fade-in duration-350" id="home-view-canvas">
      
      {/* Top Header - Compact & Elegant */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs gap-4" id="home-title-nav">
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-800 leading-tight">Painel Principal</h1>
          <p className="text-[11px] text-slate-450 mt-1 font-semibold">Consolidação automática de fluxo de caixa e menus de acesso</p>
        </div>
        
        {/* Template Quick Switcher context dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <Layers className="w-3.5 h-3.5 text-orange-600" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Template:</span>
          <select 
            value={currentTemplateId}
            onChange={(e) => {
              const matched = BUSINESS_TEMPLATES.find(t => t.id === e.target.value);
              if (matched) onSelectTemplate(matched);
            }}
            className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer border-none"
          >
            {BUSINESS_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1: MENUS DE ACESSO (Quick Access Navigation Cards) */}
      <div className="space-y-3" id="home-access-menus">
        <h3 className="text-[11px] font-black text-slate-450 uppercase tracking-widest pl-1">Menus do Sistema</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Menu Card 1: Ponto de Venda PDV */}
          <div 
            onClick={() => onNavigateToTab('pdv')}
            className="group bg-white border border-slate-200/80 hover:border-orange-400 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden h-full min-h-[190px]"
          >
            <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-orange-50 to-transparent opacity-60"></div>
            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-all duration-350 shadow-sm border border-orange-100/50 mb-3">
              <ShoppingCart className="w-16 h-16 stroke-[2]" />
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-center gap-1">
              Adicionar Vendas
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h4>
          </div>

          {/* Menu Card 2: Controle de Estoque */}
          <div 
            onClick={() => onNavigateToTab('estoque')}
            className="group bg-white border border-slate-200/80 hover:border-emerald-400 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden h-full min-h-[190px]"
          >
            <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-emerald-50 to-transparent opacity-60"></div>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-350 shadow-sm border border-emerald-100/50 mb-3">
              <Package className="w-16 h-16 stroke-[2]" />
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-center gap-1">
              Controlar Stock
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h4>
          </div>

          {/* Menu Card 3: Estatísticas Gerais */}
          <div 
            onClick={() => onNavigateToTab('dashboard')}
            className="group bg-white border border-slate-200/80 hover:border-emerald-400 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden h-full min-h-[190px]"
          >
            <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-emerald-50 to-transparent opacity-60"></div>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-350 shadow-sm border border-emerald-100/50 mb-3">
              <TrendingUp className="w-16 h-16 stroke-[2]" />
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-center gap-1">
              Painel de Análise
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h4>
          </div>

          {/* Menu Card 4: Histórico de Faturas */}
          <div 
            onClick={() => onNavigateToTab('historico')}
            className="group bg-white border border-slate-200/80 hover:border-orange-400 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden h-full min-h-[190px]"
          >
            <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-orange-50 to-transparent opacity-60"></div>
            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-all duration-350 shadow-sm border border-orange-100/50 mb-3">
              <History className="w-16 h-16 stroke-[2]" />
            </div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-center gap-1">
              Extrato de Faturação
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h4>
          </div>

        </div>
      </div>

    </div>
  );
}
