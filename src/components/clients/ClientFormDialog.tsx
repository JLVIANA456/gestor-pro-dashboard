import { useState, useEffect } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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
import { useTechnicians } from '@/hooks/useTechnicians';
import { Checkbox } from '@/components/ui/checkbox';

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
  emails: string[];
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
  motivoSaida: string;

  isActive: boolean;
  responsavelDp: string;
  responsavelFiscal: string;
  responsavelContabil: string;
  responsavelFinanceiro: string;
  responsavelQualidade: string;
  responsavelEmpresa: string;
  hasEmployees: boolean;
  isServiceTaker: boolean;
  proLabore: string;
  regimeEscrituracao: 'caixa' | 'competencia' | '';
  dataAberturaCnpj: string;
  tipoAtividade: 'prestador' | 'comercio' | 'holding' | '';
  origemContabil: 'anterior' | 'jlviana' | '';
  statusBpo: 'contratado' | 'nao_contratado' | '';
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
  emails: [''],
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
  motivoSaida: '',

  isActive: true,
  responsavelDp: '',
  responsavelFiscal: '',
  responsavelContabil: '',
  responsavelFinanceiro: '',
  responsavelQualidade: '',
  responsavelEmpresa: '',
  hasEmployees: false,
  isServiceTaker: false,
  proLabore: '',
  regimeEscrituracao: '',
  dataAberturaCnpj: '',
  tipoAtividade: 'prestador',
  origemContabil: 'jlviana',
  statusBpo: 'nao_contratado',
};

export function ClientFormDialog({ open, onOpenChange, client, onSave }: ClientFormDialogProps) {
  const { technicians } = useTechnicians();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [socios, setSocios] = useState<Socio[]>([{ nome: '', cpf: '', participacao: 100 }]);
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);

  const fetchCnpjData = async () => {
    const cleanCnpj = formData.cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      toast.error('CNPJ inválido para consulta (deve ter 14 dígitos)');
      return;
    }

    try {
      setIsFetchingCnpj(true);
      // Using JSONP or a simple fetch if possible. Note: free tier might have rate limits or CORS.
      // ReceitaWS free tier often has CORS. We might need a proxy but let's try direct fetch first.
      const response = await fetch(`https://cors-anywhere.herokuapp.com/https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
      // If the proxy is not available, we can try direct fetch or mention it. 
      // Actually, for better reliability without a proxy, some people use other free APIs or just handle the error.
      // Let's try the direct one first, as some systems have internal proxies.
      
      const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
      const data = await res.json();

      if (data.status === 'ERROR') {
        toast.error(data.message || 'Erro ao consultar CNPJ');
        return;
      }

      setFormData(prev => ({
        ...prev,
        razaoSocial: data.nome || prev.razaoSocial,
        nomeFantasia: data.fantasia || data.nome || prev.nomeFantasia,
        dataEntrada: data.abertura ? data.abertura.split('/').reverse().join('-') : prev.dataEntrada,
      }));

      if (data.qsa && data.qsa.length > 0) {
        setSocios(data.qsa.map((s: any) => ({
          nome: s.nome,
          cpf: '', // API doesn't provide full CPF for security
          participacao: 0
        })));
      }

      toast.success('Dados obtidos com sucesso!');
    } catch (error) {
      console.error('Erro CNPJ:', error);
      toast.error('Erro ao consultar CNPJ. Limite de requisições excedido ou problema de conexão.');
    } finally {
      setIsFetchingCnpj(false);
    }
  };

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
        emails: client.email ? client.email.split(',').map(e => e.trim()) : [''],
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
        motivoSaida: client.motivoSaida || '',

        isActive: client.isActive ?? true,
        responsavelDp: client.responsavelDp || '',
        responsavelFiscal: client.responsavelFiscal || '',
        responsavelContabil: client.responsavelContabil || '',
        responsavelFinanceiro: client.responsavelFinanceiro || '',
        responsavelQualidade: client.responsavelQualidade || '',
        responsavelEmpresa: client.responsavelEmpresa || '',
        hasEmployees: client.hasEmployees ?? false,
        isServiceTaker: client.isServiceTaker ?? false,
        proLabore: client.proLabore || '',
        regimeEscrituracao: client.regimeEscrituracao || '',
        dataAberturaCnpj: (client as any).data_abertura_cnpj || '',
        tipoAtividade: (client as any).tipo_atividade || 'prestador',
        origemContabil: (client as any).origem_contabil || 'jlviana',
        statusBpo: (client as any).status_bpo || 'nao_contratado',
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
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Auto-update status based on exit date
      if (field === 'dataSaida') {
        if (value) {
          newData.isActive = false;
        } else {
          newData.isActive = true;
          newData.motivoSaida = '';
        }
      }

      // Auto-clear exit date if set to active manually
      if (field === 'isActive' && value === true) {
        newData.dataSaida = '';
        newData.motivoSaida = '';
      }

      return newData;
    });
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

  const addEmail = () => {
    handleInputChange('emails', [...formData.emails, '']);
  };

  const removeEmail = (index: number) => {
    if (formData.emails.length > 1) {
      handleInputChange('emails', formData.emails.filter((_, i) => i !== index));
    } else {
      handleInputChange('emails', ['']);
    }
  };

  const updateEmail = (index: number, value: string) => {
    const updated = [...formData.emails];
    updated[index] = value;
    handleInputChange('emails', updated);
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

    if (!formData.isActive && !formData.motivoSaida) {
      toast.error('Motivo da saída é obrigatório para clientes inativos');
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
      email: formData.emails.filter(e => e.trim() !== '').join(', '),
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
      motivoSaida: formData.motivoSaida || undefined,

      isActive: formData.isActive,
      responsavelDp: formData.responsavelDp || undefined,
      responsavelFiscal: formData.responsavelFiscal || undefined,
      responsavelContabil: formData.responsavelContabil || undefined,
      responsavelFinanceiro: formData.responsavelFinanceiro || undefined,
      responsavelQualidade: formData.responsavelQualidade || undefined,
      responsavelEmpresa: formData.responsavelEmpresa || undefined,
      hasEmployees: formData.hasEmployees,
      isServiceTaker: formData.isServiceTaker,
      proLabore: formData.proLabore || undefined,
      regimeEscrituracao: formData.regimeEscrituracao as any || undefined,
      dataAberturaCnpj: formData.dataAberturaCnpj || undefined,
      tipoAtividade: formData.tipoAtividade || undefined,
      origemContabil: formData.origemContabil || undefined,
      statusBpo: formData.statusBpo || undefined,
    };

    onSave(clientData);
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-[2.5rem] border-none shadow-2xl bg-card">
        <DialogHeader className="p-8 pb-4 bg-primary/[0.02] border-b border-border/10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-light text-foreground">
                {isEditing ? 'Editar Registro do' : 'Cadastrar Novo'} <span className="font-bold text-primary">Cliente</span>
              </DialogTitle>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground/60 mt-1">
                Gestão completa de dados cadastrais e credenciais fiscais
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pt-6 space-y-12">
          {/* Seção 1: Identificação Corporativa */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-3">
               <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <span className="text-[10px] font-bold">01</span>
               </div>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Identificação Corporativa</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Razão Social *</Label>
                <Input
                  placeholder="Nome oficial da empresa"
                  className="rounded-2xl h-14 font-light text-base border-border/40 bg-muted/5 focus-visible:ring-primary/20 transition-all"
                  value={formData.razaoSocial}
                  onChange={(e) => handleInputChange('razaoSocial', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Fantasia</Label>
                <Input
                  placeholder="Nome comercial"
                  className="rounded-2xl h-14 font-light text-base border-border/40 bg-muted/5 focus-visible:ring-primary/20 transition-all"
                  value={formData.nomeFantasia}
                  onChange={(e) => handleInputChange('nomeFantasia', e.target.value)}
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Responsável na Empresa</Label>
                <Input
                  placeholder="Nome do contato principal"
                  className="rounded-2xl h-14 font-light text-base border-border/40 bg-muted/5 focus-visible:ring-primary/20 transition-all"
                  value={formData.responsavelEmpresa}
                  onChange={(e) => handleInputChange('responsavelEmpresa', e.target.value)}
                />
              </div>
            </div>
            
            <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 group cursor-pointer">
                  <Checkbox 
                    id="hasEmployees" 
                    checked={formData.hasEmployees}
                    onCheckedChange={(checked) => handleInputChange('hasEmployees', checked === true)}
                    className="h-5 w-5 rounded-lg border-2 border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="hasEmployees" className="text-sm font-medium text-slate-600 cursor-pointer group-hover:text-primary transition-colors">Possui Funcionários / Folha</Label>
                </div>
                <div className="flex items-center space-x-3 group cursor-pointer">
                  <Checkbox 
                    id="isServiceTaker" 
                    checked={formData.isServiceTaker}
                    onCheckedChange={(checked) => handleInputChange('isServiceTaker', checked === true)}
                    className="h-5 w-5 rounded-lg border-2 border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="isServiceTaker" className="text-sm font-medium text-slate-600 cursor-pointer group-hover:text-primary transition-colors">Tomador de Serviços (Retenções)</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Pro Labore</Label>
                  <Input
                    placeholder="Valor ou detalhes..."
                    className="h-12 rounded-xl bg-white border-slate-200 text-sm"
                    value={formData.proLabore}
                    onChange={(e) => handleInputChange('proLabore', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Escrituração</Label>
                  <Select
                    value={formData.regimeEscrituracao}
                    onValueChange={(value) => handleInputChange('regimeEscrituracao', value)}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200 text-sm">
                      <SelectValue placeholder="Competência/Caixa" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="competencia">Competência</SelectItem>
                      <SelectItem value="caixa">Caixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">CNPJ / CPF *</Label>
                <div className="relative group">
                  <Input
                    placeholder="00.000.000/0000-00"
                    className="rounded-2xl h-14 font-mono font-normal text-base border-border/40 bg-muted/5 focus-visible:ring-primary/20 transition-all pr-14"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isFetchingCnpj}
                    onClick={fetchCnpjData}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-primary hover:bg-primary/10 rounded-xl transition-all"
                  >
                    {isFetchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Regime Tributário *</Label>
                <Select
                  value={formData.regimeTributario}
                  onValueChange={(value) => handleInputChange('regimeTributario', value)}
                >
                  <SelectTrigger className="rounded-2xl h-14 font-light text-base border-border/40 bg-muted/5 focus-visible:ring-primary/20 transition-all">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border rounded-2xl">
                    <SelectItem value="simples" className="font-light py-3">Simples Nacional</SelectItem>
                    <SelectItem value="presumido" className="font-light py-3">Lucro Presumido</SelectItem>
                    <SelectItem value="real" className="font-light py-3">Lucro Real</SelectItem>
                    <SelectItem value="domestico" className="font-light py-3">Empregador Doméstico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data de Saída</Label>
                <Input
                  type="date"
                  className="rounded-2xl h-14 font-light text-base border-border/40 bg-muted/5 focus-visible:ring-primary/20 transition-all"
                  value={formData.dataSaida}
                  onChange={(e) => handleInputChange('dataSaida', e.target.value)}
                />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data Abertura CNPJ</Label>
                <Input
                  type="date"
                  className="rounded-2xl h-14 font-light text-base border-border/40 bg-muted/5 focus-visible:ring-primary/20 transition-all"
                  value={formData.dataAberturaCnpj}
                  onChange={(e) => handleInputChange('dataAberturaCnpj', e.target.value)}
                />
              </div>
            </div>

            {formData.dataSaida && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-bold text-destructive uppercase tracking-widest ml-1">Motivo da Saída / Baixa *</Label>
                  <Input
                    placeholder="Descreva o motivo do cancelamento ou baixa..."
                    className="rounded-2xl h-14 font-light text-base border-destructive/20 bg-destructive/[0.02] focus-visible:ring-destructive/10 transition-all"
                    value={formData.motivoSaida}
                    onChange={(e) => handleInputChange('motivoSaida', e.target.value)}
                    required={!formData.isActive}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Seção 2: Dados Fiscais & Senhas */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-3">
               <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <span className="text-[10px] font-bold">02</span>
               </div>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Fiscal & Credenciais</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div className="p-6 rounded-[2.2rem] bg-indigo-50/30 border border-indigo-100/50 space-y-5">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Prefeitura</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">CCM</Label>
                    <Input value={formData.ccm} onChange={(e) => handleInputChange('ccm', e.target.value)} className="h-11 text-sm rounded-xl border-slate-200/60 font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Senha Prefeitura</Label>
                    <Input type="password" value={formData.senhaPrefeitura} onChange={(e) => handleInputChange('senhaPrefeitura', e.target.value)} className="h-11 text-sm rounded-xl border-slate-200/60 font-medium" />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-[2.2rem] bg-emerald-50/30 border border-emerald-100/50 space-y-5">
                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Atividade & Estado</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Atividade</Label>
                    <Select value={formData.tipoAtividade} onValueChange={(v) => handleInputChange('tipoAtividade', v)}>
                      <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200/60 text-[10px] font-bold uppercase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="prestador" className="text-[10px] uppercase font-bold">Prestador de serviços</SelectItem>
                        <SelectItem value="comercio" className="text-[10px] uppercase font-bold">Comércio</SelectItem>
                        <SelectItem value="holding" className="text-[10px] uppercase font-bold">Holding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inscr. Estadual (IE)</Label>
                    <Input value={formData.ie} onChange={(e) => handleInputChange('ie', e.target.value)} className="h-11 text-sm rounded-xl border-slate-200/60 font-medium" />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-[2.2rem] bg-amber-50/30 border border-amber-100/50 space-y-5">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Federal / Simples</h4>
                <div className="space-y-2">
                  <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Código / Senha</Label>
                  <Input type="password" value={formData.simplesNacionalSenha} onChange={(e) => handleInputChange('simplesNacionalSenha', e.target.value)} className="h-11 text-sm rounded-xl border-slate-200/60 font-medium" />
                </div>
                <div className="pt-2">
                   <p className="text-[9px] text-amber-600/60 font-medium leading-relaxed italic">Atalho para acesso direto ao PGDAS e consultas.</p>
                </div>
              </div>

              <div className="p-6 rounded-[2.2rem] bg-slate-50 border border-slate-200/60 space-y-5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contabil & BPO</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Origem Contábil</Label>
                    <Select value={formData.origemContabil} onValueChange={(v) => handleInputChange('origemContabil', v)}>
                      <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200/60 text-[10px] font-bold uppercase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="anterior" className="text-[10px] uppercase font-bold">Contabilidade anterior</SelectItem>
                        <SelectItem value="jlviana" className="text-[10px] uppercase font-bold">Empresa aberta pela JLVIANA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status BPO</Label>
                    <Select value={formData.statusBpo} onValueChange={(v) => handleInputChange('statusBpo', v)}>
                      <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200/60 text-[10px] font-bold uppercase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="contratado" className="text-[10px] uppercase font-bold">Contratado</SelectItem>
                        <SelectItem value="nao_contratado" className="text-[10px] uppercase font-bold">Não contratado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Certificado Digital */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-3">
               <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <span className="text-[10px] font-bold">03</span>
               </div>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Certificado Digital</h3>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 p-8 rounded-[2.5rem] bg-primary/[0.03] border border-primary/10 shadow-inner">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest ml-1">Tipo de Certificado</Label>
                <Select value={formData.certificadoDigitalTipo} onValueChange={(v) => handleInputChange('certificadoDigitalTipo', v)}>
                  <SelectTrigger className="h-14 rounded-2xl text-base border-primary/10 bg-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="A1">A1 (Arquivo)</SelectItem>
                    <SelectItem value="A3-TOKEN">A3 (Token)</SelectItem>
                    <SelectItem value="A3-CARTAO">A3 (Cartão)</SelectItem>
                    <SelectItem value="Nuvem">Nuvem (BirdId/SafeId)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest ml-1">Vencimento</Label>
                <Input type="date" className="h-14 rounded-2xl text-base border-primary/10 bg-white" value={formData.certificadoDigitalVencimento} onChange={(e) => handleInputChange('certificadoDigitalVencimento', e.target.value)} />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold text-primary/60 uppercase tracking-widest ml-1">Senha do Certificado</Label>
                <Input type="password" placeholder="••••••••" className="h-14 rounded-2xl text-base border-primary/10 bg-white" value={formData.certificadoDigitalSenha} onChange={(e) => handleInputChange('certificadoDigitalSenha', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Seção 4: Contato & Status */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-3">
               <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <span className="text-[10px] font-bold">04</span>
               </div>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Comunicação & Status</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Canais de E-mail *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addEmail}
                    className="text-primary hover:bg-primary/5 rounded-xl h-8 px-3 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Novo Canal
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {formData.emails.map((email, index) => (
                    <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                      <div className="relative flex-1">
                        <Input
                          type="email"
                          placeholder="empresa@exemplo.com"
                          className="rounded-2xl h-14 font-light text-base border-border/40 bg-muted/5 focus-visible:ring-primary/20 transition-all pr-12"
                          value={email}
                          onChange={(e) => updateEmail(index, e.target.value)}
                          required={index === 0}
                        />
                        {formData.emails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEmail(index)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Telefone / WhatsApp</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    className="rounded-2xl h-14 font-light text-base border-border/40 bg-muted/5"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', e.target.value)}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Status Operacional</Label>
                  <Select
                    value={formData.isActive ? 'true' : 'false'}
                    onValueChange={(value) => handleInputChange('isActive', (value === 'true') as any)}
                  >
                    <SelectTrigger className={cn(
                      "rounded-2xl h-14 font-bold text-base transition-all border-none",
                      formData.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="true" className="font-bold text-emerald-600 py-3">Ativo</SelectItem>
                      <SelectItem value="false" className="font-bold text-red-600 py-3">Inativo / Encerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 5: Responsáveis Técnicos */}
          <div className="space-y-6">
             <div className="flex items-center gap-3 border-b border-border/40 pb-3">
               <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <span className="text-[10px] font-bold">05</span>
               </div>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Responsáveis Técnicos</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-5 p-6 rounded-[2.5rem] bg-slate-50/50 border border-slate-200/40">
              <div className="space-y-2">
                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dep. Pessoal</Label>
                <Select value={formData.responsavelDp} onValueChange={(v) => handleInputChange('responsavelDp', v)}>
                  <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {technicians.filter(t => t.department === 'dp').map(tech => (
                      <SelectItem key={tech.id} value={tech.name}>{tech.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dep. Fiscal</Label>
                <Select value={formData.responsavelFiscal} onValueChange={(v) => handleInputChange('responsavelFiscal', v)}>
                  <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {technicians.filter(t => t.department === 'fiscal').map(tech => (
                      <SelectItem key={tech.id} value={tech.name}>{tech.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dep. Contábil</Label>
                <Select value={formData.responsavelContabil} onValueChange={(v) => handleInputChange('responsavelContabil', v)}>
                  <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {technicians.filter(t => t.department === 'contabil').map(tech => (
                      <SelectItem key={tech.id} value={tech.name}>{tech.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Financeiro</Label>
                <Select value={formData.responsavelFinanceiro} onValueChange={(v) => handleInputChange('responsavelFinanceiro', v)}>
                  <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {technicians.filter(t => t.department === 'financeiro').length > 0 ? (
                      technicians.filter(t => t.department === 'financeiro').map(tech => (
                        <SelectItem key={tech.id} value={tech.name}>{tech.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Não cadastrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Qualidade</Label>
                <Select value={formData.responsavelQualidade} onValueChange={(v) => handleInputChange('responsavelQualidade', v)}>
                  <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {technicians.filter(t => t.department === 'qualidade').map(tech => (
                      <SelectItem key={tech.id} value={tech.name}>{tech.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Seção 6: Sócios */}
          <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
               <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <span className="text-[10px] font-bold">06</span>
                  </div>
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Quadro Societário</h3>
               </div>
               <Button type="button" variant="ghost" size="sm" onClick={addSocio} className="text-primary hover:bg-primary/5 rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Sócio
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {socios.map((socio, index) => (
                <div key={index} className="group relative flex flex-col md:flex-row gap-6 items-start md:items-end rounded-[2.5rem] bg-muted/20 p-8 border border-border/20 transition-all hover:bg-muted/40 hover:border-primary/20">
                  <div className="flex-1 space-y-2.5 w-full">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Sócio</Label>
                    <Input
                      value={socio.nome}
                      onChange={(e) => updateSocio(index, 'nome', e.target.value)}
                      placeholder="Nome completo do sócio..."
                      className="rounded-2xl h-14 bg-white border-slate-200 text-base"
                    />
                  </div>
                  <div className="w-full md:w-64 space-y-2.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF</Label>
                    <Input
                      value={socio.cpf}
                      onChange={(e) => updateSocio(index, 'cpf', e.target.value)}
                      placeholder="000.000.000-00"
                      className="rounded-2xl h-14 bg-white border-slate-200 font-mono text-base"
                    />
                  </div>
                  <div className="w-full md:w-32 space-y-2.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quota %</Label>
                    <Input
                      type="number"
                      value={socio.participacao}
                      onChange={(e) => updateSocio(index, 'participacao', Number(e.target.value))}
                      className="rounded-2xl h-14 bg-white border-slate-200 text-center font-bold text-base"
                    />
                  </div>
                  {socios.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSocio(index)}
                      className="h-14 w-14 text-slate-300 hover:text-destructive hover:bg-destructive/5 rounded-2xl transition-all mb-[1px]"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-8 bg-slate-50 border-t border-border/10 flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl px-10 h-14 text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-slate-100 transition-all">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            className="rounded-2xl px-12 h-14 bg-primary text-white shadow-xl shadow-primary/20 font-bold uppercase text-[10px] tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isEditing ? 'Salvar Alterações' : 'Concluir Cadastro'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
