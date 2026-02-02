import { useState, useEffect } from 'react';
import { Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

interface ClientSuggestion {
  id: string;
  name: string;
  cnpj: string;
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Buscar clientes do banco quando digitar
  useEffect(() => {
    const searchClients = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, nome_fantasia, cnpj')
          .or(`nome_fantasia.ilike.%${searchQuery}%,razao_social.ilike.%${searchQuery}%,cnpj.ilike.%${searchQuery}%`)
          .limit(5);

        if (error) throw error;

        setSuggestions(
          data?.map(c => ({
            id: c.id,
            name: c.nome_fantasia,
            cnpj: c.cnpj,
          })) || []
        );
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchClients, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectClient = (clientId: string) => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/clientes?view=${clientId}`);
  };

  return (
    <header className={cn(
      'fixed right-0 top-0 z-30 h-20 border-b border-border bg-card/80 backdrop-blur-sm transition-all duration-300 no-print',
      sidebarCollapsed ? 'left-20' : 'left-64'
    )}>
      <div className="flex h-full items-center justify-between px-8">
        {/* Spacer to keep user info to the right */}
        <div />

        {/* User */}
        <div className="flex items-center gap-3 rounded-xl bg-muted px-4 py-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            J
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">Jefferson</p>
            <p className="text-xs text-muted-foreground">Contador</p>
          </div>
        </div>
      </div>
    </header>
  );
}
