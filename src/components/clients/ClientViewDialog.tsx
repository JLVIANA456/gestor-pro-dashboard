import { Building2, Mail, Phone, User, FileText, Key, Eye, EyeOff } from 'lucide-react';
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
}

const regimeLabels: Record<TaxRegime, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
};

const regimeStyles: Record<TaxRegime, string> = {
  simples: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  presumido: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  real: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
};

function PasswordDisplay({ value }: { value?: string }) {
  const [show, setShow] = useState(false);

  if (!value) return <p className="font-light text-foreground text-sm italic opacity-40 uppercase tracking-tighter">Vazio</p>;

  return (
    <div className="flex items-center gap-3">
      {show ? (
        <p className="font-mono text-sm text-foreground/80">{value}</p>
      ) : (
        <p className="font-mono text-sm tracking-[0.2em] text-foreground/50">••••••••</p>
      )}
      <button
        onClick={() => setShow(!show)}
        className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground/40 hover:text-primary transition-colors focus:outline-none"
        title={show ? "Ocultar" : "Mostrar"}
      >
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export function ClientViewDialog({ open, onOpenChange, client }: ClientViewDialogProps) {
  if (!client) return null;

  const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode, icon: any }) => (
    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 border-b border-border/50 pb-3 mb-6">
      <Icon className="h-3.5 w-3.5 text-primary/60" />
      {children}
    </h3>
  );

  const DataField = ({ label, value, isPassword, fullWidth }: { label: string, value?: string, isPassword?: boolean, fullWidth?: boolean }) => (
    <div className={cn("space-y-1.5", fullWidth ? "col-span-full" : "")}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-normal">{label}</p>
      <div className="flex items-center gap-2 min-h-[1.5rem]">
        {isPassword ? (
          <PasswordDisplay value={value} />
        ) : (
          <p className="font-light text-foreground text-sm break-all">{value || '---'}</p>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card border-border max-h-[95vh] overflow-y-auto p-0">
        {/* Header Banner */}
        <div className="bg-muted/30 p-8 border-b border-border/50">
          <div className="flex items-start gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10 shadow-sm">
              <Building2 className="h-8 w-8 text-primary/40" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-light text-foreground leading-tight">
                  {client.nomeFantasia || client.razaoSocial}
                </h2>
                <div className={cn(
                  'px-3 py-0.5 rounded-full text-[9px] font-normal uppercase tracking-widest border',
                  client.isActive ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 'bg-destructive/5 text-destructive border-destructive/20'
                )}>
                  {client.isActive ? 'Ativo' : 'Inativo'}
                </div>
              </div>
              <p className="text-[10px] font-normal text-muted-foreground uppercase tracking-[0.2em]">
                {client.razaoSocial}
              </p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-12">
          {/* 1. Identificação Corporativa */}
          <section>
            <SectionTitle icon={FileText}>1. Identificação Corporativa</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <DataField label="Razão Social" value={client.razaoSocial} fullWidth />
              <DataField label="Nome Fantasia" value={client.nomeFantasia} />
              <DataField label="CNPJ / CPF" value={client.cnpj} />
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-normal">Regime Tributário</p>
                <div className={cn(
                  'inline-flex items-center rounded-lg border px-3 py-1 text-xs font-normal transition-colors',
                  regimeStyles[client.regimeTributario]
                )}>
                  {regimeLabels[client.regimeTributario]}
                </div>
              </div>
              <DataField label="Data de Entrada" value={client.dataEntrada ? new Date(client.dataEntrada).toLocaleDateString('pt-BR') : '---'} />
              <DataField label="Data de Saída" value={client.dataSaida ? new Date(client.dataSaida).toLocaleDateString('pt-BR') : '---'} />
              {client.motivoSaida && (
                <div className="col-span-full animate-slide-in-up">
                  <div className="space-y-1.5 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                    <p className="text-[10px] text-destructive uppercase tracking-widest font-bold">Motivo da Saída / Baixa</p>
                    <p className="font-light text-foreground text-sm">{client.motivoSaida}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 2. Fiscal & Credenciais */}
          <section>
            <SectionTitle icon={Key}>2. Fiscal & Credenciais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {/* Prefeitura */}
              <div className="space-y-6">
                <h4 className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Acesso Municipal (Prefeitura)</h4>
                <div className="grid grid-cols-2 gap-6 p-5 rounded-2xl bg-muted/20 border border-border/50">
                  <DataField label="CCM" value={client.ccm} />
                  <DataField label="Senha Prefeitura" value={client.ccmSenha || client.senhaPrefeitura} isPassword />
                </div>
              </div>

              {/* SEFAZ */}
              <div className="space-y-6">
                <h4 className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Acesso Estadual (SEFAZ)</h4>
                <div className="grid grid-cols-2 gap-6 p-5 rounded-2xl bg-muted/20 border border-border/50">
                  <DataField label="Inscr. Estadual (IE)" value={client.ie} />
                  <DataField label="Senha SEFAZ / Posto" value={client.sefazSenha} isPassword />
                </div>
              </div>

              {/* Simples Nacional */}
              <div className="space-y-6">
                <h4 className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Simples Nacional</h4>
                <div className="p-5 rounded-2xl bg-muted/20 border border-border/50">
                  <DataField label="Código de Acesso / Senha" value={client.simplesNacionalSenha} isPassword />
                </div>
              </div>

              {/* e-CAC */}
              <div className="space-y-6">
                <h4 className="text-[11px] font-bold text-foreground/70 uppercase tracking-wider">Portal e-CAC (Receita Federal)</h4>
                <div className="grid grid-cols-2 gap-6 p-5 rounded-2xl bg-muted/20 border border-border/50">
                  <DataField label="Código de Acesso" value={client.ecacCodigoAcesso} />
                  <DataField label="Senha e-CAC" value={client.ecacSenha} isPassword />
                </div>
              </div>
            </div>
          </section>

          {/* 3. Certificado Digital */}
          <section>
            <SectionTitle icon={Key}>3. Certificado Digital</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 rounded-2xl bg-primary/[0.03] border border-primary/10 shadow-sm">
              <DataField label="Tipo / Modelo" value={client.certificadoDigitalTipo} />
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-normal">Data de Vencimento</p>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-light text-sm",
                    client.certificadoDigitalVencimento ? "text-primary font-normal" : "text-muted-foreground"
                  )}>
                    {client.certificadoDigitalVencimento ? new Date(client.certificadoDigitalVencimento).toLocaleDateString('pt-BR') : '---'}
                  </p>
                </div>
              </div>
              <DataField label="Senha do Certificado" value={client.certificadoDigitalSenha} isPassword />
            </div>
          </section>

          {/* 4. Comunicação & Status */}
          <section>
            <SectionTitle icon={Mail}>4. Comunicação & Status</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted border border-border/50">
                  <Mail className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <DataField label="E-mail Principal" value={client.email} />
              </div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted border border-border/50">
                  <Phone className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <DataField label="Telefone / WhatsApp" value={client.telefone} />
              </div>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted border border-border/50">
                  <FileText className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-normal">Status Operacional</p>
                  <p className={cn(
                    "text-sm font-normal",
                    client.isActive ? "text-emerald-600" : "text-destructive"
                  )}>
                    {client.isActive ? 'Ativo' : 'Inativo / Encerrado'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Quadro Societário */}
          <section>
            <SectionTitle icon={User}>5. Quadro Societário</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {client.quadroSocietario.map((socio, index) => (
                <div key={index} className="group relative flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/20 hover:shadow-sm transition-all">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5 text-primary text-xs font-bold ring-1 ring-primary/10">
                    {socio.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light text-foreground truncate group-hover:text-primary transition-colors">{socio.nome}</p>
                    <p className="text-[9px] text-muted-foreground font-normal uppercase tracking-widest mt-0.5">{socio.cpf}</p>
                  </div>
                  <div className="text-xs font-normal text-primary bg-primary/5 px-2 py-1 rounded-lg">
                    {socio.participacao}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
