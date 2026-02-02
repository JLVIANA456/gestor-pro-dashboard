import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TaxRegime = 'simples' | 'presumido' | 'real';

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
  isActive: boolean;
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Mapeia do banco para o formato do frontend
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
  isActive: db.is_active ?? true,
});

// Mapeia do frontend para o formato do banco
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
  is_active: client.isActive === undefined ? true : client.isActive,
});


export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedClients = (data as unknown as DbClient[]).map(mapDbToClient);
      setClients(mappedClients);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

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
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    deleteMultipleClients,
    importClients,
  };
}
