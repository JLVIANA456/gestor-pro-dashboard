/*
Design philosophy reminder for this page:
- Editorial corporativo premium com navegação lateral fixa e capítulos assimétricos.
- Poppins para títulos, Manrope para leitura longa.
- Branco dominante, grafite técnico e vermelho JLVIANA como acento preciso.
- Blocos com aparência de manual executivo digital, jamais landing page genérica centralizada.
*/

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, BookOpenText, Building2, ClipboardList, FileText, Landmark, Mail, ShieldCheck, Share2, Home as HomeIcon, Download } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const heroImage = "https://d2xsxph8kpxj0f.cloudfront.net/310519663580160572/cKsNxJJttJ4MSKer6BC7gw/jlviana-hero-editorial-TWnUcco4s5Mz7ezD2s6dWs.webp";
const docsImage = "https://d2xsxph8kpxj0f.cloudfront.net/310519663580160572/cKsNxJJttJ4MSKer6BC7gw/jlviana-sections-documents-JevdSn9WeFiG9Z8rHUue8N.webp";
const lucrosImage = "https://d2xsxph8kpxj0f.cloudfront.net/310519663580160572/cKsNxJJttJ4MSKer6BC7gw/jlviana-lucros-visual-UzF6E9AiqqQNJdDJeUgJNW.webp";

const navItems = [
  { id: "inicio", label: "Início", number: "01", icon: HomeIcon },
  { id: "boas-vindas", label: "Boas-vindas", number: "02", icon: Building2 },
  { id: "manual", label: "Manual do Cliente", number: "03", icon: BookOpenText },
  { id: "lucros", label: "Retirada de Lucros", number: "04", icon: Landmark },
  { id: "como-usar", label: "Como utilizar", number: "05", icon: FileText },
  { id: "contato", label: "Contato", number: "06", icon: Mail },
];

const chapterCards = [
  {
    number: "01",
    title: "Boas-vindas",
    description:
      "Apresenta o posicionamento da JLVIANA, a lógica da parceria e os pilares que sustentam a atuação consultiva.",
    icon: Building2,
    href: "#boas-vindas",
  },
  {
    number: "02",
    title: "Manual do Cliente",
    description:
      "Consolida as diretrizes de envio documental, uso correto da conta PJ e padrões de comprovação das despesas.",
    icon: BookOpenText,
    href: "#manual",
  },
  {
    number: "03",
    title: "Guia de Lucros 2026",
    description:
      "Organiza as regras operacionais sobre controle, prazo e envio das retiradas de lucros aos sócios.",
    icon: Landmark,
    href: "#lucros",
  },
];

const manualHighlights = [
  {
    title: "Prazo operacional mensal",
    body:
      "A documentação do mês anterior deve ser enviada até o dia 10 do mês subsequente, preservando fluidez no fechamento e consistência na escrituração.",
  },
  {
    title: "Documento hábil e idôneo",
    body:
      "Toda despesa precisa estar respaldada por documentação suficiente, identificável e coerente com a atividade empresarial.",
  },
  {
    title: "Uso correto da conta PJ",
    body:
      "Entradas e saídas precisam ser justificadas. Mistura entre finanças pessoais e empresariais compromete a clareza contábil e a segurança patrimonial.",
  },
];

const docsChecklist = [
  "Notas fiscais de venda de produtos ou prestação de serviços.",
  "Boletos, recibos, contratos e comprovantes de despesas operacionais.",
  "Extratos bancários, comprovantes de PIX, TED, DOC e aplicações financeiras.",
  "Guias de tributos e comprovantes de pagamento.",
  "Folha, encargos e documentos ligados ao departamento pessoal, quando aplicável.",
];

const lucroRules = [
  {
    title: "Controle em tempo real",
    body:
      "Cada retirada deve ser registrada pela empresa no momento da efetiva transferência ao sócio, e não apenas no fechamento do mês.",
  },
  {
    title: "Canal oficial e prazo",
    body:
      "A planilha de controle e os extratos bancários devem ser encaminhados até o dia 10 do mês subsequente para contabil@jlviana.com.br.",
  },
  {
    title: "Critério por sócio e por mês",
    body:
      "O acompanhamento deve ser individualizado por CPF e competência mensal, assegurando rastreabilidade e conferência correta.",
  },
];

const profitFlow = [
  "Avaliar internamente a coerência financeira da retirada antes da transferência.",
  "Realizar a movimentação bancária de forma identificável e rastreável.",
  "Registrar imediatamente a operação na planilha oficial de controle.",
  "Separar comprovantes e extratos compatíveis com o valor transferido.",
  "Encaminhar planilha e evidências ao canal oficial dentro do prazo estabelecido.",
];

const channels = [
  { area: "Departamento Contábil", email: "contabil@jlviana.com.br", purpose: "Envio documental mensal e orientações operacionais." },
  { area: "Diretoria", email: "contabilidade@jlviana.com.br", purpose: "Assuntos técnicos que demandem alinhamento com o contador responsável." },
  { area: "Departamento Fiscal", email: "fiscal@jlviana.com.br", purpose: "Questões tributárias, apuração de impostos e obrigações fiscais." },
  { area: "Departamento Pessoal", email: "dp@jlviana.com.br", purpose: "Demandas de folha de pagamento, férias e rotinas de RH." },
  { area: "Departamento de Qualidade", email: "qualidade@jlviana.com.br", purpose: "Sugestões, feedbacks e acompanhamento da qualidade do atendimento." },
  { area: "BPO Financeiro", email: "bpo@jlviana.com.br", purpose: "Demandas relacionadas à rotina de BPO financeiro." },
  { area: "Financeiro", email: "financeiro@jlviana.com.br", purpose: "Questões financeiras e administrativas da relação contratual." },
];

export default function KitBoasVindas() {
  const shareKit = async () => {
    const payload = {
      title: "Guia do Cliente | JLVIANA Consultoria Contábil",
      text: "Acesse o guia digital com orientações operacionais, documentação e regras de retirada de lucros da JLVIANA.",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        toast.success("Link compartilhado com sucesso.");
        return;
      } catch {
        // fallback below
      }
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência.");
    } catch {
      toast.error("Não foi possível compartilhar o link neste navegador.");
    }
  };
  return (
    <div className="flex flex-col bg-background text-foreground w-full">
      <main className="w-full overflow-x-hidden">
        <section id="inicio" className="relative min-h-[85vh] flex items-center overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(210,35,42,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(210,35,42,0.05),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(255,255,255,0.98))]" />
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d2232a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

          <div className="container relative py-20 lg:py-32 flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-4xl space-y-12"
            >
              <div className="space-y-10">
                <div className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-6 py-2.5 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-primary shadow-[0_10px_30px_rgba(210,35,42,0.08)] backdrop-blur-sm mx-auto">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Portal Institucional JLVIANA
                </div>
                <div className="space-y-7">
                  <h1 className="font-sans text-5xl font-medium leading-[1.1] tracking-[-0.03em] text-foreground sm:text-6xl lg:text-[6rem]">
                    Portal do Cliente  <span className="relative inline-block text-primary">
                      JLVIANA
                      <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                      </svg>
                    </span>
                  </h1>
                  <p className="max-w-2xl mx-auto text-xl leading-relaxed text-muted-foreground font-light">
                    Consolidação estratégica de processos, conformidade e gestão contábil para parceiros de alto nível. Reúne orientações essenciais sobre documentação, rotina operacional e controle de lucros.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild size="lg" className="rounded-2xl px-10 h-16 font-medium text-lg shadow-[0_15px_40px_rgba(210,35,42,0.15)]">
                    <a href="#boas-vindas">Explorar Conteúdo</a>
                  </Button>
                  <Button variant="outline" size="lg" className="rounded-2xl px-10 h-16 font-medium text-lg border-border/80 bg-white/50 backdrop-blur-sm" onClick={shareKit}>
                    <Share2 className="mr-2 h-5 w-5" />
                    Compartilhar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="container py-20 lg:py-32">
          <div className="max-w-6xl mx-auto space-y-24 lg:space-y-40">
            <motion.section
              id="boas-vindas"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]"
            >
              <Card className="rounded-[2.5rem] border-border/60 bg-card shadow-[0_22px_70px_rgba(15,23,42,0.06)] overflow-hidden">
                <CardContent className="p-10 sm:p-12">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-8">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">02 — Boas-vindas</p>
                  <h2 className="mt-6 font-sans text-4xl font-medium tracking-[-0.02em] leading-tight text-foreground/90">Uma parceria construída com clareza e visão de futuro.</h2>
                  <p className="mt-8 text-lg leading-relaxed text-muted-foreground font-light">
                    A JLVIANA Consultoria Contábil atua de forma consultiva e estruturada, tratando a contabilidade como parte da gestão estratégica do negócio.
                  </p>
                  <div className="mt-10 grid gap-6 sm:grid-cols-3">
                    {[
                      { title: "Organização", icon: ClipboardList },
                      { title: "Estratégia", icon: BadgeCheck },
                      { title: "Conformidade", icon: ShieldCheck },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="group rounded-[2rem] border border-border/50 bg-secondary/30 p-6 transition-all hover:bg-primary/5 hover:border-primary/20">
                          <Icon className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
                          <p className="mt-5 font-sans text-base font-medium tracking-tight">{item.title}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-[2.5rem] border-border/60 bg-card shadow-[0_22px_70px_rgba(15,23,42,0.06)] group">
                <div className="relative h-80 overflow-hidden">
                  <img src={docsImage} alt="Documentação" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                </div>
                <CardContent className="p-10 sm:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground">Posicionamento Institucional</p>
                  <p className="mt-6 text-lg leading-relaxed text-muted-foreground italic">
                    "Este kit digital foi desenhado para substituir a fragmentação de informações por clareza operacional absoluta."
                  </p>
                </CardContent>
              </Card>
            </motion.section>

            <motion.section
              id="manual"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="grid gap-6"
            >
              <Card className="rounded-[2.5rem] border-border/60 bg-card shadow-[0_22px_70px_rgba(15,23,42,0.06)] overflow-hidden">
                <CardContent className="p-10 sm:p-14">
                  <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] items-center">
                    <div className="space-y-8">
                      <h2 className="font-sans text-4xl font-medium tracking-[-0.03em] leading-tight text-foreground/90">Diretrizes para uma operação impecável.</h2>
                      <p className="text-lg leading-relaxed text-muted-foreground font-light">
                        O manual consolida os procedimentos operacionais que sustentam a qualidade técnica do trabalho contábil.
                      </p>
                      <div className="pt-4">
                        <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-8 shadow-sm">
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary mb-4">Uso da conta PJ</p>
                          <p className="text-sm leading-relaxed text-foreground/80 font-normal">
                            A separação patrimonial é o pilar da segurança jurídica. Entradas e saídas devem ter lastro e justificativa clara.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-6">
                      {manualHighlights.map((item) => (
                        <div key={item.title} className="group rounded-[2.2rem] border border-border/50 bg-secondary/20 p-8 transition-all hover:bg-white hover:shadow-xl hover:border-transparent">
                          <p className="font-sans text-xl font-medium tracking-tight text-foreground transition-colors group-hover:text-primary">{item.title}</p>
                          <p className="mt-4 text-sm leading-relaxed text-muted-foreground font-normal">{item.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="rounded-[2.5rem] border-border/60 bg-card shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
                  <CardContent className="p-10 sm:p-12">
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground mb-6">Checklist de Rotina</p>
                    <h3 className="font-sans text-2xl font-medium tracking-tight mb-8">Documentação Mensal</h3>
                    <div className="space-y-4">
                      {docsChecklist.map((item, index) => (
                        <div key={item} className="group flex items-center gap-5 rounded-2xl border border-border/40 bg-background/50 px-6 py-5 transition-all hover:border-primary/30 hover:bg-white hover:shadow-md">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold transition-colors group-hover:bg-primary group-hover:text-white">
                            0{index + 1}
                          </span>
                          <p className="text-sm font-medium text-foreground/80">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-border/60 bg-gradient-to-br from-primary to-primary/80 text-white shadow-[0_30px_90px_rgba(210,35,42,0.18)]">
                  <CardContent className="p-10 sm:p-12 flex flex-col justify-between h-full">
                    <div>
                      <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-10">
                        <ShieldCheck className="h-7 w-7 text-white" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70 mb-4">Diretriz Crítica</p>
                      <h3 className="font-sans text-3xl font-medium tracking-tight leading-tight">Rastreabilidade e Idoneidade.</h3>
                      <p className="mt-8 text-lg leading-relaxed text-white/90 font-light">
                        O fluxo bancário deve espelhar a realidade documental. Cada centavo movimentado precisa de uma evidência que o suporte.
                      </p>
                    </div>
                    <div className="mt-12 rounded-2xl bg-black/10 p-6 backdrop-blur-sm">
                      <p className="text-sm font-medium italic leading-relaxed">
                        "A conformidade não é um evento mensal, mas um hábito operacional diário."
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.section>

            <motion.section
              id="lucros"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="grid gap-6 lg:grid-cols-[1fr_1fr]"
            >
              <Card className="overflow-hidden rounded-[2.5rem] border-border/60 bg-card shadow-[0_22px_70px_rgba(15,23,42,0.06)] lg:col-span-2">
                <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="p-10 sm:p-14">
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">04 — Guia de Lucros 2026</p>
                    <h2 className="mt-6 font-sans text-4xl font-medium tracking-tight leading-tight text-foreground/90">Controle, prazo e comunicação clara sobre cada retirada realizada aos sócios.</h2>
                    <p className="mt-8 text-lg leading-relaxed text-muted-foreground font-light">
                      O guia foi consolidado para reduzir ruído e orientar uma rotina disciplinada de registro e envio. A JLVIANA recomenda que a retirada de lucros seja tratada como processo formal, com planilha de controle, extratos compatíveis e comunicação pelo canal oficial.
                    </p>
                    <div className="mt-10 grid gap-4">
                      {lucroRules.map((item) => (
                        <div key={item.title} className="rounded-[2rem] border border-border/60 bg-secondary/20 p-6">
                          <p className="font-sans text-xl font-medium tracking-tight">{item.title}</p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-normal">{item.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="min-h-[360px] overflow-hidden lg:min-h-full">
                    <img src={lucrosImage} alt="Retirada de Lucros" className="h-full w-full object-cover" />
                  </div>
                </div>
              </Card>

              <Card className="rounded-[2.5rem] border-border/60 bg-card shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="p-10 sm:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground mb-4">Arquivo oficial de apoio</p>
                  <h3 className="font-sans text-xl font-medium mb-4">Planilha de Controle de Retirada</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground font-light mb-8">
                    Baixe a planilha de controle de retirada de lucros. Utilize este arquivo para registrar cada retirada realizada e encaminhe a planilha preenchida juntamente com os extratos bancários dentro do prazo operacional definido pela JLVIANA.
                  </p>
                  <div className="space-y-6">
                    <Button asChild className="w-full rounded-2xl h-14 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 font-semibold">
                      <a href="/modelo_retirada_lucro.xlsx" download>
                        <Download className="mr-2 h-5 w-5" />
                        Baixar planilha oficial
                      </a>
                    </Button>
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">Formato XLSX</span>
                      <span className="text-[0.65rem] font-bold uppercase tracking-widest text-primary">Controle em tempo real</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-border/60 bg-card shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="p-10 sm:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground mb-8">Síntese Executiva</p>
                  <div className="space-y-4">
                    {[
                      "A contabilidade não é onipresente; o controle primário é da gestão interna.",
                      "Coerência absoluta entre planilha, extrato e operação bancária.",
                      "O rigor no prazo preserva a previsibilidade do seu fechamento.",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-border/40 bg-background/60 p-6 text-sm font-bold leading-relaxed text-foreground/70 transition-all hover:bg-white hover:shadow-md">
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            <motion.section
              id="como-usar"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]"
            >
              <Card className="rounded-[2.5rem] border-border/60 bg-card shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="p-10 sm:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">05 — Utilização</p>
                  <h2 className="mt-6 font-sans text-4xl font-bold tracking-tight">Referência Única.</h2>
                  <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
                    Substitua comunicados fragmentados por uma base de consulta centralizada e elegante.
                  </p>
                  <div className="mt-10 grid gap-6">
                    <div className="group rounded-[2rem] border border-border/50 bg-secondary/20 p-8 transition-all hover:bg-white hover:shadow-lg">
                      <FileText className="h-7 w-7 text-primary mb-6" />
                      <p className="font-sans text-xl font-bold tracking-tight">Leitura Estruturada</p>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-medium">Capítulos organizados para acesso cirúrgico à informação necessária.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-border/60 bg-gradient-to-br from-secondary/50 to-secondary/30 shadow-[0_22px_70px_rgba(15,23,42,0.04)] backdrop-blur-sm">
                <CardContent className="p-10 sm:p-12">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary mb-8">Aplicação Prática</p>
                  <div className="space-y-5">
                    {[
                      "Compartilhe o link no onboarding de novos sócios ou gestores.",
                      "Use como régua de conformidade para a equipe administrativa.",
                      "Consulte as diretrizes de retirada antes de cada movimentação.",
                    ].map((item, index) => (
                      <div key={item} className="flex gap-5 rounded-[2rem] border border-white/60 bg-white/40 px-8 py-7 shadow-sm transition-transform hover:scale-[1.02]">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-black">0{index + 1}</span>
                        <p className="text-sm font-bold leading-relaxed text-foreground/70">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            <motion.section
              id="contato"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="grid gap-6 grid-cols-1"
            >
              <Card className="rounded-[2.5rem] border-border/60 bg-card shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="p-10 sm:p-12 lg:p-14">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">06 — Contato</p>
                  <h2 className="mt-6 font-sans text-4xl font-bold tracking-tight leading-tight">Canais Oficiais JLVIANA.</h2>
                  <p className="mt-8 text-lg leading-relaxed text-muted-foreground max-w-2xl">
                    A eficiência da nossa entrega depende da precisão do canal utilizado.
                  </p>
                  <div className="mt-10 grid gap-4">
                    {channels.map((item) => (
                      <a key={item.email} href={`mailto:${item.email}`} className="group rounded-[2rem] border border-border/50 bg-background px-8 py-7 transition-all hover:bg-primary/5 hover:border-primary/20 hover:shadow-md">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-sans text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">{item.area}</p>
                            <p className="mt-1 text-sm font-medium text-muted-foreground">{item.purpose}</p>
                          </div>
                          <div className="inline-flex items-center text-sm font-black text-primary bg-primary/5 px-4 py-2 rounded-full transition-all group-hover:bg-primary group-hover:text-white">
                            <Mail className="mr-2 h-4 w-4" />
                            {item.email}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
}
