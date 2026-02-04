import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import type { AccountingProgress } from '@/hooks/useAccountingProgress';

interface ClientWithProgress {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  progress: AccountingProgress | null;
}

interface AccountingProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientWithProgress | null;
  onSave: (clientId: string, data: Omit<AccountingProgress, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
}

const colaboradores = [
  'Ana Silva',
  'Carlos Santos',
  'Maria Oliveira',
  'João Pereira',
  'Fernanda Costa',
];

export function AccountingProgressDialog({ open, onOpenChange, client, onSave }: AccountingProgressDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    colaboradorResponsavel: client?.progress?.colaboradorResponsavel || '',
    mesAno: client?.progress?.mesAno || new Date().toISOString().slice(0, 7),
    conciliacaoContabil: client?.progress?.conciliacaoContabil || false,
    controleLucros: client?.progress?.controleLucros || false,
    controleAplicacaoFinanceira: client?.progress?.controleAplicacaoFinanceira || false,
    controleAnual: client?.progress?.controleAnual || false,
    empresaEncerrada: client?.progress?.empresaEncerrada || false,
    pendencias: client?.progress?.pendencias || '',
  });

  // Reset form when client changes
  useState(() => {
    if (client) {
      setFormData({
        colaboradorResponsavel: client.progress?.colaboradorResponsavel || '',
        mesAno: client.progress?.mesAno || new Date().toISOString().slice(0, 7),
        conciliacaoContabil: client.progress?.conciliacaoContabil || false,
        controleLucros: client.progress?.controleLucros || false,
        controleAplicacaoFinanceira: client.progress?.controleAplicacaoFinanceira || false,
        controleAnual: client.progress?.controleAnual || false,
        empresaEncerrada: client.progress?.empresaEncerrada || false,
        pendencias: client.progress?.pendencias || '',
      });
    }
  });

  const handleSave = async () => {
    if (!client || !formData.colaboradorResponsavel || !formData.mesAno) return;
    
    setSaving(true);
    const success = await onSave(client.id, formData);
    setSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-light">Progresso Contábil</DialogTitle>
          <p className="text-sm text-muted-foreground">{client.razaoSocial}</p>
          <p className="text-xs font-mono text-muted-foreground">{client.cnpj}</p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Colaborador */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Colaborador Responsável</Label>
            <select
              value={formData.colaboradorResponsavel}
              onChange={(e) => setFormData({ ...formData, colaboradorResponsavel: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Selecione um colaborador</option>
              {colaboradores.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Mês/Ano */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mês/Ano de Fechamento</Label>
            <Input
              type="month"
              value={formData.mesAno}
              onChange={(e) => setFormData({ ...formData, mesAno: e.target.value })}
              className="rounded-xl"
            />
          </div>

          {/* Toggle Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
              <Label className="text-sm font-light">Conciliação Contábil</Label>
              <Switch
                checked={formData.conciliacaoContabil}
                onCheckedChange={(checked) => setFormData({ ...formData, conciliacaoContabil: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
              <Label className="text-sm font-light">Controle de Lucros</Label>
              <Switch
                checked={formData.controleLucros}
                onCheckedChange={(checked) => setFormData({ ...formData, controleLucros: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
              <Label className="text-sm font-light">Controle de Aplicação Financeira</Label>
              <Switch
                checked={formData.controleAplicacaoFinanceira}
                onCheckedChange={(checked) => setFormData({ ...formData, controleAplicacaoFinanceira: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
              <Label className="text-sm font-light">Controle Anual</Label>
              <Switch
                checked={formData.controleAnual}
                onCheckedChange={(checked) => setFormData({ ...formData, controleAnual: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <Label className="text-sm font-light text-destructive">Empresa Encerrada?</Label>
              <Switch
                checked={formData.empresaEncerrada}
                onCheckedChange={(checked) => setFormData({ ...formData, empresaEncerrada: checked })}
              />
            </div>
          </div>

          {/* Pendências */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pendências</Label>
            <Textarea
              value={formData.pendencias}
              onChange={(e) => setFormData({ ...formData, pendencias: e.target.value })}
              placeholder="Observações e pendências..."
              className="rounded-xl min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !formData.colaboradorResponsavel}
            className="rounded-xl"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
