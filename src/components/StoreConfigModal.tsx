/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StoreConfig } from '../types';
import { Store, Hash, Phone, MapPin, X, CheckCircle } from 'lucide-react';

interface StoreConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoreConfig;
  onSave: (newConfig: StoreConfig) => void;
}

export default function StoreConfigModal({
  isOpen,
  onClose,
  config,
  onSave,
}: StoreConfigModalProps) {
  const [name, setName] = useState(config.name);
  const [nuit, setNuit] = useState(config.nuit);
  const [contacts, setContacts] = useState(config.contacts);
  const [address, setAddress] = useState(config.address);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync internal state when external config props change
  useEffect(() => {
    setName(config.name);
    setNuit(config.nuit);
    setContacts(config.contacts);
    setAddress(config.address);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || 'CANTINAMASTER',
      nuit: nuit.trim() || 'Sem NUIT',
      contacts: contacts.trim() || 'Sem contacto',
      address: address.trim() || 'Sem endereço',
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs font-sans animate-in fade-in duration-200 overflow-y-auto overflow-x-auto" id="store-config-modal-overlay">
      <div 
        className="relative bg-white w-full max-w-md my-auto rounded-2xl border border-slate-100 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] overflow-y-auto overflow-x-auto max-h-[92vh] sm:max-h-[90vh] animate-in zoom-in-95 duration-200" 
        id="store-config-modal-box"
      >
        {/* Color Highlight Border */}
        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500"></div>

        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Header Description */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Dados do Estabelecimento</h3>
            </div>
            <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">
              Personalize os limites fiscais e identificadores do seu negócio. As informações digitadas aqui aparecerão automaticamente no cabeçalho de todas as faturas impressas ou visualizadas.
            </p>
          </div>

          {saveSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95 duration-300">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                <CheckCircle className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Configuração Gravada!</h4>
                <p className="text-[10px] text-slate-400 font-medium">As faturas e cabeçalhos foram atualizados.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Nome do Estabelecimento */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block flex items-center gap-1">
                  <Store className="w-3 h-3 text-orange-600" />
                  Nome do Estabelecimento / Loja
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mercearia do Bairro Macandza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder-slate-400 bg-slate-50/50"
                />
                <span className="text-[8px] text-slate-400 block font-medium">Nome comercial de destaque no talão</span>
              </div>

              {/* NUIT */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block flex items-center gap-1">
                  <Hash className="w-3 h-3 text-orange-600" />
                  Número de Identificação Fiscal (NUIT/CNPJ)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 302195847"
                  value={nuit}
                  onChange={(e) => setNuit(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder-slate-400 bg-slate-50/50"
                />
                <span className="text-[8px] text-slate-400 block font-medium">Identificador fiscal do negócio</span>
              </div>

              {/* Contactos */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block flex items-center gap-1">
                  <Phone className="w-3 h-3 text-orange-600" />
                  Contactos do Estabelecimento
                </label>
                <input
                  type="text"
                  placeholder="Ex: +258 84 123 4567 ou +258 82 765 4321"
                  value={contacts}
                  onChange={(e) => setContacts(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder-slate-400 bg-slate-50/50"
                />
                <span className="text-[8px] text-slate-400 block font-medium">Telefones exibidos no rodapé ou cabeçalho do recibo</span>
              </div>

              {/* Endereço */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-450 uppercase tracking-widest block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-600" />
                  Endereço do Estabelecimento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Av. Eduardo Mondlane, QD 14 - Maputo"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 placeholder-slate-400 bg-slate-50/50"
                />
                <span className="text-[8px] text-slate-400 block font-medium">Localização física do estabelecimento</span>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-slate-150 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
