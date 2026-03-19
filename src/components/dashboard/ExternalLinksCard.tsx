import { 
  ExternalLink, 
  Globe, 
  ShieldCheck, 
  FileText, 
  Building2, 
  UserRound, 
  Landmark, 
  MapPin 
} from 'lucide-react';
import { motion } from 'framer-motion';

const links = [
  { name: 'e-CAC', url: 'https://cav.receita.fazenda.gov.br/', description: 'Cac Virtual', icon: ShieldCheck },
  { name: 'JUCESP', url: 'https://www.jucesp.sp.gov.br/', description: 'Junta Comercial', icon: FileText },
  { name: 'SIMPLES', url: 'http://www8.receita.fazenda.gov.br/SimplesNacional/', description: 'Portal Oficial', icon: Landmark },
  { name: 'eSocial', url: 'https://www.gov.br/esocial/', description: 'Gov Federal', icon: UserRound },
  { name: 'SEFAZ-SP', url: 'https://www.fazenda.sp.gov.br/', description: 'Sec. Fazenda', icon: Building2 },
  { name: 'PREFEITURA', url: 'https://www.prefeitura.sp.gov.br/', description: 'Portal SP', icon: MapPin },
];

export function ExternalLinksCard() {
  return (
    <div className="bg-white/40 backdrop-blur-md rounded-[3rem] py-12 px-8 border border-border shadow-sm h-full flex flex-col justify-center overflow-hidden">
      <div className="mx-auto w-full px-4 md:px-8 text-center mb-12">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="flex flex-col items-center"
        >
           <span className="text-[10px] font-medium text-primary uppercase tracking-[0.4em] mb-4 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10 italic">
             Portais Sincronizados
           </span>
           <h2 className="text-3xl font-light text-foreground tracking-tight sm:text-4xl">Central de Links Rápidos</h2>
           <p className="mt-2 text-sm text-muted-foreground font-light max-w-md mx-auto">
             Acesso contínuo e animado aos principais portais governamentais e fiscais.
           </p>
        </motion.div>
      </div>

      <div className="mx-auto w-full px-8">
        <div
          className="group relative flex gap-6 overflow-hidden py-8"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
          }}
        >
          {Array(4)
            .fill(null)
            .map((_, index) => (
              <div
                key={index}
                className="flex shrink-0 animate-logo-cloud flex-row justify-around gap-6"
              >
                {links.map((link) => (
                  <motion.a
                    key={`${index}-${link.name}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ 
                      scale: 1.05,
                      y: -5,
                      transition: { duration: 0.2 } 
                    }}
                    className="flex flex-col items-center justify-center min-w-[160px] py-8 rounded-[2rem] bg-white border border-border shadow-sm transition-all duration-300 hover:shadow-elevated hover:border-primary/20 pointer-events-auto"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 transition-colors group-hover:bg-primary/5 mb-4 border border-border group-hover:border-primary/10">
                      <link.icon className="h-6 w-6 text-slate-400 group-hover:text-primary transition-colors duration-300" />
                    </div>
                    
                    <span className="text-xs font-light text-foreground tracking-[0.2em] group-hover:text-primary transition-colors duration-300 uppercase">
                      {link.name}
                    </span>
                    <span className="text-[8px] text-muted-foreground mt-1 uppercase tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                      {link.description}
                    </span>

                    <div className="absolute top-4 right-6 opacity-40 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="h-2.5 w-2.5" />
                    </div>
                  </motion.a>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
