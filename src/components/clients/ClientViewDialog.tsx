import { Building2, Mail, Phone, User, FileText, Key, Eye, EyeOff, ShieldCheck, CreditCard, Users, MapPin, Globe, Calendar, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Client, TaxRegime } from '@/hooks/useClients';
import React, { useState } from 'react';

interface ClientViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onDelete?: (client: Client) => void;
  onReactivate?: (id: string) => void;
}

const regimeLabels: Record<TaxRegime, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
  domestico: 'Empregador Doméstico',
};

const regimeStyles: Record<TaxRegime, string> = {
  simples: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.1)]',
  presumido: 'bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.1)]',
  real: 'bg-violet-500/10 text-violet-600 border-violet-500/20 shadow-[0_0_15px_-3px_rgba(139,92,246,0.1)]',
  domestico: 'bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]',
};

function PasswordDisplay({ value }: { value?: string }) {
  const [show, setShow] = useState(false);

  if (!value) return <p className="text-xs text-muted-foreground/40 italic font-medium">Não informado</p>;

  return (
    <div className="flex items-center gap-3 w-full">
      {show ? (
        <p className="font-mono text-sm font-semibold text-foreground/80 tracking-tight">{value}</p>
      ) : (
        <p className="font-mono text-sm tracking-[0.3em] text-foreground/30">••••••••</p>
      )}
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground/50 hover:text-primary transition-all focus:outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        title={show ? "Ocultar" : "Mostrar"}
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export function ClientViewDialog({ open, onOpenChange, client, onDelete, onReactivate }: ClientViewDialogProps) {
  if (!client) return null;

  const SectionHeader = ({ title, icon: Icon, colorClass = "text-primary bg-primary/10" }: { title: string, icon: any, colorClass?: string }) => (
    <div className="flex items-center gap-3 mb-6 group">
      <div className={cn("p-2 rounded-xl transition-all duration-300 group-hover:scale-110", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-[0.15em]">{title}</h3>
        <div className="h-0.5 w-12 bg-primary/20 mt-1.5 rounded-full group-hover:w-20 transition-all duration-500"></div>
      </div>
    </div>
  );

  const InfoCard = ({ label, value, icon: Icon, isPassword, className }: { label: string, value?: string, icon?: any, isPassword?: boolean, className?: string }) => (
    <div className={cn("group flex flex-col gap-1.5", className)}>
      <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">{label}</label>
      <div className="relative flex items-center min-h-[2.75rem] px-4 py-2 rounded-2xl bg-muted/20 border border-transparent group-hover:border-primary/20 group-hover:bg-card transition-all duration-300">
        <div className="flex items-center gap-3 w-full">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />}
          <div className="flex-1 min-w-0">
            {isPassword ? (
              <PasswordDisplay value={value} />
            ) : (
              <p className="text-sm font-medium text-foreground leading-snug break-all">
                {value || <span className="text-muted-foreground/30 font-light italic">---</span>}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-card border-none shadow-2xl ring-1 ring-border/50 max-h-[92vh] flex flex-col">
        {/* Banner de Identificação */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-primary/[0.08] via-background to-background border-b border-border/40">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12 pointer-events-none">
            <Building2 className="h-64 w-64 -mr-20 -mt-20" />
          </div>
          
          <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner-lg ring-1 ring-primary/20">
              <Building2 className="h-10 w-10 text-primary drop-shadow-sm" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {client.nomeFantasia || client.razaoSocial}
                </h2>
                <div className={cn(
                  'w-fit mx-auto md:mx-0 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm flex items-center gap-2 ring-1 ring-inset',
                  client.isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 ring-rose-500/20'
                )}>
                  <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", client.isActive ? "bg-emerald-500" : "bg-rose-500")}></div>
                  {client.isActive ? 'Em Operação' : 'Inativo'}
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-y-2 gap-x-6 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-muted/50"><FileText className="h-3.5 w-3.5" /></div>
                  <span className="truncate max-w-[400px]">{client.razaoSocial}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-muted/50"><CreditCard className="h-3.5 w-3.5" /></div>
                  <span>{client.cnpj}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-zinc-950/20">
          <div className="p-8 md:p-10 space-y-12">
            
            {/* Seção 1: Perfil Corporativo */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SectionHeader title="Perfil Corporativo" icon={ShieldCheck} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InfoCard label="Razão Social" value={client.razaoSocial} icon={FileText} className="lg:col-span-2" />
                <InfoCard label="Nome Fantasia" value={client.nomeFantasia} icon={Building2} />
                <InfoCard label="Responsável Legal" value={client.responsavelEmpresa} icon={User} />
                
                <div className="group flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">Regime Tributário</label>
                  <div className={cn(
                    'flex items-center justify-center min-h-[2.75rem] rounded-2xl border text-xs font-bold transition-all duration-300',
                    regimeStyles[client.regimeTributario]
                  )}>
                    {regimeLabels[client.regimeTributario]}
                  </div>
                </div>

                <InfoCard 
                  label="Data de Entrada" 
                  value={client.dataEntrada ? new Date(client.dataEntrada).toLocaleDateString('pt-BR') : undefined} 
                  icon={Calendar} 
                />

                {client.dataSaida && !client.isActive && (
                  <InfoCard label="Data de Inativação" value={new Date(client.dataSaida).toLocaleDateString('pt-BR')} icon={Calendar} className="border-rose-500/20" />
                )}

                {/* Status de Alerta para Inativos */}
                {!client.isActive && client.inactivationReason && (
                  <div className="col-span-full p-5 rounded-3xl bg-amber-500/[0.03] border border-amber-500/20 flex gap-4 items-start">
                    <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Nota de Inativação</h4>
                      <p className="text-sm font-medium text-amber-900/80 leading-relaxed">
                        {client.inactivationReason === 'baixada' ? 'Empresa Baixada' : 
                         client.inactivationReason === 'transferida' ? 'Empresa Transferida' : 
                         'Outros motivos'}
                      </p>
                      {client.inactivationDetails && (
                        <p className="text-xs text-amber-800/60 mt-2 bg-amber-500/5 p-3 rounded-xl italic">
                          "{client.inactivationDetails}"
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Motivo de Saída / Baixa para Ativos (Casos especiais) */}
                {client.motivoSaida && client.isActive && (
                  <div className="col-span-full p-5 rounded-3xl bg-destructive/[0.03] border border-destructive/20 flex gap-4 items-start animate-in zoom-in-95 duration-300">
                    <div className="p-2 rounded-2xl bg-destructive/10 text-destructive shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-destructive uppercase tracking-wider mb-1">Motivo da Saída / Baixa</h4>
                      <p className="text-sm font-medium text-foreground leading-relaxed">{client.motivoSaida}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Seção 2: Credenciais & Acessos */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              <SectionHeader title="Credenciais & Acessos" icon={Key} colorClass="text-indigo-500 bg-indigo-500/10" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Acesso Municipal */}
                <div className="p-6 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-border/40 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-slate-500" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-widest">Prefeitura (Municipal)</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoCard label="CCM" value={client.ccm} />
                    <InfoCard label="Senha" value={client.ccmSenha || client.senhaPrefeitura} isPassword />
                  </div>
                </div>

                {/* Acesso Estadual */}
                <div className="p-6 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-border/40 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-slate-500" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-widest">SEFAZ (Estadual)</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoCard label="Inscr. Estadual" value={client.ie} />
                    <InfoCard label="Senha SEFAZ" value={client.sefazSenha} isPassword />
                  </div>
                </div>

                {/* Diversos (Simples & e-CAC) */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/[0.03] to-transparent border border-emerald-500/10 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-emerald-700/70 uppercase tracking-widest px-2">Simples Nacional</h4>
                    <InfoCard label="Código de Acesso / Senha" value={client.simplesNacionalSenha} isPassword className="group-hover:bg-white/50" />
                  </div>
                  
                  <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-500/[0.03] to-transparent border border-blue-500/10 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-blue-700/70 uppercase tracking-widest px-2">Portal e-CAC</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoCard label="Cód. de Acesso" value={client.ecacCodigoAcesso} />
                      <InfoCard label="Senha e-CAC" value={client.ecacSenha} isPassword />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 3: Certificado Digital */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              <div className="p-1 rounded-[3rem] bg-gradient-to-r from-primary/20 via-primary/5 to-transparent">
                <div className="bg-card p-8 rounded-[2.8rem] space-y-8">
                  <SectionHeader title="Certificado Digital" icon={ShieldCheck} colorClass="text-emerald-500 bg-emerald-500/10" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <InfoCard label="Tipo / Modelo" value={client.certificadoDigitalTipo} icon={ShieldCheck} />
                    <div className="group flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">Validade</label>
                      <div className="flex items-center min-h-[2.75rem] px-4 py-2 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className={cn(
                          "text-sm font-bold tracking-tight",
                          client.certificadoDigitalVencimento ? "text-primary" : "text-muted-foreground/40"
                        )}>
                          {client.certificadoDigitalVencimento ? new Date(client.certificadoDigitalVencimento).toLocaleDateString('pt-BR') : '---'}
                        </p>
                      </div>
                    </div>
                    <InfoCard label="Senha" value={client.certificadoDigitalSenha} isPassword />
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 4: Comunicação & Equipe */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <section className="space-y-6">
                <SectionHeader title="Contatos Diretos" icon={Mail} colorClass="text-rose-500 bg-rose-500/10" />
                <div className="space-y-4">
                  <div className="p-6 rounded-[2.5rem] bg-white dark:bg-zinc-900 border border-border/40 shadow-sm space-y-4">
                    <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest px-2">Canais de E-mail</label>
                    <div className="flex flex-wrap gap-2">
                      {client.email ? client.email.split(',').map((email, idx) => (
                        <div key={idx} className="group flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-card transition-all duration-300">
                          <Mail className="h-3.5 w-3.5 text-primary/40 group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium text-foreground">{email.trim()}</span>
                        </div>
                      )) : (
                        <p className="text-xs text-muted-foreground/40 italic p-2">Nenhum e-mail cadastrado</p>
                      )}
                    </div>
                  </div>
                  <InfoCard label="Telefone / WhatsApp" value={client.telefone} icon={Phone} />
                </div>
              </section>

              <section className="space-y-6">
                <SectionHeader title="Responsáveis Técnicos" icon={Users} colorClass="text-amber-500 bg-amber-500/10" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoCard label="Dep. Pessoal" value={client.responsavelDp} className="sm:col-span-1" />
                  <InfoCard label="Dep. Fiscal" value={client.responsavelFiscal} className="sm:col-span-1" />
                  <InfoCard label="Dep. Contábil" value={client.responsavelContabil} className="sm:col-span-1" />
                  <InfoCard label="Dep. Financeiro" value={client.responsavelFinanceiro} className="sm:col-span-1" />
                  <InfoCard label="Dep. Qualidade" value={client.responsavelQualidade} className="sm:col-span-1" />
                </div>
              </section>
            </div>

            {/* Seção 5: Quadro Societário */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              <SectionHeader title="Quadro Societário" icon={Users} colorClass="text-slate-500 bg-slate-500/10" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {client.quadroSocietario.map((socio, index) => (
                  <div key={index} className="group relative overflow-hidden p-6 rounded-[2rem] border border-border/50 bg-white dark:bg-zinc-900 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                    <div className="flex items-center gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary text-sm font-bold ring-1 ring-primary/10 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                        {socio.nome.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{socio.nome}</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1 italic">{socio.cpf}</p>
                      </div>
                      <div className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                        {socio.participacao}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer/Ações Visual Apenas */}
        <div className="shrink-0 p-6 bg-muted/10 border-t border-border/40 flex items-center gap-4">
          <div className="flex items-center gap-3">
            {onDelete && (
              <button 
                type="button"
                onClick={() => {
                  onDelete(client);
                  onOpenChange(false);
                }}
                className="px-6 py-2.5 rounded-2xl bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-widest hover:bg-destructive shadow-sm hover:text-white transition-all flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Empresa
              </button>
            )}

            {!client.isActive && onReactivate && (
              <button 
                type="button"
                onClick={() => {
                  onReactivate(client.id);
                  onOpenChange(false);
                }}
                className="px-6 py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 shadow-sm hover:text-white transition-all flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Reativar Empresa
              </button>
            )}
          </div>

          <button 
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-6 py-2.5 rounded-2xl bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all ml-auto"
          >
            Fechar Visualização
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
