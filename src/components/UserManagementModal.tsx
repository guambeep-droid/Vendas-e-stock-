/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlatformUser, UserRole } from '../types';
import { 
  Users, 
  User, 
  Shield, 
  Lock, 
  Unlock, 
  Plus, 
  X, 
  CheckCircle, 
  AlertCircle,
  UserCheck,
  Building,
  Trash2,
  ChevronDown,
  ChevronUp,
  Key
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: PlatformUser[];
  currentUser: PlatformUser;
  onUpdateUsers: (users: PlatformUser[]) => void;
  onSwitchUser: (user: PlatformUser) => void;
}

export default function UserManagementModal({
  isOpen,
  onClose,
  users,
  currentUser,
  onUpdateUsers,
  onSwitchUser,
}: UserManagementModalProps) {
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('vendedor');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States for verification during operator switching
  const [switchingUser, setSwitchingUser] = useState<PlatformUser | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Operator deletion interactive target
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Tracks which operator row or card is opened/expanded for full credentials details
  const [expandedOperatorId, setExpandedOperatorId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newUserName.trim()) {
      setErrorMessage('Por favor, introduza o nome do colaborador.');
      return;
    }

    if (!newUserUsername.trim()) {
      setErrorMessage('Por favor, preencha o nome de usuário para login.');
      return;
    }

    // Check if username is already in use
    const usernameTaken = users.some(u => (u.username || '').toLowerCase() === newUserUsername.trim().toLowerCase());
    if (usernameTaken) {
      setErrorMessage('Este nome de usuário já se encontra em uso. Por favor, digite outro.');
      return;
    }

    if (!newUserPassword) {
      setErrorMessage('Por favor, introduza uma senha para o colaborador.');
      return;
    }

    if (newUserPassword.length < 4) {
      setErrorMessage('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    if (newUserPassword !== newUserConfirmPassword) {
      setErrorMessage('As senhas introduzidas não coincidem.');
      return;
    }

    const newUser: PlatformUser = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      role: newUserRole,
      enabled: true,
      username: newUserUsername.trim().toLowerCase(),
      password: newUserPassword
    };

    const updatedUsers = [...users, newUser];
    onUpdateUsers(updatedUsers);
    
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserConfirmPassword('');
    setNewUserRole('vendedor');
    setSuccessMessage(`Colaborador "${newUser.name}" cadastrado com sucesso!`);
    
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const toggleUserStatus = (userId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (userId === currentUser.id) {
      setErrorMessage('Não é possível desabilitar o próprio usuário que está logado atualmente.');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const nextState = !u.enabled;
        if (nextState) {
          setSuccessMessage(`Acesso reabilitado para "${u.name}".`);
        } else {
          setSuccessMessage(`Acesso bloqueado para "${u.name}".`);
        }
        return { ...u, enabled: nextState };
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleDeleteUser = (userId: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (userId === currentUser.id) {
      setErrorMessage('Não é possível eliminar o próprio usuário que está logado atualmente.');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUsers = users.filter(u => u.id !== userId);
    onUpdateUsers(updatedUsers);
    setDeletingUserId(null);
    setSuccessMessage(`Colaborador "${targetUser.name}" eliminado permanentemente.`);
    
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleSelectUser = (user: PlatformUser) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSwitchError(null);

    if (!user.enabled) {
      setErrorMessage(`O acesso para "${user.name}" está desabilitado pelo Administrador/Gestor.`);
      return;
    }

    if (user.id === currentUser.id) {
      return;
    }

    setSwitchingUser(user);
    setSwitchPassword('');
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setSwitchError(null);

    if (!switchingUser) return;

    // Check credentials password (fallback default '123' for baseline demo profiles)
    const storedPassword = switchingUser.password || '123';
    if (storedPassword === switchPassword) {
      onSwitchUser(switchingUser);
      setSuccessMessage(`Sessão alterada para ${switchingUser.name}!`);
      setSwitchingUser(null);
      setSwitchPassword('');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } else {
      setSwitchError('Senha incorreta para este operador. Tente novamente.');
    }
  };

  // Humanize role labels
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'gestor': return 'Gestor Geral';
      case 'fiel': return 'Fiel de Armazém';
      case 'vendedor': return 'Vendedor (Caixa)';
      default: return role;
    }
  };

  const getRoleBadgeClasses = (role: UserRole) => {
    switch (role) {
      case 'gestor': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'fiel': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'vendedor': return 'bg-blue-50 text-blue-750 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4.5 bg-slate-50 border-b border-slate-150 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-slate-800 tracking-tight">Controle de Operadores & Níveis</h3>
              <p className="text-[10px] md:text-xs text-slate-400 font-medium">Troca de operador e permissões de acesso ao sistema</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 md:w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Notifications area */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5 font-medium animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2.5 font-medium animate-in slide-in-from-top-1">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* SECTION 1: Current Session Info */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-orange-600 text-white flex items-center justify-center font-black text-sm border-2 border-white/20 uppercase shadow-inner">
                {currentUser.name.substring(0, 2)}
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold tracking-wider text-orange-400 uppercase block font-mono">Operador Ativo Atualmente</span>
                <p className="text-sm font-extrabold tracking-tight">{currentUser.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 p-2.5 px-4 rounded-xl text-left md:text-right border border-white/10 w-full md:w-auto">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Permissões de Acesso</span>
              <p className="text-[11px] font-black text-slate-200 mt-0.5">
                {currentUser.role === 'gestor' && '✓ Total: Vendes, Stocks e Configuração'}
                {currentUser.role === 'vendedor' && '✓ Apenas: Frente de Venda (PDV)'}
                {currentUser.role === 'fiel' && '✓ Apenas: Controle de Stocks (Armazém)'}
              </p>
            </div>
          </div>

          {/* SECTION 2: Switch / Sign In visual cards */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              Alternar Operador / Entrar Como:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {users.map((u) => {
                const isActive = u.id === currentUser.id;
                const isBlocked = !u.enabled;
                
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    type="button"
                    className={`p-3 rounded-2xl border text-left transition-all relative flex items-center gap-3 group shrink-0 ${
                      isActive 
                        ? 'bg-orange-50/40 border-orange-400 ring-1 ring-orange-400/40' 
                        : isBlocked
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/30'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isActive 
                        ? 'bg-orange-600 text-white' 
                        : isBlocked
                        ? 'bg-slate-200 text-slate-400'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 pr-8">
                      <p className="text-xs font-black text-slate-850 truncate leading-tight group-hover:text-amber-750">
                        {u.name}
                      </p>
                      <span className={`inline-block border text-[8.5px] font-black mt-1 px-1.5 py-0.5 rounded-md uppercase tracking-wider ${getRoleBadgeClasses(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                    </div>

                    {/* Left corner checkmark or lock representation */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isActive && (
                        <span className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </span>
                      )}
                      {isBlocked && (
                        <Lock className="w-3.5 h-3.5 text-slate-450" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Credentials switcher form */}
            {switchingUser && (
              <form onSubmit={handleConfirmSwitch} className="p-4.5 bg-orange-50/50 border border-orange-300 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-120">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-orange-700 tracking-wider font-mono">
                    Confirmar Senha para {switchingUser.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSwitchingUser(null);
                      setSwitchPassword('');
                      setSwitchError(null);
                    }}
                    className="p-1 text-slate-450 hover:text-slate-650 rounded-lg hover:bg-orange-100/60"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="Introduza a senha deste operador"
                    value={switchPassword}
                    onChange={(e) => setSwitchPassword(e.target.value)}
                    className="flex-1 text-xs p-2.5 bg-white border border-slate-205 focus:border-orange-500 rounded-xl outline-none text-slate-800"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all duration-150 shrink-0 shadow-xs"
                  >
                    Verificar & Aceder
                  </button>
                </div>

                {switchError && (
                  <p className="text-[10px] font-extrabold text-rose-550 font-mono">
                    ⚠️ {switchError}
                  </p>
                )}
                
                <p className="text-[10px] font-mono text-slate-500 leading-none">
                  Dica: Para contas padrão de fábrica (Mário, Lucas, Sofia), insira <span className="font-extrabold underline">123</span>.
                </p>
              </form>
            )}
          </div>

          {/* SECTION 3: Manage Collaborators (Gestor Only) */}
          <div className="border-t border-slate-150 pt-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-orange-600" />
                  Painel de Gestão de Colaboradores
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">Ativação, desativação e cadastramento de senhas/perfis de operadores de estoque e caixa</p>
              </div>
              
              {currentUser.role !== 'gestor' && (
                <span className="text-[9.5px] font-black bg-slate-100 text-slate-550 px-2.5 py-1 rounded-lg border border-slate-200 uppercase tracking-widest font-mono">
                  🔑 BLOQUEADO
                </span>
              )}
            </div>

            {currentUser.role === 'gestor' ? (
              <div className="space-y-4" id="gestor-user-administration">
                {/* User directory container with responsive layouts */}
                <div className="space-y-3">
                  <p className="text-[10px] md:text-xs text-slate-400 font-bold italic">
                    💡 Dica: Clique ou toque em qualquer operador para revelar os detalhes de acesso (utilizador e palavra-passe) e opções avançadas.
                  </p>

                  {/* Desktop version: Wide Table (Visible from screen md onwards) */}
                  <div className="hidden md:block bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden">
                    <div className="max-h-[190px] overflow-y-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">Nome do Colaborador</th>
                            <th className="py-2.5 px-2">Nível de Acesso</th>
                            <th className="py-2.5 px-2 text-center">Status</th>
                            <th className="py-2.5 px-4 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {users.map((u) => (
                            <React.Fragment key={u.id}>
                              <tr 
                                onClick={() => setExpandedOperatorId(expandedOperatorId === u.id ? null : u.id)}
                                className={`hover:bg-slate-100/40 cursor-pointer select-none transition-colors ${expandedOperatorId === u.id ? 'bg-orange-50/10' : ''}`}
                              >
                                <td className="py-2 px-4">
                                  <div className="flex items-center gap-1.5">
                                    {expandedOperatorId === u.id ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    )}
                                    <div>
                                      <span className="font-extrabold text-slate-800 block">{u.name}</span>
                                      <span className="text-[9px] font-mono text-slate-400">ID: {u.id}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2 px-2">
                                  <span className={`inline-block border text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${getRoleBadgeClasses(u.role)}`}>
                                    {getRoleLabel(u.role)}
                                  </span>
                                </td>
                                <td className="py-2 px-2 text-center">
                                  {u.enabled ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-150">
                                      <Unlock className="w-2.5 h-2.5" /> ATIVO
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[9px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-150">
                                      <Lock className="w-2.5 h-2.5" /> BLOQUEADO
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-4 text-right">
                                  {u.id === currentUser.id ? (
                                    <span className="text-[9px] font-mono text-slate-400 italic">Você</span>
                                  ) : (
                                    <div className="flex items-center justify-end gap-1.5 md:gap-2">
                                      {/* Toggle user blocking status */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleUserStatus(u.id);
                                        }}
                                        className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                          u.enabled 
                                            ? 'hover:bg-slate-100 border-slate-200 text-slate-600 bg-white' 
                                            : 'hover:bg-emerald-50 border-emerald-200 text-emerald-650 bg-white'
                                        }`}
                                        title={u.enabled ? 'Bloquear e Desativar' : 'Habilitar Acesso'}
                                      >
                                        {u.enabled ? 'Bloquear' : 'Habilitar'}
                                      </button>

                                      {/* Delete action with interactive dynamic confirmations */}
                                      {deletingUserId === u.id ? (
                                        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-1 duration-150">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteUser(u.id);
                                            }}
                                            className="px-2 py-1 text-[9.5px] bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg cursor-pointer transition-colors"
                                          >
                                            Sim, Eliminar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDeletingUserId(null);
                                            }}
                                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                            title="Cancelar"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingUserId(u.id);
                                          }}
                                          className="p-1 px-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-rose-500 hover:text-rose-650 rounded-lg cursor-pointer transition-all bg-white"
                                          title="Eliminar Colaborador"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                              {expandedOperatorId === u.id && (
                                <tr className="bg-orange-50/20 backdrop-blur-xs">
                                  <td colSpan={4} className="py-2.5 px-4 border-t border-slate-205/65">
                                    <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-xl border border-slate-200 text-[11px] animate-in fade-in slide-in-from-top-1 duration-120">
                                      <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider font-mono">Ficha de Identidade</span>
                                        <p className="font-bold text-slate-700">Nome Completo: <span className="font-medium text-slate-600">{u.name}</span></p>
                                        <p className="font-bold text-slate-700">ID de Cadastro: <span className="font-mono text-slate-500">{u.id}</span></p>
                                        <p className="font-bold text-slate-700">Tipo/Nível: <span className="font-medium text-slate-600">{getRoleLabel(u.role)}</span></p>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider font-mono">Login & Autenticação</span>
                                        <p className="font-bold text-slate-700">Utilizador: <span className="font-mono text-slate-600 bg-slate-50 px-1 py-0.2 rounded border border-slate-150">{u.username || 'N/D'}</span></p>
                                        <p className="font-bold text-slate-700">Palavra-passe: <span className="font-mono text-orange-600 font-extrabold bg-orange-50/50 px-1.5 py-0.2 rounded border border-orange-100">{u.password || '123'}</span></p>
                                        <span className="text-[9px] text-slate-400 italic">Use estas credenciais acima para trocar de operador.</span>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile version: List of customized operator cards (Visible only on mobile devices under screen md) */}
                  <div className="block md:hidden space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                    {users.map((u) => {
                      const isExpanded = expandedOperatorId === u.id;
                      return (
                        <div 
                          key={u.id}
                          className={`border rounded-2xl transition-all ${
                            isExpanded 
                              ? 'bg-slate-50 border-orange-300 shadow-xs' 
                              : 'bg-white border-slate-205 hover:border-slate-300'
                          }`}
                        >
                          {/* Row header, tap-friendly click target */}
                          <div 
                            onClick={() => setExpandedOperatorId(isExpanded ? null : u.id)}
                            className="p-3 flex items-center justify-between gap-2.5 cursor-pointer select-none active:bg-slate-50"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                u.enabled ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {u.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <span className="font-extrabold text-slate-800 text-xs block truncate">{u.name}</span>
                                <span className={`inline-block text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wide leading-normal ${getRoleBadgeClasses(u.role)}`}>
                                  {getRoleLabel(u.role)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              {u.enabled ? (
                                <span className="text-[8px] text-emerald-600 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                  ATIVO
                                </span>
                              ) : (
                                <span className="text-[8px] text-rose-500 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                                  BLOQUEADO
                                </span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Expanded content under click trigger */}
                          {isExpanded && (
                            <div className="px-3 pb-3 pt-1 border-t border-slate-150 text-[11px] space-y-3 animate-in fade-in duration-120">
                              <div className="grid grid-cols-1 gap-2 bg-white p-3 rounded-xl border border-slate-150">
                                <div>
                                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider font-mono">Ficha de Identidade</span>
                                  <p className="mt-0.5 font-bold text-slate-700">Nome: <span className="font-medium text-slate-650">{u.name}</span></p>
                                  <p className="font-bold text-slate-700">ID: <span className="font-mono text-slate-500">{u.id}</span></p>
                                </div>
                                <div className="border-t border-slate-100 pt-2 mt-1">
                                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider font-mono">Acesso ao Aplicativo</span>
                                  <p className="mt-0.5 font-bold text-slate-700">Utilizador: <span className="font-mono text-slate-600 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-150">{u.username || 'Não cadastrado'}</span></p>
                                  <p className="font-bold text-slate-700">Palavra-passe: <span className="font-mono text-orange-600 font-extrabold bg-orange-50/50 px-1.5 py-0.2 rounded border border-orange-100">{u.password || '123'}</span></p>
                                </div>
                              </div>

                              {/* Action controls with perfect touch dimensions for mobile layout */}
                              <div className="flex items-center justify-between gap-1 border-t border-slate-100 pt-2">
                                <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest font-mono">Controle:</span>
                                {u.id === currentUser.id ? (
                                  <span className="text-[9.5px] font-mono text-slate-400 italic">Você (Autenticado)</span>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleUserStatus(u.id);
                                      }}
                                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                        u.enabled 
                                          ? 'bg-white hover:bg-slate-50 border-slate-205 text-slate-600' 
                                          : 'bg-emerald-50 hover:bg-emerald-100/50 border-emerald-200 text-emerald-700'
                                      }`}
                                    >
                                      {u.enabled ? 'Bloquear' : 'Habilitar'}
                                    </button>

                                    {deletingUserId === u.id ? (
                                      <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteUser(u.id);
                                          }}
                                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg cursor-pointer text-[9.5px]"
                                        >
                                          Sim
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingUserId(null);
                                          }}
                                          className="p-1 px-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeletingUserId(u.id);
                                        }}
                                        className="p-1.5 px-2 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-rose-500 hover:text-rose-650 rounded-lg cursor-pointer transition-all bg-white"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add standard user form */}
                <form onSubmit={handleAddUser} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                  <div className="md:col-span-12">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">Registrar Novo Operador Comercial</span>
                  </div>
                  
                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[10px] font-bold text-slate-655 uppercase block">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João Munguambe"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[10px] font-bold text-slate-655 uppercase block">Nome de Usuário (Login)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: joao"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[10px] font-bold text-slate-655 uppercase block">Senha de Acesso</label>
                    <input
                      type="password"
                      required
                      placeholder="Ex: joao123 (Min. 4 Car.)"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[10px] font-bold text-slate-655 uppercase block">Confirmar Senha</label>
                    <input
                      type="password"
                      required
                      placeholder="Digite a senha novamente"
                      value={newUserConfirmPassword}
                      onChange={(e) => setNewUserConfirmPassword(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none text-slate-800"
                    />
                  </div>

                  <div className="md:col-span-8 space-y-1">
                    <label className="text-[10px] font-bold text-slate-655 uppercase block">Tipo de Permissão (Cargo)</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 focus:border-orange-500 rounded-xl outline-none text-slate-800 cursor-pointer h-10"
                    >
                      <option value="vendedor">Vendedor — Apenas caixa de vendas (PDV)</option>
                      <option value="fiel">Fiel de Armazém — Apenas Gestão de Stock</option>
                      <option value="gestor">Gestor Geral — Acesso Total + Adm. de Equipe</option>
                    </select>
                  </div>

                  <div className="md:col-span-4">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors h-10 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Colaborador
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Forbidden screen for non-managers with guidance */
              <div className="p-5 border border-slate-200 bg-slate-50 rounded-2xl text-center space-y-2">
                <Lock className="w-7 h-7 mx-auto text-slate-300" />
                <h5 className="text-xs font-black text-slate-700">Apenas Gestores Autorizados</h5>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                  Somente operadores com perfil de <b>Gestor Geral</b> podem cadastrar, gerenciar, habilitar ou desabilitar o acesso dos demais colaboradores na plataforma comercial.
                </p>
                <div className="pt-1.5">
                  <span className="text-[9px] font-mono text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Nível Atual: {getRoleLabel(currentUser.role)}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 hover:bg-slate-105 text-slate-600 font-bold rounded-xl border border-slate-200 text-xs cursor-pointer transition-colors"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </div>
  );
}
