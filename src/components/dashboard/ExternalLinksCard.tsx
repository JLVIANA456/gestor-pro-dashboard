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
    <div className="rounded-lg bg-card p-6 shadow-card animate-slide-in-up stagger-3">
      <h3 className="font-semibold text-foreground mb-4">Central de Links</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary hover:shadow-card-hover"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{link.name}</p>
              <p className="text-xs text-muted-foreground truncate">{link.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
