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
import type { Client } from '@/hooks/useClients';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({ open, onOpenChange, client, onConfirm }: DeleteConfirmDialogProps) {
  if (!client) return null;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Excluir Cliente
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o cliente{' '}
            <span className="font-semibold text-foreground">{client.nomeFantasia}</span>?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            CNPJ: {client.cnpj}
          </p>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Excluir Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
