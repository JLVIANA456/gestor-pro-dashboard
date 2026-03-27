# 🚀 Gestor Pro Dashboard - JLConecta

O **Gestor Pro Dashboard** é um ecossistema completo de gestão contábil, desenvolvido para transformar a relação entre o escritório de contabilidade e seus clientes. Unindo automação, segurança de dados e uma interface premium, o sistema centraliza todas as operações críticas em um único hub intuitivo. 💼✨

---

## 📸 Visão Geral
O sistema é dividido em módulos estratégicos que cobrem desde a operação técnica contábil até o atendimento final ao cliente via "Link Mágico" e Portal Exclusivo.

---

## ✨ Módulos e Funcionalidades

### 1. 📂 Portal do Cliente (Relacionamento & Entrega)
O coração da interação com o cliente. Focado em eliminar a troca de documentos via WhatsApp e E-mail desorganizados.
- **Hub do Cliente:** Repositório central onde o cliente recebe guias, impostos e folhas de pagamento organizados por pastas.
- **Docs Recebidos:** Dashboard exclusivo do escritório para gerenciar arquivos enviados pelos clientes, com indicadores de "Lido/Não Lido".
- **🔗 Link Mágico (Envio Público):** Gere links seguros que permitem ao cliente enviar documentos sem precisar de senha. Agora com suporte a **Links Permanentes (Infinitos)**.
- **Configuração do Portal:** Personalize a experiência de acesso de cada empresa.

### 2. 📊 Módulo Contábil & Financeiro
Controle total sobre o processamento de dados dos clientes.
- **Progresso Contábil:** Acompanhe o status de fechamento de cada empresa em tempo real.
- **Retirada de Lucro:** Gestão automatizada de cálculos de distribuição de lucros.
- **Modulo Honorários:** Controle de faturamento e recebíveis do próprio escritório.

### 3. ⚖️ Módulo Gestão & Obrigações
Garanta que nenhum prazo seja perdido (Compliance).
- **Lista de Demandas:** Checklist diário de tarefas internas.
- **Lista de Entrega:** Controle rigoroso de documentos enviados ao cliente com log de visualização.
- **Calendário de Obrigações:** Visão mensal de vencimentos de impostos e declarações.
- **Comunicados em Massa:** Envio de avisos gerais para toda a base de clientes via portal.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza o que há de mais moderno no desenvolvimento web moderno:
- **React 18 + Vite:** Performance máxima e carregamento instantâneo. ⚡
- **TypeScript:** Segurança de código e tipagem rigorosa. 📘
- **Tailwind CSS + Shadcn/UI:** Interface premium, responsiva e com design limpo. 🎨
- **Supabase (PostgreSQL + RLS):** Banco de Dados em tempo real com segurança a nível de linha (Row Level Security). ⚡🔥
- **Lucide Icons:** Conjunto de ícones consistentes e elegantes. 🎨

---

## 🚀 Como Executar o Projeto

### 1. Requisitos
- Node.js (v18+)
- Conta no Supabase

### 2. Instalação
```bash
# Clone o repositório
git clone https://github.com/JLVIANA456/gestor-pro-dashboard.git

# Entre na pasta
cd gestor-pro-dashboard

# Instale as dependências
npm install
```

### 3. Configuração do Backend (Supabase)
Para que o portal funcione corretamente, execute os scripts SQL abaixo no Editor do Supabase:

**Tabela de Tokens de Upload (Link Mágico):**
```sql
create table if not exists public.client_upload_tokens (
    id uuid default gen_random_uuid() primary key,
    client_id uuid references public.clients(id) on delete cascade not null,
    token uuid default gen_random_uuid() not null,
    expires_at timestamp with time zone, -- Pode ser NULL para links permanentes
    created_at timestamp with time zone default now()
);
```

**Tabela de Documentos:**
```sql
alter table public.client_documents 
add column if not exists is_read boolean default false;
```

### 4. Rodar o Projeto
```bash
npm run dev
```

---

## 📂 Estrutura de Pastas

```text
src/
├── components/      # Componentes UI (Cards, Modais, Inputs)
├── components/layout# Sidebar, Navbar e estrutura global
├── hooks/           # useClientPortal, useClients (Lógica de API)
├── pages/           # Telas (ClientPortal, DocumentosRecebidos, etc.)
├── integrations/    # Instância do Supabase
└── context/         # BrandingContext e AuthContext (Estado Global)
```

---

## 🤝 Contribuição e Licença
Este projeto é de uso exclusivo e está sob licença proprietária de **JLVIANA**.

---

Feito com ❤️ pela equipe de desenvolvimento **JLVIANA - JLConecta** 🚀
