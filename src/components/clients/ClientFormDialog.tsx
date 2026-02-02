import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Client, TaxRegime } from '@/hooks/useClients';

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSave: (client: Omit<Client, 'id'> & { id?: string }) => void;
}

interface Socio {
  nome: string;
  cpf: string;
  participacao: number;
}

interface FormData {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  ccm: string;
  ie: string;
  regimeTributario: TaxRegime | '';
  email: string;
  telefone: string;
  senhaPrefeitura: string;
  senhaEstadual: string;
  dataEntrada: string;
  dataSaida: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  ccm: '',
  ie: '',
  regimeTributario: '',
  email: '',
  telefone: '',
  senhaPrefeitura: '',
  senhaEstadual: '',
  dataEntrada: new Date().toISOString().split('T')[0],
  dataSaida: '',
  isActive: true,
};

export function ClientFormDialog({ open, onOpenChange, client, onSave }: ClientFormDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [socios, setSocios] = useState<Socio[]>([{ nome: '', cpf: '', participacao: 100 }]);

  const isEditing = !!client;

  useEffect(() => {
    if (client) {
      setFormData({
        razaoSocial: client.razaoSocial,
        nomeFantasia: client.nomeFantasia,
        cnpj: client.cnpj,
        ccm: client.ccm || '',
        ie: client.ie || '',
        regimeTributario: client.regimeTributario,
        email: client.email,
        telefone: client.telefone,
        senhaPrefeitura: client.senhaPrefeitura || '',
        senhaEstadual: '',
        dataEntrada: client.dataEntrada || new Date().toISOString().split('T')[0],
        dataSaida: client.dataSaida || '',
        isActive: client.isActive ?? true,
      });
      setSocios(client.quadroSocietario.length > 0
        ? client.quadroSocietario
        : [{ nome: '', cpf: '', participacao: 100 }]
      );
    } else {
      setFormData(initialFormData);
      setSocios([{ nome: '', cpf: '', participacao: 100 }]);
    }
  }, [client, open]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSocio = () => {
    setSocios([...socios, { nome: '', cpf: '', participacao: 0 }]);
  };

  const removeSocio = (index: number) => {
    setSocios(socios.filter((_, i) => i !== index));
  };

  const updateSocio = (index: number, field: keyof Socio, value: string | number) => {
    const updated = [...socios];
    updated[index] = { ...updated[index], [field]: value };
    setSocios(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.razaoSocial) {
      toast.error('Razão Social é obrigatória');
      return;
    }

    if (!formData.cnpj) {
      toast.error('CNPJ é obrigatório');
      return;
    }

    if (!formData.regimeTributario) {
      toast.error('Selecione o Regime Tributário');
      return;
    }

    if (!formData.isActive && !formData.dataSaida) {
      toast.error('Data de saída é obrigatória para clientes inativos');
      return;
    }

    const clientData = {
      ...(client?.id && { id: client.id }),
      razaoSocial: formData.razaoSocial,
      nomeFantasia: formData.nomeFantasia || formData.razaoSocial,
      cnpj: formData.cnpj,
      ccm: formData.ccm || undefined,
      ie: formData.ie || undefined,
      regimeTributario: formData.regimeTributario as TaxRegime,
      email: formData.email,
      telefone: formData.telefone,
      senhaPrefeitura: formData.senhaPrefeitura || undefined,
      quadroSocietario: socios.filter(s => s.nome && s.cpf),
      dataEntrada: formData.dataEntrada,
      dataSaida: formData.dataSaida || undefined,
      isActive: formData.isActive,
    };

    onSave(clientData);
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-foreground">
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Dados Básicos</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="razaoSocial">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  placeholder="Razão Social da Empresa"
                  className="rounded-xl"
                  value={formData.razaoSocial}
                  onChange={(e) => handleInputChange('razaoSocial', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                <Input
                  id="nomeFantasia"
                  placeholder="Nome Fantasia"
                  className="rounded-xl"
                  value={formData.nomeFantasia}
                  onChange={(e) => handleInputChange('nomeFantasia', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  className="rounded-xl"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ccm">CCM</Label>
                <Input
                  id="ccm"
                  placeholder="Código Municipal"
                  className="rounded-xl"
                  value={formData.ccm}
                  onChange={(e) => handleInputChange('ccm', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ie">Inscrição Estadual</Label>
                <Input
                  id="ie"
                  placeholder="IE"
                  className="rounded-xl"
                  value={formData.ie}
                  onChange={(e) => handleInputChange('ie', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regimeTributario">Regime Tributário *</Label>
              <Select
                value={formData.regimeTributario}
                onValueChange={(value) => handleInputChange('regimeTributario', value)}
                required
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="simples">Simples Nacional</SelectItem>
                  <SelectItem value="presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Contato</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@empresa.com.br"
                  className="rounded-xl"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 99999-9999"
                  className="rounded-xl"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Status e Datas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Status e Datas</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="isActive">Status do Cliente</Label>
                <Select
                  value={formData.isActive ? 'true' : 'false'}
                  onValueChange={(value) => handleInputChange('isActive', (value === 'true') as any)}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataEntrada">Data de Entrada *</Label>
                <Input
                  id="dataEntrada"
                  type="date"
                  className="rounded-xl"
                  value={formData.dataEntrada}
                  onChange={(e) => handleInputChange('dataEntrada', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataSaida">Data de Saída</Label>
                <Input
                  id="dataSaida"
                  type="date"
                  className="rounded-xl"
                  value={formData.dataSaida}
                  onChange={(e) => handleInputChange('dataSaida', e.target.value)}
                  disabled={formData.isActive}
                />
              </div>
            </div>
          </div>


          {/* Senhas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Senhas de Acesso</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="senhaPrefeitura">Senha Prefeitura</Label>
                <Input
                  id="senhaPrefeitura"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-xl"
                  value={formData.senhaPrefeitura}
                  onChange={(e) => handleInputChange('senhaPrefeitura', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senhaEstadual">Senha SEFAZ</Label>
                <Input
                  id="senhaEstadual"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-xl"
                  value={formData.senhaEstadual}
                  onChange={(e) => handleInputChange('senhaEstadual', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quadro Societário */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-semibold text-foreground">Quadro Societário</h3>
              <Button type="button" variant="outline" size="sm" onClick={addSocio}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Sócio
              </Button>
            </div>

            <div className="space-y-4">
              {socios.map((socio, index) => (
                <div key={index} className="flex gap-4 items-end rounded-xl bg-muted p-4">
                  <div className="flex-1 space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={socio.nome}
                      onChange={(e) => updateSocio(index, 'nome', e.target.value)}
                      placeholder="Nome do sócio"
                      className="rounded-xl bg-card"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>CPF</Label>
                    <Input
                      value={socio.cpf}
                      onChange={(e) => updateSocio(index, 'cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      className="rounded-xl bg-card"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>%</Label>
                    <Input
                      type="number"
                      value={socio.participacao}
                      onChange={(e) => updateSocio(index, 'participacao', Number(e.target.value))}
                      className="rounded-xl bg-card"
                    />
                  </div>
                  {socios.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocio(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Salvar Alterações' : 'Salvar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
