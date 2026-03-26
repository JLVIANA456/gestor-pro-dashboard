import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Client } from '@/hooks/useClients';

interface InactivateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onConfirm: (reason: string, details?: string) => void;
}

export function InactivateClientDialog({ open, onOpenChange, client, onConfirm }: InactivateClientDialogProps) {
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState<string>('');

  if (!client) return null;

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm(reason, details);
    setReason('');
    setDetails('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Inativar Cliente
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                O cliente será movido para o histórico de inativos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Você está prestes a inativar o cliente{' '}
            <span className="font-semibold text-foreground">{client.nomeFantasia}</span> (CNPJ: {client.cnpj}).
          </p>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs uppercase tracking-wider font-light">Motivo da Inativação</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason" className="rounded-xl border-border/50 bg-muted/20">
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="baixada">Baixada</SelectItem>
                <SelectItem value="transferida">Transferida</SelectItem>
                <SelectItem value="outros">Outros motivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reason === 'outros' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="details" className="text-xs uppercase tracking-wider font-light">Especifique o motivo</Label>
              <Textarea
                id="details"
                placeholder="Descreva o motivo da inativação..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="rounded-xl border-border/50 bg-muted/20 resize-none min-h-[100px]"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl font-light uppercase tracking-wider text-xs">
            Cancelar
          </Button>
          <Button 
            variant="default" 
            onClick={handleConfirm} 
            disabled={!reason || (reason === 'outros' && !details.trim())}
            className="rounded-xl font-light uppercase tracking-widest text-xs bg-amber-500 hover:bg-amber-600 text-white border-none"
          >
            Inativar Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
