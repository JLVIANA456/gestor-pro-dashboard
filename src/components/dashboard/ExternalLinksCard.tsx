import { ExternalLink } from 'lucide-react';

const links = [
  { name: 'e-CAC', url: 'https://cav.receita.fazenda.gov.br/', description: 'Centro Virtual de Atendimento' },
  { name: 'JUCESP', url: 'https://www.jucesp.sp.gov.br/', description: 'Junta Comercial de SP' },
  { name: 'Simples Nacional', url: 'http://www8.receita.fazenda.gov.br/SimplesNacional/', description: 'Portal do Simples' },
  { name: 'eSocial', url: 'https://www.gov.br/esocial/', description: 'Sistema de Escrituração Digital' },
  { name: 'SEFAZ-SP', url: 'https://www.fazenda.sp.gov.br/', description: 'Secretaria da Fazenda SP' },
  { name: 'Prefeitura SP', url: 'https://www.prefeitura.sp.gov.br/', description: 'Portal da Prefeitura' },
];

export function ExternalLinksCard() {
  return (
    <div className="rounded-2xl bg-card p-6 border border-border/50 shadow-card animate-slide-in-up stagger-3 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-light text-foreground tracking-wide text-lg">Central de Links</h3>
        <div className="h-1 w-1 rounded-full bg-primary/40" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-3 rounded-2xl border border-border/50 p-4 transition-all duration-300 hover:border-primary/20 hover:bg-primary/[0.01] hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 group-hover:bg-primary/10 transition-colors">
                <ExternalLink className="h-4 w-4 text-primary/60" />
              </div>
            </div>
            <div className="mt-1">
              <p className="text-sm font-normal text-foreground group-hover:text-primary transition-colors">{link.name}</p>
              <p className="text-[10px] text-muted-foreground font-light uppercase tracking-[0.1em] leading-tight mt-1.5">{link.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
