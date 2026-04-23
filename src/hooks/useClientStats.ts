import { useClientContext } from '@/context/ClientContext';

export function useClientStats() {
  const { stats, loading, fetchClients } = useClientContext();

  return { 
    stats, 
    loading, 
    refetch: () => fetchClients(true) 
  };
}
