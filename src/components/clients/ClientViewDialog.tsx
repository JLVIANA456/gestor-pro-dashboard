import { Building2, Mail, Phone, User, FileText, Key } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Client, TaxRegime } from '@/hooks/useClients';

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
  simples: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  presumido: 'bg-blue-100 text-blue-700 border-blue-200',
  real: 'bg-amber-100 text-amber-700 border-amber-200',
};

export function ClientViewDialog({ open, onOpenChange, client }: ClientViewDialogProps) {
  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-foreground flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <span className="block">{client.nomeFantasia}</span>
              <span className="text-sm font-normal text-muted-foreground">{client.razaoSocial}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Regime Badge */}
          <div
            className={cn(
              'inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium',
              regimeStyles[client.regimeTributario]
            )}
          >
            {regimeLabels[client.regimeTributario]}
          </div>

          {/* Dados Fiscais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Dados Fiscais
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-muted p-4">
                <p className="text-xs text-muted-foreground mb-1">CNPJ</p>
                <p className="font-medium text-foreground">{client.cnpj}</p>
              </div>
              {client.ccm && (
                <div className="rounded-xl bg-muted p-4">
                  <p className="text-xs text-muted-foreground mb-1">CCM</p>
                  <p className="font-medium text-foreground">{client.ccm}</p>
                </div>
              )}
              {client.ie && (
                <div className="rounded-xl bg-muted p-4">
                  <p className="text-xs text-muted-foreground mb-1">Inscrição Estadual</p>
                  <p className="font-medium text-foreground">{client.ie}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Contato
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{client.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium text-foreground">{client.telefone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Senhas */}
          {client.senhaPrefeitura && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Senhas de Acesso
              </h3>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-xs text-muted-foreground mb-1">Senha Prefeitura</p>
                <p className="font-medium text-foreground font-mono">••••••••</p>
              </div>
            </div>
          )}

          {/* Quadro Societário */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Quadro Societário
            </h3>
            <div className="space-y-3">
              {client.quadroSocietario.map((socio, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl bg-muted p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                      {socio.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{socio.nome}</p>
                      <p className="text-xs text-muted-foreground">{socio.cpf}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {socio.participacao}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
