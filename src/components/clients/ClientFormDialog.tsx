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
  ccmSenha: string;
  ie: string;
  ieSenha: string;
  regimeTributario: TaxRegime | '';
  email: string;
  telefone: string;
  senhaPrefeitura: string;
  sefazSenha: string;
  simplesNacionalSenha: string;
  ecacCodigoAcesso: string;
  ecacSenha: string;
  certificadoDigitalTipo: string;
  certificadoDigitalVencimento: string;
  certificadoDigitalSenha: string;
  dataEntrada: string;
  dataSaida: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  ccm: '',
  ccmSenha: '',
  ie: '',
  ieSenha: '',
  regimeTributario: '',
  email: '',
  telefone: '',
  senhaPrefeitura: '',
  sefazSenha: '',
  simplesNacionalSenha: '',
  ecacCodigoAcesso: '',
  ecacSenha: '',
  certificadoDigitalTipo: '',
  certificadoDigitalVencimento: '',
  certificadoDigitalSenha: '',
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
        ccmSenha: client.ccmSenha || '',
        ie: client.ie || '',
        ieSenha: client.ieSenha || '',
        regimeTributario: client.regimeTributario,
        email: client.email,
        telefone: client.telefone,
        senhaPrefeitura: client.senhaPrefeitura || '',
        sefazSenha: client.sefazSenha || '',
        simplesNacionalSenha: client.simplesNacionalSenha || '',
        ecacCodigoAcesso: client.ecacCodigoAcesso || '',
        ecacSenha: client.ecacSenha || '',
        certificadoDigitalTipo: client.certificadoDigitalTipo || '',
        certificadoDigitalVencimento: client.certificadoDigitalVencimento || '',
        certificadoDigitalSenha: client.certificadoDigitalSenha || '',
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

  const handleInputChange = (field: keyof FormData, value: any) => {
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
      ccmSenha: formData.ccmSenha || undefined,
      ie: formData.ie || undefined,
      ieSenha: formData.ieSenha || undefined,
      regimeTributario: formData.regimeTributario as TaxRegime,
      email: formData.email,
      telefone: formData.telefone,
      senhaPrefeitura: formData.senhaPrefeitura || undefined,
      sefazSenha: formData.sefazSenha || undefined,
      simplesNacionalSenha: formData.simplesNacionalSenha || undefined,
      ecacCodigoAcesso: formData.ecacCodigoAcesso || undefined,
      ecacSenha: formData.ecacSenha || undefined,
      certificadoDigitalTipo: formData.certificadoDigitalTipo || undefined,
      certificadoDigitalVencimento: formData.certificadoDigitalVencimento || undefined,
      certificadoDigitalSenha: formData.certificadoDigitalSenha || undefined,
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
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light text-foreground">
            {isEditing ? 'Editar Registro do Cliente' : 'Cadastrar Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-6">
          {/* Seção 1: Identificação Corporativa */}
          <div className="space-y-6">
            <h3 className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 pb-2">1. Identificação Corporativa</h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-normal">Razão Social *</Label>
                <Input
                  placeholder="Nome oficial da empresa"
                  className="rounded-xl h-11 font-light"
                  value={formData.razaoSocial}
                  onChange={(e) => handleInputChange('razaoSocial', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-normal">Nome Fantasia</Label>
                <Input
                  placeholder="Nome comercial"
                  className="rounded-xl h-11 font-light"
                  value={formData.nomeFantasia}
                  onChange={(e) => handleInputChange('nomeFantasia', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs font-normal">CNPJ / CPF *</Label>
                <Input
                  placeholder="00.000.000/0000-00"
                  className="rounded-xl h-11 font-light"
                  value={formData.cnpj}
                  onChange={(e) => handleInputChange('cnpj', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-normal">Regime Tributário *</Label>
                <Select
                  value={formData.regimeTributario}
                  onValueChange={(value) => handleInputChange('regimeTributario', value)}
                >
                  <SelectTrigger className="rounded-xl h-11 font-light">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="simples" className="font-light">Simples Nacional</SelectItem>
                    <SelectItem value="presumido" className="font-light">Lucro Presumido</SelectItem>
                    <SelectItem value="real" className="font-light">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-normal">Data de Entrada *</Label>
                <Input
                  type="date"
                  className="rounded-xl h-11 font-light"
                  value={formData.dataEntrada}
                  onChange={(e) => handleInputChange('dataEntrada', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Dados Fiscais & Senhas */}
          <div className="space-y-6">
            <h3 className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 pb-2">2. Fiscal & Credenciais</h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Prefeitura</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[10px]">CCM</Label>
                    <Input value={formData.ccm} onChange={(e) => handleInputChange('ccm', e.target.value)} className="h-9 text-sm rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px]">Senha Prefeitura</Label>
                    <Input type="password" value={formData.senhaPrefeitura} onChange={(e) => handleInputChange('senhaPrefeitura', e.target.value)} className="h-9 text-sm rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Estado (SEFAZ)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[10px]">Inscr. Estadual (IE)</Label>
                    <Input value={formData.ie} onChange={(e) => handleInputChange('ie', e.target.value)} className="h-9 text-sm rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px]">Senha SEFAZ / Posto</Label>
                    <Input type="password" value={formData.sefazSenha} onChange={(e) => handleInputChange('sefazSenha', e.target.value)} className="h-9 text-sm rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Simples Nacional</h4>
                <div className="space-y-2">
                  <Label className="text-[10px]">Código de Acesso / Senha</Label>
                  <Input type="password" value={formData.simplesNacionalSenha} onChange={(e) => handleInputChange('simplesNacionalSenha', e.target.value)} className="h-9 text-sm rounded-lg" />
                </div>
              </div>

              <div className="md:col-span-2 p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-4">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Portal e-CAC (Receita Federal)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[10px]">Código de Acesso</Label>
                    <Input value={formData.ecacCodigoAcesso} onChange={(e) => handleInputChange('ecacCodigoAcesso', e.target.value)} className="h-9 text-sm rounded-lg" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px]">Senha e-CAC</Label>
                    <Input type="password" value={formData.ecacSenha} onChange={(e) => handleInputChange('ecacSenha', e.target.value)} className="h-9 text-sm rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Certificado Digital */}
          <div className="space-y-6">
            <h3 className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 pb-2">3. Certificado Digital</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 p-4 rounded-2xl bg-primary/[0.02] border border-primary/10">
              <div className="space-y-2">
                <Label className="text-xs font-normal">Tipo</Label>
                <Select value={formData.certificadoDigitalTipo} onValueChange={(v) => handleInputChange('certificadoDigitalTipo', v)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 (Arquivo)</SelectItem>
                    <SelectItem value="A3-TOKEN">A3 (Token)</SelectItem>
                    <SelectItem value="A3-CARTAO">A3 (Cartão)</SelectItem>
                    <SelectItem value="Nuvem">Nuvem (BirdId/SafeId)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-normal">Data de Vencimento</Label>
                <Input type="date" className="h-10 rounded-xl font-light" value={formData.certificadoDigitalVencimento} onChange={(e) => handleInputChange('certificadoDigitalVencimento', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-normal">Senha do Certificado</Label>
                <Input type="password" placeholder="••••••••" className="h-10 rounded-xl font-light" value={formData.certificadoDigitalSenha} onChange={(e) => handleInputChange('certificadoDigitalSenha', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Seção 4: Contato & Status */}
          <div className="space-y-6">
            <h3 className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 pb-2">4. Comunicação & Status</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-xs font-normal">E-mail Principal *</Label>
                <Input
                  type="email"
                  placeholder="empresa@exemplo.com"
                  className="rounded-xl h-11 font-light"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-normal">Telefone / WhatsApp</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  className="rounded-xl h-11 font-light"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-normal">Status Operacional</Label>
                <Select
                  value={formData.isActive ? 'true' : 'false'}
                  onValueChange={(value) => handleInputChange('isActive', (value === 'true') as any)}
                >
                  <SelectTrigger className="rounded-xl h-11 font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo / Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção 5: Sócios */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h3 className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em]">5. Quadro Societário</h3>
              <Button type="button" variant="ghost" size="sm" onClick={addSocio} className="text-primary hover:text-primary hover:bg-primary/5 rounded-xl h-8 px-3 text-[10px] font-bold uppercase tracking-widest">
                <Plus className="mr-2 h-3 w-3" />
                Adicionar Sócio
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {socios.map((socio, index) => (
                <div key={index} className="group relative flex gap-4 items-end rounded-2xl bg-muted/30 p-5 border border-border/50 transition-all hover:bg-muted/50">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[10px] uppercase font-normal text-muted-foreground">Nome do Sócio</Label>
                    <Input
                      value={socio.nome}
                      onChange={(e) => updateSocio(index, 'nome', e.target.value)}
                      placeholder="Nome completo"
                      className="rounded-xl bg-card border-border/50"
                    />
                  </div>
                  <div className="w-48 space-y-2">
                    <Label className="text-[10px] uppercase font-normal text-muted-foreground">CPF</Label>
                    <Input
                      value={socio.cpf}
                      onChange={(e) => updateSocio(index, 'cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      className="rounded-xl bg-card border-border/50"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label className="text-[10px] uppercase font-normal text-muted-foreground">Quota %</Label>
                    <Input
                      type="number"
                      value={socio.participacao}
                      onChange={(e) => updateSocio(index, 'participacao', Number(e.target.value))}
                      className="rounded-xl bg-card border-border/50"
                    />
                  </div>
                  {socios.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocio(index)}
                      className="h-10 w-10 text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-8 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl px-8 h-12 font-light text-sm">
              Cancelar
            </Button>
            <Button type="submit" className="rounded-xl px-8 h-12 font-light shadow-lg shadow-primary/20">
              {isEditing ? 'Atualizar Registro' : 'Finalizar Cadastro'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
