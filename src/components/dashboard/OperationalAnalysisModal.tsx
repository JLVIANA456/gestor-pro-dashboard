import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Building2, 
  Calendar, 
  LayoutDashboard, 
  SearchX, 
  X 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";

interface OperationalAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'entregas' | 'aRealizar' | 'docs' | 'processos' | null;
  data: any[];
  title: string;
}

export function OperationalAnalysisModal({ isOpen, onClose, type, data, title }: OperationalAnalysisModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item => {
      const clientName = (item.client?.nome_fantasia || item.client?.razao_social || item.cliente_nome || '').toLowerCase();
      const typeStr = (item.type || item.tipo || item.nome_processo || '').toLowerCase();
      return clientName.includes(searchTerm.toLowerCase()) || typeStr.includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm]);

  const stats = useMemo(() => {
    const totalCount = data?.length || 0;
    const filteredCount = filteredData?.length || 0;
    
    return {
      total: totalCount,
      filtered: filteredCount,
      overdue: filteredData ? filteredData.filter(item => {
          if (type === 'aRealizar') {
              const due = item.due_date ? new Date(item.due_date) : null;
              return due && due < new Date();
          }
          return false;
      }).length : 0
    };
  }, [filteredData, data, type]);

  const renderContent = () => {
    if (!type) return null;

    return (
      <div className="flex flex-col h-[85vh] md:h-[80vh]">
        {/* Header - Clean & Integrated with System Red */}
        <div className="p-6 md:p-8 border-b border-slate-100 bg-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="text-[10px] uppercase tracking-[0.2em]">Gestão Operacional</span>
                    </div>
                    <h2 className="text-3xl font-light tracking-tight text-slate-800">
                        Detalhamento de <span className="font-bold text-primary">{title}</span>
                    </h2>
                </div>

                <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-center px-4 border-r border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-xl font-bold text-slate-700 leading-none">{stats.total}</p>
                    </div>
                    {type === 'aRealizar' && stats.overdue > 0 && (
                        <div className="text-center px-4 border-r border-slate-200">
                            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Atrasados</p>
                            <p className="text-xl font-bold text-red-600 leading-none">{stats.overdue}</p>
                        </div>
                    )}
                    <div className="text-center px-4">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Filtrados</p>
                        <p className="text-xl font-bold text-primary leading-none">{stats.filtered}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Search - Ultra Clean */}
        <div className="px-6 py-4 bg-white border-b border-slate-50">
            <div className="relative group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Pesquisar empresa ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus-visible:ring-primary/20"
              />
            </div>
        </div>

        {/* List - Maximum Clarity */}
        <ScrollArea className="flex-1 bg-slate-50/30">
            <div className="p-6 space-y-3">
              {filteredData.length > 0 ? (
                filteredData.map((item, idx) => (
                  <div key={idx} className="flex flex-col lg:flex-row lg:items-center justify-between p-5 rounded-2xl bg-white border border-slate-200/60 hover:border-primary/30 hover:shadow-sm transition-all group gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-700 tracking-tight group-hover:text-primary transition-colors">
                                {item.client?.nome_fantasia || item.client?.razao_social || item.cliente_nome || 'Empresa não identificada'}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400">
                                {item.client?.cnpj || 'CNPJ não cadastrado'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:items-end gap-1 px-4 lg:min-w-[200px] lg:border-l lg:border-slate-100">
                        <span className="text-xs font-semibold text-slate-600">
                            {item.type || item.nome_processo || 'Documento'}
                        </span>
                        {item.amount && (
                            <span className="text-[10px] font-black text-primary">
                                {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 lg:min-w-[220px] justify-end">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200/50">
                            <Calendar className="h-3.5 w-3.5" />
                            {item.due_date ? format(parseISO(item.due_date), 'dd/MM/yyyy') : 
                             item.created_at ? format(parseISO(item.created_at), 'dd/MM/yyyy') : '-'}
                        </div>
                        <StatusBadge status={item.status} overdue={isOverdue(item)} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-40 flex flex-col items-center justify-center space-y-4 opacity-20">
                  <SearchX className="h-12 w-12" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em]">Nenhum item encontrado</p>
                </div>
              )}
            </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-8 py-3 bg-white border-t border-slate-100 flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Controle Operacional Integrado</span>
            <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">JLConecta v1.0</span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl p-0 rounded-[1.5rem] overflow-hidden border-none shadow-2xl bg-white outline-none ring-1 ring-slate-200">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status, overdue }: { status: string, overdue: boolean }) {
    if (overdue) {
        return <Badge className="bg-red-600 text-white border-none text-[9px] font-black uppercase tracking-tighter rounded-md h-5 px-2">Atrasado</Badge>;
    }
    
    switch(status) {
        case 'sent':
        case 'completed':
            return <Badge className="bg-emerald-600 text-white border-none text-[9px] font-black uppercase tracking-tighter rounded-md h-5 px-2">Concluido</Badge>;
        case 'pending':
            return <Badge className="bg-orange-500 text-white border-none text-[9px] font-black uppercase tracking-tighter rounded-md h-5 px-2">Pendente</Badge>;
        case 'scheduled':
            return <Badge className="bg-blue-600 text-white border-none text-[9px] font-black uppercase tracking-tighter rounded-md h-5 px-2">Agendado</Badge>;
        default:
            return <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter rounded-md h-5 px-2 border-slate-200 text-slate-400">{status || 'Outro'}</Badge>;
    }
}

function isOverdue(item: any) {
    if (!item || !item.due_date || item.status === 'sent' || item.status === 'completed') return false;
    try {
        return new Date(item.due_date) < new Date();
    } catch {
        return false;
    }
}
