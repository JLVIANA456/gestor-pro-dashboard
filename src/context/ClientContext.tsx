import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TaskGeneratorService } from '@/services/taskGeneratorService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export type TaxRegime = 'simples' | 'presumido' | 'real' | 'domestico';

export interface Socio {
  nome: string;
  cpf: string;
  participacao: number;
}

export interface Client {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  ccm?: string;
  ccmSenha?: string;
  ie?: string;
  ieSenha?: string;
  regimeTributario: TaxRegime;
  email: string;
  telefone: string;
  senhaPrefeitura?: string;
  sefazSenha?: string;
  simplesNacionalSenha?: string;
  ecacCodigoAcesso?: string;
  ecacSenha?: string;
  certificadoDigitalTipo?: string;
  certificadoDigitalVencimento?: string;
  certificadoDigitalSenha?: string;
  quadroSocietario: Socio[];
  dataEntrada: string;
  dataSaida?: string;
  motivoSaida?: string;
  isActive: boolean;
  inactivatedAt?: string;
  inactivationReason?: string;
  inactivationDetails?: string;
  responsavelDp?: string;
  responsavelFiscal?: string;
  responsavelContabil?: string;
  responsavelFinanceiro?: string;
  responsavelQualidade?: string;
  responsavelEmpresa?: string;
  hasEmployees: boolean;
  isServiceTaker: boolean;
  proLabore?: string;
  regimeEscrituracao?: 'caixa' | 'competencia';
  dataAberturaCnpj?: string;
  tipoAtividade?: string;
  origemContabil?: string;
  statusBpo?: string;
}

interface DbClient {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  ccm: string | null;
  ccm_senha: string | null;
  ie: string | null;
  ie_senha: string | null;
  regime_tributario: TaxRegime;
  email: string;
  telefone: string;
  senha_prefeitura: string | null;
  sefaz_senha: string | null;
  simples_nacional_senha: string | null;
  ecac_codigo_acesso: string | null;
  ecac_senha: string | null;
  certificado_digital_tipo: string | null;
  certificado_digital_vencimento: string | null;
  certificado_digital_senha: string | null;
  quadro_societario: Socio[];
  data_entrada: string;
  data_saida: string | null;
  motivo_saida: string | null;
  is_active: boolean;
  inactivated_at: string | null;
  inactivation_reason: string | null;
  inactivation_details: string | null;
  responsavel_dp: string | null;
  responsavel_fiscal: string | null;
  responsavel_contabil: string | null;
  responsavel_financeiro: string | null;
  responsavel_qualidade: string | null;
  responsavel_empresa: string | null;
  has_employees: boolean;
  is_service_taker: boolean;
  pro_labore: string | null;
  regime_escrituracao: 'caixa' | 'competencia' | null;
  data_abertura_cnpj: string | null;
  tipo_atividade: string | null;
  origem_contabil: string | null;
  status_bpo: string | null;
  created_at: string;
  updated_at: string;
}

const mapDbToClient = (db: DbClient): Client => ({
  id: db.id,
  razaoSocial: db.razao_social,
  nomeFantasia: db.nome_fantasia,
  cnpj: db.cnpj,
  ccm: db.ccm ?? undefined,
  ccmSenha: db.ccm_senha ?? undefined,
  ie: db.ie ?? undefined,
  ieSenha: db.ie_senha ?? undefined,
  regimeTributario: db.regime_tributario,
  email: db.email,
  telefone: db.telefone,
  senhaPrefeitura: db.senha_prefeitura ?? undefined,
  sefazSenha: db.sefaz_senha ?? undefined,
  simplesNacionalSenha: db.simples_nacional_senha ?? undefined,
  ecacCodigoAcesso: db.ecac_codigo_acesso ?? undefined,
  ecacSenha: db.ecac_senha ?? undefined,
  certificadoDigitalTipo: db.certificado_digital_tipo ?? undefined,
  certificadoDigitalVencimento: db.certificado_digital_vencimento ?? undefined,
  certificadoDigitalSenha: db.certificado_digital_senha ?? undefined,
  quadroSocietario: db.quadro_societario ?? [],
  dataEntrada: db.data_entrada,
  dataSaida: db.data_saida ?? undefined,
  motivoSaida: db.motivo_saida ?? undefined,
  isActive: db.is_active ?? true,
  inactivatedAt: db.inactivated_at ?? undefined,
  inactivationReason: db.inactivation_reason ?? undefined,
  inactivationDetails: db.inactivation_details ?? undefined,
  responsavelDp: db.responsavel_dp ?? undefined,
  responsavelFiscal: db.responsavel_fiscal ?? undefined,
  responsavelContabil: db.responsavel_contabil ?? undefined,
  responsavelFinanceiro: db.responsavel_financeiro ?? undefined,
  responsavelQualidade: db.responsavel_qualidade ?? undefined,
  responsavelEmpresa: db.responsavel_empresa ?? undefined,
  hasEmployees: db.has_employees ?? false,
  isServiceTaker: db.is_service_taker ?? false,
  proLabore: db.pro_labore ?? undefined,
  regimeEscrituracao: db.regime_escrituracao ?? undefined,
  dataAberturaCnpj: db.data_abertura_cnpj ?? undefined,
  tipoAtividade: db.tipo_atividade ?? undefined,
  origemContabil: db.origem_contabil ?? undefined,
  statusBpo: db.status_bpo ?? undefined,
});

const mapClientToDb = (client: Omit<Client, 'id'> & { id?: string }) => ({
  razao_social: client.razaoSocial,
  nome_fantasia: client.nomeFantasia || client.razaoSocial,
  cnpj: client.cnpj,
  ccm: client.ccm || null,
  ccm_senha: client.ccmSenha || null,
  ie: client.ie || null,
  ie_senha: client.ieSenha || null,
  regime_tributario: client.regimeTributario,
  email: client.email,
  telefone: client.telefone,
  senha_prefeitura: client.senhaPrefeitura || null,
  sefaz_senha: client.sefazSenha || null,
  simples_nacional_senha: client.simplesNacionalSenha || null,
  ecac_codigo_acesso: client.ecacCodigoAcesso || null,
  ecac_senha: client.ecacSenha || null,
  certificado_digital_tipo: client.certificadoDigitalTipo || null,
  certificado_digital_vencimento: client.certificadoDigitalVencimento || null,
  certificado_digital_senha: client.certificadoDigitalSenha || null,
  quadro_societario: client.quadroSocietario as unknown as Record<string, unknown>[],
  data_entrada: client.dataEntrada || new Date().toISOString().split('T')[0],
  data_saida: (client.dataSaida && client.dataSaida.trim() !== '') ? client.dataSaida : null,
  motivo_saida: (client.motivoSaida && client.motivoSaida.trim() !== '') ? client.motivoSaida : null,
  is_active: client.isActive === undefined ? true : client.isActive,
  inactivated_at: client.inactivatedAt || null,
  inactivation_reason: client.inactivationReason || null,
  inactivation_details: client.inactivationDetails || null,
  responsavel_dp: client.responsavelDp || null,
  responsavel_fiscal: client.responsavelFiscal || null,
  responsavel_contabil: client.responsavelContabil || null,
  responsavel_financeiro: client.responsavelFinanceiro || null,
  responsavel_qualidade: client.responsavelQualidade || null,
  responsavel_empresa: client.responsavelEmpresa || null,
  has_employees: client.hasEmployees ?? false,
  is_service_taker: client.isServiceTaker ?? false,
  pro_labore: client.proLabore || null,
  regime_escrituracao: client.regimeEscrituracao || null,
  data_abertura_cnpj: client.dataAberturaCnpj || null,
  tipo_atividade: client.tipoAtividade || null,
  origem_contabil: client.origemContabil || null,
  status_bpo: client.statusBpo || null,
});

export interface ClientStats {
  total: number;
  simples: number;
  presumido: number;
  real: number;
  domestico: number;
  ativos: number;
  entradasMes: number;
  saidasMes: number;
  recentExits: Array<{
    id: string;
    nome: string;
    motivo: string;
    dataSaida: string;
  }>;
}

interface ClientContextType {
  clients: Client[];
  stats: ClientStats;
  loading: boolean;
  fetchClients: () => Promise<void>;
  createClient: (clientData: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (id: string, clientData: Omit<Client, 'id'>) => Promise<Client>;
  deleteClient: (id: string, clientName: string) => Promise<void>;
  inactivateClient: (id: string, reason: string, details?: string) => Promise<Client>;
  reactivateClient: (id: string) => Promise<Client>;
  deleteMultipleClients: (ids: string[]) => Promise<void>;
  importClients: (clientsData: Omit<Client, 'id'>[]) => Promise<Client[]>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [stats, setStats] = useState<ClientStats>({
    total: 0,
    simples: 0,
    presumido: 0,
    real: 0,
    domestico: 0,
    ativos: 0,
    entradasMes: 0,
    saidasMes: 0,
    recentExits: [],
  });

  // Calculate stats whenever clients change
  useEffect(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const activeClients = clients.filter(c => c.isActive);
    const inactiveClients = clients.filter(c => !c.isActive);

    const counts: ClientStats = {
      total: activeClients.length,
      simples: activeClients.filter(c => c.regimeTributario === 'simples').length,
      presumido: activeClients.filter(c => c.regimeTributario === 'presumido').length,
      real: activeClients.filter(c => c.regimeTributario === 'real').length,
      domestico: activeClients.filter(c => c.regimeTributario === 'domestico').length,
      ativos: activeClients.length,
      entradasMes: clients.filter(c => c.dataEntrada && c.dataEntrada >= firstDayOfMonth).length,
      saidasMes: inactiveClients.filter(c => c.dataSaida).length,
      recentExits: inactiveClients
        .filter(c => c.dataSaida)
        .sort((a, b) => new Date(b.dataSaida!).getTime() - new Date(a.dataSaida!).getTime())
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          nome: c.nomeFantasia || c.razaoSocial,
          motivo: c.motivoSaida || 'Motivo não informado',
          dataSaida: c.dataSaida!,
        })),
    };

    setStats(counts);
  }, [clients]);

  const fetchClients = useCallback(async (force = false) => {
    // If not logged in, don't fetch
    if (!session?.user) {
      setClients([]);
      setHasFetched(false);
      setLoading(false);
      return;
    }

    // If already fetched and not forcing, don't show loading again
    if (hasFetched && !force) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedClients = (data as unknown as DbClient[]).map(mapDbToClient);
      setClients(mappedClients);
      setHasFetched(true);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      // Only show error toast if we actually have a session (to avoid noise during login/logout)
      if (session?.user) {
        toast.error('Erro ao carregar clientes');
      }
    } finally {
      setLoading(false);
    }
  }, [hasFetched, session?.user]);

  const createClient = async (clientData: Omit<Client, 'id'>) => {
    try {
      const dbData = mapClientToDb(clientData);
      const { data, error } = await supabase
        .from('clients')
        .insert([dbData as any])
        .select()
        .single();

      if (error) throw error;

      const newClient = mapDbToClient(data as unknown as DbClient);
      setClients(prev => [newClient, ...prev]);
      toast.success('Cliente criado com sucesso!', {
        description: `${clientData.nomeFantasia} foi adicionado.`
      });

      TaskGeneratorService.generateTasksForNewClient(data).catch(console.error);

      return newClient;
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente', {
        description: error.message || 'Verifique se os dados estão corretos (CNPJ já existe?)'
      });
      throw error;
    }
  };

  const updateClient = async (id: string, clientData: Omit<Client, 'id'>) => {
    try {
      const dbData = mapClientToDb(clientData);
      const { data, error } = await supabase
        .from('clients')
        .update(dbData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedClient = mapDbToClient(data as unknown as DbClient);
      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      toast.success('Cliente atualizado com sucesso!', {
        description: `${clientData.nomeFantasia} foi atualizado.`
      });
      return updatedClient;
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error('Erro ao atualizar cliente');
      throw error;
    }
  };

  const deleteClient = async (id: string, clientName: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== id));
      toast.success('Cliente excluído com sucesso!', {
        description: `${clientName} foi removido.`
      });
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
      throw error;
    }
  };

  const inactivateClient = async (id: string, reason: string, details?: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          is_active: false,
          inactivated_at: new Date().toISOString(),
          inactivation_reason: reason,
          inactivation_details: details || null,
          data_saida: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedClient = mapDbToClient(data as unknown as DbClient);
      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      toast.success('Cliente inativado com sucesso!', {
        description: `${updatedClient.nomeFantasia} foi marcado como inativo.`
      });
      return updatedClient;
    } catch (error) {
      console.error('Erro ao inativar cliente:', error);
      toast.error('Erro ao inativar cliente');
      throw error;
    }
  };

  const reactivateClient = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          is_active: true,
          inactivated_at: null,
          inactivation_reason: null,
          inactivation_details: null,
          data_saida: null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedClient = mapDbToClient(data as unknown as DbClient);
      setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
      toast.success('Cliente ativado com sucesso!', {
        description: `${updatedClient.nomeFantasia} agora está ativo novamente.`
      });
      return updatedClient;
    } catch (error) {
      console.error('Erro ao ativar cliente:', error);
      toast.error('Erro ao ativar cliente');
      throw error;
    }
  };

  const deleteMultipleClients = async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .in('id', ids);

      if (error) throw error;

      setClients(prev => prev.filter(c => !ids.includes(c.id)));
      toast.success(`${ids.length} cliente(s) excluído(s)!`);
    } catch (error) {
      console.error('Erro ao excluir clientes:', error);
      toast.error('Erro ao excluir clientes');
      throw error;
    }
  };

  const importClients = async (clientsData: Omit<Client, 'id'>[]) => {
    try {
      const dbData = clientsData.map(c => mapClientToDb(c));
      const { data, error } = await supabase
        .from('clients')
        .insert(dbData as any[])
        .select();

      if (error) throw error;

      const newClients = (data as unknown as DbClient[]).map(mapDbToClient);
      setClients(prev => [...newClients, ...prev]);
      toast.success(`${newClients.length} cliente(s) importado(s) com sucesso!`);
      return newClients;
    } catch (error) {
      console.error('Erro ao importar clientes:', error);
      toast.error('Erro ao importar clientes');
      throw error;
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchClients();
    } else {
      setClients([]);
      setHasFetched(false);
    }
  }, [session?.user, fetchClients]);

  return (
    <ClientContext.Provider
      value={{
        clients,
        stats,
        loading,
        fetchClients,
        createClient,
        updateClient,
        deleteClient,
        inactivateClient,
        reactivateClient,
        deleteMultipleClients,
        importClients,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export const useClientContext = () => {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClientContext must be used within a ClientProvider');
  }
  return context;
};
