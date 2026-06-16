/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  BookOpen, 
  Package, 
  ShoppingCart, 
  Coins, 
  TrendingUp, 
  History, 
  Database,
  Smartphone,
  Info,
  ChevronRight,
  Sparkles,
  Phone,
  CheckCircle2
} from 'lucide-react';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChapterType = 'welcome' | 'inventory' | 'pos' | 'history' | 'payments' | 'storage';

export default function UserManualModal({ isOpen, onClose }: UserManualModalProps) {
  const [activeChapter, setActiveChapter] = useState<ChapterType>('welcome');

  const chapters = [
    {
      id: 'welcome' as ChapterType,
      title: 'Boas-vindas',
      icon: <Sparkles className="w-4 h-4" />,
      tag: 'Geral'
    },
    {
      id: 'inventory' as ChapterType,
      title: 'Gerir Estoque',
      icon: <Package className="w-4 h-4" />,
      tag: 'Inventário'
    },
    {
      id: 'pos' as ChapterType,
      title: 'Frente Caixa (PDV)',
      icon: <ShoppingCart className="w-4 h-4" />,
      tag: 'Vendas'
    },
    {
      id: 'payments' as ChapterType,
      title: 'Meios de Pagamento',
      icon: <Coins className="w-4 h-4" />,
      tag: 'Finanças'
    },
    {
      id: 'history' as ChapterType,
      title: 'Estorno e Histórico',
      icon: <History className="w-4 h-4" />,
      tag: 'Auditoria'
    },
    {
      id: 'storage' as ChapterType,
      title: 'Segurança e Local',
      icon: <Database className="w-4 h-4" />,
      tag: 'Dados'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto overflow-x-auto" id="user-manual-modal-overlay">
          {/* Backdrop with elegant fade transition */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative bg-white w-full max-w-4xl my-auto h-[90vh] sm:h-[80vh] max-h-[92vh] sm:max-h-none rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-y-auto overflow-x-auto md:overflow-hidden z-10"
            id="user-manual-modal-container"
          >
            {/* Elegant Header Area */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Manual de Instruções do Usuário</h3>
                  <p className="text-xs text-slate-500">Guia de boas práticas e uso do My Sales & Stocks</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Fechar manual"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Panel Layout */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* Sidebar Menu */}
              <aside className="w-full md:w-64 bg-slate-50/50 border-r border-slate-100 p-4 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-none">
                <div className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
                  Tópicos de Ajuda
                </div>
                {chapters.map((chap) => {
                  const isSelected = activeChapter === chap.id;
                  return (
                    <button
                      key={chap.id}
                      onClick={() => setActiveChapter(chap.id)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all shrink-0 md:shrink ${
                        isSelected 
                          ? 'bg-slate-900 text-white shadow-md' 
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                      }`}
                    >
                      <div className={`p-1 rounded-md ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {chap.icon}
                      </div>
                      <div className="flex-1 hidden md:block">
                        <div className="leading-none">{chap.title}</div>
                        <span className={`text-[9px] font-normal ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {chap.tag}
                        </span>
                      </div>
                      <span className="md:hidden text-xs">{chap.title}</span>
                    </button>
                  );
                })}
              </aside>

              {/* Reading Canvas */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6" id="user-manual-content-canvas">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeChapter}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 text-slate-600"
                  >
                    {activeChapter === 'welcome' && (
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Guia Rápido de Início</span>
                        </div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">
                          Bem-vindo ao My Sales & Stocks! 📈
                        </h4>
                        <p className="text-sm leading-relaxed">
                          Esta é uma solução integrada concebida especialmente para pequenos comerciantes e empreendedores de Moçambique. Ela permite gerenciar suas mercadorias, registrar vendas, monitorar faturamento e controlar o seu fluxo de caixa totalmente offline.
                        </p>
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/50 space-y-2">
                          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                            <Info className="w-4 h-4" />
                            <span>COMO UTILIZAR ESTA APP?</span>
                          </div>
                          <p className="text-xs text-amber-700 leading-normal">
                            Navegue pelas abas utilizando o painel esquerdo ou configure um protótipo de demonstração de negócio rapidamente na <strong className="font-semibold text-amber-900">Página Inicial</strong> (como Cantinas, Farmácias ou Quiosques) para ver dados reais preenchidos instantaneamente.
                          </p>
                        </div>
                        <h5 className="font-bold text-slate-800 text-sm pt-2">Estrutura das Abas:</h5>
                        <ul className="space-y-3 text-xs">
                          <li className="flex items-start gap-2.5">
                            <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div><strong className="text-slate-900">Página Inicial:</strong> Visão consolidada das suas finanças com faturamento e lucros, e carregamento rápido de templates prontos.</div>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div><strong className="text-slate-900">Métricas & Dashboard:</strong> Seus produtos mais vendidos, margens de ganho brutas, e alertas de estoque crítico ou em rutura.</div>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div><strong className="text-slate-900">Estoque:</strong> Cadastro de novos artigos, edição de preços de custo/venda, alteração de quantidades físicas e criação de categorias ilimitadas.</div>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div><strong className="text-slate-900">PDV (Caixa):</strong> Registro instantâneo de transações de venda com carrinho de compras interativo e recibo pronto.</div>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div><strong className="text-slate-900">Histórico:</strong> Auditoria retroativa de cada faturamento com opção de apagar/estornar receitas que recalcula o estoque físico automaticamente!</div>
                          </li>
                        </ul>
                      </div>
                    )}

                    {activeChapter === 'inventory' && (
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold">
                          <Package className="w-3.5 h-3.5" />
                          <span>Controle de Ativos</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Gestão de Estoque Eficiente</h4>
                        <p className="text-sm leading-relaxed">
                          O estoque é o coração do seu comércio. No menu <strong className="font-semibold text-slate-900">Estoque</strong>, você tem total autonomia para controlar as suas mercadorias:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-800 block mb-1">Preço de Custo vs. Preço de Venda</span>
                            <p className="text-xs text-slate-500 leading-normal">
                              Sempre registre o valor real que você pagou pelo produto (Custo) e o valor cobrado do cliente (Venda). O aplicativo usará esses dados para calcular o seu <strong className="text-emerald-600">Lucro Líquido Real</strong> em tempo real.
                            </p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-800 block mb-1">Estoques Críticos e Alertas</span>
                            <p className="text-xs text-slate-500 leading-normal">
                              Defina uma quantidade mínima de segurança para cada produto. Quando o saldo de itens chegar ou cair abaixo do limite, um <strong className="text-rose-500">alerta visual de rutura</strong> será gerado no Dashboard para evitar falta de produtos.
                            </p>
                          </div>
                        </div>

                        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-2">
                          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                            <svg className="w-4 h-4 fill-current text-emerald-600" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.005 5.148 5.117.03 11.432.03c3.058 0 5.932 1.192 8.095 3.358a11.336 11.336 0 0 1 3.357 8.1c-.007 6.284-5.119 11.405-11.43 11.405-1.996-.001-3.957-.521-5.694-1.51L0 24zm6.59-4.846c1.657.983 3.284 1.503 5.14 1.504 5.073 0 9.203-4.113 9.208-9.179.002-2.454-.955-4.761-2.693-6.499C16.565 3.282 14.25 2.32 11.8 2.32c-5.078 0-9.209 4.113-9.213 9.182-.001 1.956.517 3.6 1.493 5.234l-1.012 3.693 3.793-.995z" />
                            </svg>
                            <span>NOVIDADE: Alertas via WhatsApp 📱</span>
                          </div>
                          <p className="text-xs text-emerald-700 leading-normal">
                            Defina o número de telefone do Gerente/Gestor na seção superior da lista de reposição (na aba Painel). O sistema permite enviar um link de mensagem oficial pré-formatada do WhatsApp com detalhes de falta de estoque do produto individual, ou até mesmo um <strong className="font-semibold text-emerald-900">Relatório Consolidado Geral</strong> contendo todos os itens que precisam de compra!
                          </p>
                        </div>
                        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-1">
                          <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Dica de Produtividade:</span>
                          </div>
                          <p className="text-xs text-emerald-700">
                            Você pode filtrar rapidamente por categorias ou pesquisar em tempo real por nome do artigo para agilizar o reabastecimento. Na listagem, clique no botão de edição para fazer correções de estoque ou atualizar preços de venda em Moçambique.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeChapter === 'pos' && (
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-semibold">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Frente de Caixa</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Frente de Caixa (PDV) de Elevado Desempenho</h4>
                        <p className="text-sm leading-relaxed">
                          Idealizado para que o registrador não cometa erros ao atender os clientes da sua loja física:
                        </p>
                        <ol className="list-decimal list-inside text-xs space-y-2.5 text-slate-600">
                          <li>
                            <strong className="text-slate-800">Selecionar os Artigos:</strong> Navegue pelas categorias ou use o campo de texto para localizar o item. Clique no card do produto para adicioná-lo ao carrinho de compras ao lado direito.
                          </li>
                          <li>
                            <strong className="text-slate-800">Ajustar Quantidades:</strong> No carrinho de compras ativo, clique nos botões <code className="px-1.5 py-0.5 rounded bg-slate-100 font-bold border border-slate-200">+</code> ou <code className="px-1.5 py-0.5 rounded bg-slate-100 font-bold border border-slate-200">-</code> para aumentar ou diminuir unidades, ou clique na lixeira para remover o item.
                          </li>
                          <li>
                            <strong className="text-slate-800">Verificar Restrição de Estoque:</strong> O sistema não permite fechar vendas com quantidades maiores do que o estoque físico disponível no momento, protegendo os seus dados contra erros e perdas.
                          </li>
                          <li>
                            <strong className="text-slate-800">Definir Método de Pagamento e Finalizar:</strong> Escolha como o cliente vai pagar (Dinheiro, M-Pesa, e-Mola ou Cartão) e clique no botão verde para emitir o faturamento.
                          </li>
                        </ol>
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 flex gap-3 items-start">
                          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-500 leading-normal">
                            Assim que a venda é concluída, um <strong className="text-slate-800">recibo dinâmico</strong> é exibido na tela, permitindo que você envie os dados da transação por canais de comunicação ou imprima se necessário, e os descontos no estoque são aplicados instantaneamente.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeChapter === 'payments' && (
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                          <Coins className="w-3.5 h-3.5" />
                          <span>Canais Financeiros</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Controlo de Canais de Pagamento em Meticais (MT)</h4>
                        <p className="text-sm leading-relaxed">
                          Para apoiar os negócios moçambicanos que atuam com soluções financeiras mistas, o aplicativo divide todas as receitas nos seguintes canais:
                        </p>
                        <div className="space-y-3 pt-1">
                          <div className="flex gap-3 items-center p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                            <div className="p-1 px-2.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black">
                              M-Pesa
                            </div>
                            <div className="text-xs flex-1">
                              <strong className="text-slate-800 block">M-Pesa (Serviço de Dinheiro Móvel de Vodacom)</strong>
                              Faturamento rastreado eletronicamente para comparar com o extrato da carteira móvel corporativa.
                            </div>
                          </div>
                          <div className="flex gap-3 items-center p-3 bg-orange-50/50 border border-orange-100 rounded-xl">
                            <div className="p-1 px-2.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-black">
                              e-Mola
                            </div>
                            <div className="text-xs flex-1">
                              <strong className="text-slate-800 block">e-Mola (Serviço de carteira eletrônica da Movitel)</strong>
                              Consolidação das operações realizadas por canais USSD de forma ágil e segura.
                            </div>
                          </div>
                          <div className="flex gap-3 items-center p-3 bg-slate-50 border border-slate-150 rounded-xl">
                            <div className="p-1 px-2 bg-slate-250 text-slate-700 rounded-lg text-xs font-black">
                              Dinheiro
                            </div>
                            <div className="text-xs flex-1">
                              <strong className="text-slate-800 block">Numerário Físico (Moedas e Notas de Metical)</strong>
                              Ideal para o controle do seu caixa de balcão físico, garantindo que o dinheiro na gaveta bata com o relatório.
                            </div>
                          </div>
                          <div className="flex gap-3 items-center p-3 bg-sky-50/50 border border-sky-100 rounded-xl">
                            <div className="p-1 px-2.5 bg-sky-100 text-sky-700 rounded-lg text-xs font-black">
                              Cartão
                            </div>
                            <div className="text-xs flex-1">
                              <strong className="text-slate-800 block">Cartão de Débito/Crédito (POS)</strong>
                              Controle das cobranças eletrônicas por terminais bancários tradicionais ou modernos.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeChapter === 'history' && (
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-semibold">
                          <History className="w-3.5 h-3.5" />
                          <span>Estorno e Fluxo</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Faturamento Retroativo e Estornos</h4>
                        <p className="text-sm leading-relaxed">
                          Ocorreu algum erro em uma venda efetuada? Precisa reverter uma negociação do seu comércio? O sistema possui um mecanismo inteligente de reversão de integridade física:
                        </p>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3">
                          <span className="text-xs font-bold text-slate-800 block">Como funciona o fluxo de devolução?</span>
                          <ol className="list-decimal list-inside text-xs space-y-2 text-slate-500">
                            <li>Vá até a aba <strong className="text-slate-700">Histórico de Faturamento</strong>.</li>
                            <li>Identifique a venda a ser removida pela identificação de data ou pagamento.</li>
                            <li>Clique no botão <strong className="text-rose-600 font-semibold">"Excluir"</strong> ou no ícone da lixeira associado àquela transação.</li>
                            <li>O sistema recalcula automaticamente a quantidade em estoque para <strong className="text-emerald-600 font-semibold">adicionar novamente as unidades vendidas</strong>, prevenindo perdas ou descompassos de caixa!</li>
                          </ol>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed italic">
                          Nota: O histórico calcula as margens de lucro passadas líquidas com base no markup real do produto no seu respectivo instante de venda.
                        </p>
                      </div>
                    )}

                    {activeChapter === 'storage' && (
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                          <Database className="w-3.5 h-3.5" />
                          <span>Persistência offline</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Seus dados salvos no seu navegador</h4>
                        <p className="text-sm leading-relaxed">
                          Não precisa de servidores lentos na nuvem ou taxas extras para gerir seu negócio. O aplicativo funciona sob a modalidade comercial de <strong className="font-semibold text-slate-900">Banco de Dados Local Ativo</strong>:
                        </p>
                        <ul className="space-y-3 text-xs">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div><strong className="text-slate-800 block">Sem dependência de Internet:</strong> Todo o seu catálogo, preços, transações e saldo financeiro em Metical são gravados no cache do navegador local (<code className="px-1 py-0.5 bg-slate-100 rounded font-semibold text-slate-700">localStorage</code>). O aplicativo nunca perde informações se a internet falhar.</div>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div><strong className="text-slate-800 block">Segurança Privada:</strong> Como as informações nunca são transmitidas para redes corporativas de terceiros, a receita do seu comércio permanece estritamente privada.</div>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div><strong className="text-slate-800 block">Limpeza ou Reinicialização Completa:</strong> Se você desejar limpar todos os dados cadastrados de teste e reiniciar seu comércio do zero com dados recomendados de fábrica, basta clicar no botão de reset localizado no rodapé da página inicial de forma interativa.</div>
                          </li>
                        </ul>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Footer containing action help */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Smartphone className="w-4 h-4 text-slate-400" />
                <span>My Sales & Stocks — Pronto para Dispositivos Móveis</span>
              </span>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 cursor-pointer transition-colors text-center"
              >
                Entendi, Fechar Manual
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
