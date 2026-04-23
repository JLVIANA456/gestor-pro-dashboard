import { Carousel, Card } from "@/components/ui/apple-cards-carousel";
import { useClients, Client } from "@/hooks/useClients";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Users, Building2, TrendingUp, Landmark, ArrowRight, UserCheck, ShieldCheck, Mail, Phone } from "lucide-react";

interface AppleCardsCarouselStatsProps {
  stats: {
    total: number;
    simples: number;
    presumido: number;
    real: number;
    ativos: number;
  };
}

export default function AppleCardsCarouselStats({ stats }: AppleCardsCarouselStatsProps) {
  const { clients, loading } = useClients();
  const navigate = useNavigate();

  const getFilteredClients = (regime: string) => {
    if (regime === "all") return clients.filter(c => c.isActive);
    return clients.filter(c => c.regimeTributario?.toLowerCase().includes(regime.toLowerCase()) && c.isActive);
  };

  const data = [
    {
      category: "Performance Geral",
      title: `${stats.ativos || 0} Clientes Ativos`,
      src: "/finance-card.png",
      icon: <Users className="h-6 w-6" />,
      color: "bg-blue-600",
      content: <CompaniesList
        title="Gestão Total de Clientes"
        clients={getFilteredClients("all")}
        loading={loading}
        onOpenClient={(id) => navigate(`/clientes?view=${id}`)}
      />,
    },
    {
      category: "Estratégia Fiscal",
      title: `${stats.simples || 0} Simples Nacional`,
      src: "/simples.png",
      icon: <Building2 className="h-6 w-6" />,
      color: "bg-emerald-600",
      content: <CompaniesList
        title="Simples Nacional"
        clients={getFilteredClients("simples")}
        loading={loading}
        onOpenClient={(id) => navigate(`/clientes?view=${id}`)}
      />,
    },
    {
      category: "Complexidade",
      title: `${stats.presumido || 0} Lucro Presumido`,
      src: "/presumido.png",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "bg-amber-600",
      content: <CompaniesList
        title="Lucro Presumido"
        clients={getFilteredClients("presumido")}
        loading={loading}
        onOpenClient={(id) => navigate(`/clientes?view=${id}`)}
      />,
    },
    {
      category: "Especializado",
      title: `${stats.real || 0} Lucro Real`,
      src: "/real.jpg",
      icon: <Landmark className="h-6 w-6" />,
      color: "bg-indigo-600",
      content: <CompaniesList
        title="Lucro Real"
        clients={getFilteredClients("real")}
        loading={loading}
        onOpenClient={(id) => navigate(`/clientes?view=${id}`)}
      />,
    },
  ];

  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ));

  return (
    <div className="w-full py-12">
      <div className="px-8 mb-8 flex items-end justify-between">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <div className="h-1 w-8 bg-primary rounded-full" />
            <span className="text-[10px] font-medium text-primary uppercase tracking-[0.4em]">JLVIANA Consultoria Contábil</span>
          </motion.div>
          <h2 className="text-4xl font-light text-foreground tracking-tight">Visão Geral de Clientes</h2>
          <p className="text-muted-foreground mt-1 font-light">Estatísticas em tempo real baseadas no regime tributário.</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-1/2 bg-slate-50/50 -z-10 blur-3xl opacity-50" />
        <Carousel items={cards} />
      </div>
    </div>
  );
}

const CompaniesList = ({
  title,
  clients,
  loading,
  onOpenClient
}: {
  title: string;
  clients: Client[];
  loading: boolean;
  onOpenClient: (id: string) => void;
}) => {
  return (
    <div className="relative w-full text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-border/60 pb-6">
        <div>
          <h3 className="text-xl font-light text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-light">Lista filtrada de empresas ativas sob este regime.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 overflow-hidden">
            {clients.slice(0, 5).map((c, i) => (
              <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[8px] font-medium text-primary border border-border">
                {c.nomeFantasia?.[0] || 'E'}
              </div>
            ))}
          </div>
          <span className="bg-primary/5 text-primary px-3 py-1.5 rounded-xl text-[9px] font-medium uppercase tracking-widest border border-primary/10">
            {clients.length} Empresa{clients.length !== 1 ? 's' : ''} encontrada
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary/40" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-foreground font-light text-lg">Carregando dados...</p>
            <p className="text-muted-foreground text-xs uppercase tracking-widest mt-1 font-light">Conectando ao sistema</p>
          </div>
        </div>
      ) : clients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-24 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-border"
        >
          <div className="h-20 w-20 bg-white rounded-3xl shadow-sm border border-border mx-auto flex items-center justify-center mb-6">
            <ShieldCheck className="h-10 w-10 text-slate-200" />
          </div>
          <p className="text-foreground font-light text-xl">Nenhuma empresa encontrada</p>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2 font-light">Não existem registros ativos para este filtro no momento.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {clients.map((client, idx) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative flex flex-col p-8 rounded-[2rem] bg-white border border-border transition-all duration-500 hover:shadow-elevated hover:-translate-y-2 hover:border-primary/30"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-border flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                  <UserCheck className="h-7 w-7 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[8px] font-medium uppercase tracking-[0.2em] border shadow-sm",
                  client.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {client.isActive ? 'Em Operação' : 'Inativa'}
                </div>
              </div>

              <div className="space-y-3 mb-8 text-left">
                <div>
                  <h4 className="text-lg font-light text-foreground group-hover:text-primary transition-colors leading-tight line-clamp-1">
                    {client.nomeFantasia || client.razaoSocial}
                  </h4>
                  <p className="text-[9px] text-muted-foreground font-mono uppercase tracking-widest mt-1 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-border" />
                    CNPJ: {client.cnpj}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center border border-border group-hover:border-primary/20">
                      <Mail className="h-3.5 w-3.5 opacity-40 group-hover:text-primary" />
                    </div>
                    <span className="truncate font-light">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center border border-border group-hover:border-primary/20">
                      <Phone className="h-3.5 w-3.5 opacity-40 group-hover:text-primary" />
                    </div>
                    <span className="font-light">{client.telefone}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenClient(client.id)}
                className="mt-auto w-full group/btn relative overflow-hidden bg-slate-900 text-white rounded-xl py-3 text-[10px] font-medium uppercase tracking-widest transition-all hover:bg-primary active:scale-95 shadow-md"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Abrir Cliente
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </span>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
