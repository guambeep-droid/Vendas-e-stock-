import React, { useState } from 'react';
import { 
  Building, 
  User, 
  Lock, 
  Phone, 
  MapPin, 
  LockOpen, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Package,
  HelpCircle,
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react';
import { PlatformUser, StoreConfig } from '../types';

interface LoginViewProps {
  users: PlatformUser[];
  onLogin: (user: PlatformUser) => void;
  onRegisterStore: (store: StoreConfig, adminUser: PlatformUser) => void;
  storeConfig: StoreConfig;
}

export default function LoginView({
  users,
  onLogin,
  onRegisterStore,
  storeConfig
}: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form States (Company + Manager)
  const [companyName, setCompanyName] = useState('');
  const [companyNuit, setCompanyNuit] = useState('');
  const [companyContact, setCompanyContact] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerUsername, setManagerUsername] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [managerConfirmPassword, setManagerConfirmPassword] = useState('');

  // Demonstration support / autofill dropdown
  const [showDemoUsers, setShowDemoUsers] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const user = users.find(
      (u) => 
        (u.username || '').toLowerCase() === loginUsername.trim().toLowerCase() && 
        (u.password || '') === loginPassword
    );

    if (!user) {
      setErrorMsg('Nome de usuário ou senha incorretos. Por favor, tente novamente.');
      return;
    }

    if (!user.enabled) {
      setErrorMsg(`A conta do colaborador "${user.name}" está desabilitada pelo Administrador.`);
      return;
    }

    onLogin(user);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validations
    if (!companyName.trim()) {
      setErrorMsg('Nome da empresa é obrigatório.');
      return;
    }
    if (!companyNuit.trim()) {
      setErrorMsg('NUIT da empresa é obrigatórío.');
      return;
    }
    if (companyNuit.trim().length !== 9) {
      setErrorMsg('O NUIT em Moçambique deve conter exatamente 9 algarismos.');
      return;
    }
    if (!companyContact.trim()) {
      setErrorMsg('Contacto telefónico é obrigatório.');
      return;
    }
    if (!companyAddress.trim()) {
      setErrorMsg('Endereço físico é obrigatório.');
      return;
    }
    if (!managerName.trim()) {
      setErrorMsg('Nome completo do Gestor é obrigatório.');
      return;
    }
    if (!managerUsername.trim()) {
      setErrorMsg('Nome de usuário para login é obrigatório.');
      return;
    }

    // Check if username is already taken
    const usernameExists = users.some(u => (u.username || '').toLowerCase() === managerUsername.trim().toLowerCase());
    if (usernameExists) {
      setErrorMsg('Este nome de usuário já está registado na plataforma. Escolha outro.');
      return;
    }

    if (!managerPassword) {
      setErrorMsg('Defina uma senha robusta de acesso.');
      return;
    }
    if (managerPassword.length < 4) {
      setErrorMsg('A senha deve conter pelo menos 4 caracteres.');
      return;
    }
    if (managerPassword !== managerConfirmPassword) {
      setErrorMsg('As senhas introduzidas não coincidem.');
      return;
    }

    // Store config object
    const newConfig: StoreConfig = {
      name: companyName.trim(),
      nuit: companyNuit.trim(),
      contacts: companyContact.trim(),
      address: companyAddress.trim()
    };

    // Platform user gestor object
    const newAdmin: PlatformUser = {
      id: `usr-${Date.now()}`,
      name: managerName.trim(),
      role: 'gestor',
      enabled: true,
      username: managerUsername.trim().toLowerCase(),
      password: managerPassword
    };

    onRegisterStore(newConfig, newAdmin);
    setSuccessMsg(`Empresa "${companyName}" e Gestor "${managerName}" cadastrados com sucesso! Redirecionando...`);
    
    setTimeout(() => {
      onLogin(newAdmin);
    }, 1500);
  };

  const handleFillDemo = (username: string) => {
    setLoginUsername(username);
    setLoginPassword('123'); // Preset passwords
    setShowDemoUsers(false);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between font-sans text-slate-150 p-4 sm:p-6 relative overflow-hidden" id="auth-portal-screen animate-fade-in">
      {/* Background radial glowing effects representing Mozambican colors */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner Branding Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl shadow-lg flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 rounded-xl"></div>
            <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-gradient-to-b from-[#D81E05] via-[#FFD100] to-[#009739] rounded-r-lg"></div>
            <Package className="w-5 h-5 text-white relative z-10 stroke-[2]" />
            <div className="absolute -top-1.5 -right-1.5 bg-[#009739] text-white p-0.5 rounded-md shadow-md flex items-center justify-center scale-75 z-20">
              <TrendingUp className="w-3 text-white stroke-[3.5]" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase leading-none">CANTEEN MASTER</h1>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-0.5">Gestão de Vendas & Stock</p>
          </div>
        </div>
        <div className="text-right text-[10px] font-mono text-slate-500 hidden sm:block">
          <span>PORTAL DE ACESSO ADIMINISTRATIVO</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-xl bg-slate-950 border border-slate-800/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative">
          
          {/* Form switch tabs */}
          <div className="grid grid-cols-2 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/60">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                activeTab === 'login'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Iniciar Sessão
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                activeTab === 'register'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Registar Empresa
            </button>
          </div>

          {/* Form Header Info text */}
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-black text-white uppercase tracking-tight">
              {activeTab === 'login' ? 'Entrar no Sistema' : 'Registar Nova Empresa'}
            </h2>
            <p className="text-xs text-slate-450">
              {activeTab === 'login' 
                ? 'Insira as credenciais que o seu Administrador/Gestor atribuiu' 
                : 'Cadastre a sua empresa e configure o utilizador Administrador Geral do Ponto de Venda.'}
            </p>
          </div>

          {/* Notifications Panel */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-2xl text-xs flex gap-2.5 items-start">
              <span className="bg-rose-500/20 text-rose-400 w-5 h-5 rounded-lg flex items-center justify-center shrink-0 font-bold">!</span>
              <p className="leading-normal">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-250 rounded-2xl text-xs flex gap-2.5 items-start">
              <span className="bg-emerald-500/20 text-emerald-405 w-5 h-5 rounded-lg flex items-center justify-center shrink-0 font-bold">✓</span>
              <p className="leading-normal">{successMsg}</p>
            </div>
          )}

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Nome de Usuário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Ex: mario"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-2xl p-3 pl-11 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Palavra-passe (Senha)
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Introduza a sua senha"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-2xl p-3 pl-11 pr-10 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg hover:shadow-orange-600/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4 text-[#FFD100]" />
              </button>

              {/* Demo users list expander helper */}
              <div className="pt-2 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowDemoUsers(!showDemoUsers)}
                  className="w-full py-1.5 px-3 bg-slate-900/40 hover:bg-slate-900 hover:text-orange-405 border border-slate-850 rounded-xl text-[10px] text-slate-400 font-bold flex items-center justify-between transition-colors gap-1 uppercase"
                >
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
                    Ajuda: Contas de Demonstração Existentes
                  </span>
                  <span>{showDemoUsers ? 'Ocultar' : 'Expandir'}</span>
                </button>

                {showDemoUsers && (
                  <div className="mt-2 p-3 bg-slate-900/60 border border-slate-850 rounded-2xl text-[10.5px] space-y-2 text-slate-300 leading-tight">
                    <p className="font-extrabold text-[#FFD100] uppercase tracking-wider mb-1">
                      Credenciais configuradas de fábrica:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleFillDemo('mario')}
                        className="p-1 px-2.5 bg-slate-800 hover:bg-orange-950 hover:border-orange-900 border border-slate-700 rounded-lg text-left text-white transition-colors"
                      >
                        <span className="font-bold underline">Mario</span> (Gestor)<br/>
                        <span className="text-slate-400 font-mono">Senha: 123</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillDemo('lucas')}
                        className="p-1 px-2.5 bg-slate-800 hover:bg-orange-950 hover:border-orange-900 border border-slate-700 rounded-lg text-left text-white transition-colors"
                      >
                        <span className="font-bold underline">Lucas</span> (Vendedor)<br/>
                        <span className="text-slate-400 font-mono">Senha: 123</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFillDemo('sofia')}
                        className="p-1 px-2.5 bg-slate-800 hover:bg-orange-950 hover:border-orange-900 border border-slate-700 rounded-lg text-left text-white transition-colors"
                      >
                        <span className="font-bold underline">Sofia</span> (Fiel)<br/>
                        <span className="text-slate-400 font-mono">Senha: 123</span>
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1 italic">
                      Clique no botão correspondente para preencher automaticamente as credenciais em caixa.
                    </p>
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* TAB 2: REGISTER STORE FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
              
              {/* Form heading level: data company */}
              <div className="space-y-3.5 p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <span className="text-[9px] font-black uppercase text-[#FFD100] tracking-widest flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" /> 1. DADOS CADASTRAIS DA EMPRESA
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Nome Comercial / Loja
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Cantina do Povo S.A."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 p-2 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      NUIT da Empresa (Tax ID)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 302195847 (9 algarismos)"
                      value={companyNuit}
                      onChange={(e) => setCompanyNuit(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 p-2 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Contacto Telefónico Geral
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: +258 84 999 9999"
                      value={companyContact}
                      onChange={(e) => setCompanyContact(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 p-2 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Endereço Geral Físico
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Av. Eduardo Mondlane, Maputo"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 p-2 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Form heading level: manager details */}
              <div className="space-y-3.5 p-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                <span className="text-[9px] font-black uppercase text-[#009739] tracking-widest flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" /> 2. DADOS DO GESTOR GERAL / ADMINISTRADOR
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Nome Completo do Gestor / ADM
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mário Silva"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 p-2 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Nome de Usuário (Username)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: mario.silva"
                      value={managerUsername}
                      onChange={(e) => setManagerUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 p-2 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Criar Senha de Acesso
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min. 4 caracteres"
                      value={managerPassword}
                      onChange={(e) => setManagerPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 p-2 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Confirmar Senha de Acesso
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Digite a senha novamente"
                      value={managerConfirmPassword}
                      onChange={(e) => setManagerConfirmPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 p-2 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-655 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg hover:shadow-orange-650/15 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Concluir Registo e Entrar</span>
                <ArrowRight className="w-4 h-4 text-[#FFD100]" />
              </button>
            </form>
          )}

        </div>
      </main>

      {/* Footer copyright */}
      <footer className="max-w-7xl mx-auto w-full pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2 shrink-0">
        <span>© {currentYear} Canteen Master — Sistema de Gestão de Vendas Integrado. Moçambique</span>
        <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600 bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-md">
          <ShieldCheck className="w-3 h-3 text-[#009739]" /> REGULAMENTO COMERCIAL HOMOLOGADO
        </span>
      </footer>
    </div>
  );
}
