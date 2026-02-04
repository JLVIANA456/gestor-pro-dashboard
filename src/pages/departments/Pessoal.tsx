import { Users, Construction } from 'lucide-react';

export default function PessoalDepartment() {
  return (
    <div className="space-y-6 animate-slide-in-up">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-light tracking-tight text-foreground">Departamento Pessoal</h1>
          <p className="text-xs font-normal text-muted-foreground uppercase tracking-[0.2em] mt-1">Gestão de recursos humanos</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 bg-card">
        <Construction className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-light text-foreground mb-1">Em construção</h3>
        <p className="text-sm text-muted-foreground">Esta funcionalidade será implementada em breve.</p>
      </div>
    </div>
  );
}
