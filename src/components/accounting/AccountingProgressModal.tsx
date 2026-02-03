import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Save, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Client } from '@/hooks/useClients';
import type { AccountingProgress } from '@/hooks/useAccountingProgress';

interface AccountingProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  existingProgress?: AccountingProgress;
  colaboradores: string[];
  onSave: (data: Omit<AccountingProgress, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

// Gerar últimos 24 meses
const generateMonthOptions = () => {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = format(date, 'yyyy-MM');
    const label = format(date, 'MMMM yyyy', { locale: ptBR });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  
  return options;
};

const monthOptions = generateMonthOptions();

export function AccountingProgressModal({
  open,
  onOpenChange,
  client,
  existingProgress,
  colaboradores,
  onSave,
}: AccountingProgressModalProps) {
  const [loading, setLoading] = useState(false);
  const [colaborador, setColaborador] = useState('');
  const [mesAno, setMesAno] = useState(format(new Date(), 'yyyy-MM'));
  const [conciliacao, setConciliacao] = useState(false);
  const [lucros, setLucros] = useState(false);
  const [aplicacao, setAplicacao] = useState(false);
  const [anual, setAnual] = useState(false);
  const [encerrada, setEncerrada] = useState(false);
  const [pendencias, setPendencias] = useState('');

  useEffect(() => {
    if (existingProgress) {
      setColaborador(existingProgress.colaboradorResponsavel);
      setMesAno(existingProgress.mesAno);
      setConciliacao(existingProgress.conciliacaoContabil);
      setLucros(existingProgress.controleLucros);
      setAplicacao(existingProgress.controleAplicacaoFinanceira);
      setAnual(existingProgress.controleAnual);
      setEncerrada(existingProgress.empresaEncerrada);
      setPendencias(existingProgress.pendencias || '');
    } else {
      // Reset form
      setColaborador('');
      setMesAno(format(new Date(), 'yyyy-MM'));
      setConciliacao(false);
      setLucros(false);
      setAplicacao(false);
      setAnual(false);
      setEncerrada(false);
      setPendencias('');
    }
  }, [existingProgress, open]);

  const handleSave = async () => {
    if (!client || !colaborador || !mesAno) return;

    setLoading(true);
    try {
      await onSave({
        clientId: client.id,
        colaboradorResponsavel: colaborador,
        mesAno,
        conciliacaoContabil: conciliacao,
        controleLucros: lucros,
        controleAplicacaoFinanceira: aplicacao,
        controleAnual: anual,
        empresaEncerrada: encerrada,
        pendencias,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  const SwitchField = ({ 
    label, 
    checked, 
    onCheckedChange 
  }: { 
    label: string; 
    checked: boolean; 
    onCheckedChange: (checked: boolean) => void 
  }) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50">
      <Label className="text-sm font-light text-foreground">{label}</Label>
      <div className="flex items-center gap-3">
        <span className={cn(
          "text-xs uppercase tracking-wider font-normal",
          checked ? "text-emerald-600" : "text-muted-foreground"
        )}>
          {checked ? 'Sim' : 'Não'}
        </span>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-foreground">
            Progresso Contábil
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-light">
            {client.nomeFantasia || client.razaoSocial}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Colaborador */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Colaborador Responsável
            </Label>
            <Select value={colaborador} onValueChange={setColaborador}>
              <SelectTrigger className="rounded-xl border-border/50">
                <SelectValue placeholder="Selecione o colaborador" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-xl">
                {colaboradores.length > 0 ? (
                  colaboradores.map((c) => (
                    <SelectItem key={c} value={c} className="rounded-lg">
                      {c}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="_empty" disabled className="rounded-lg text-muted-foreground">
                    Nenhum colaborador cadastrado
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Mês/Ano */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Mês/Ano de Fechamento
            </Label>
            <Select value={mesAno} onValueChange={setMesAno}>
              <SelectTrigger className="rounded-xl border-border/50">
                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-xl max-h-60">
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Switches */}
          <div className="space-y-3">
            <SwitchField 
              label="Conciliação Contábil" 
              checked={conciliacao} 
              onCheckedChange={setConciliacao} 
            />
            <SwitchField 
              label="Controle de Lucros" 
              checked={lucros} 
              onCheckedChange={setLucros} 
            />
            <SwitchField 
              label="Controle de Aplicação Financeira" 
              checked={aplicacao} 
              onCheckedChange={setAplicacao} 
            />
            <SwitchField 
              label="Controle Anual" 
              checked={anual} 
              onCheckedChange={setAnual} 
            />
            <SwitchField 
              label="Empresa Encerrada?" 
              checked={encerrada} 
              onCheckedChange={setEncerrada} 
            />
          </div>

          {/* Pendências */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Pendências / Observações
            </Label>
            <Textarea
              value={pendencias}
              onChange={(e) => setPendencias(e.target.value)}
              placeholder="Descreva pendências ou observações..."
              className="rounded-xl border-border/50 min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !colaborador || !mesAno}
            className="rounded-xl"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
