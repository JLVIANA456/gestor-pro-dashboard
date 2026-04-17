import { useClientContext } from '@/context/ClientContext';
export type { Client, TaxRegime, Socio } from '@/context/ClientContext';

export function useClients() {
  const context = useClientContext();
  
  return {
    ...context
  };
}
