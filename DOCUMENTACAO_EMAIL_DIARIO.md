# Implementação de Resumos Diários de Vencimentos

Esta funcionalidade automatiza o envio de e-mails diários para os departamentos (Fiscal, DP e Contábil), informando quais obrigações precisam ser iniciadas, enviadas ou que vencem no dia.

## 1. Atualização do Banco de Dados (SQL)

Execute este comando no SQL Editor do seu projeto Supabase:

```sql
-- Adicionar campos de e-mail por departamento na tabela de branding
ALTER TABLE public.branding_settings
ADD COLUMN IF NOT EXISTS fiscal_email text,
ADD COLUMN IF NOT EXISTS dp_email text,
ADD COLUMN IF NOT EXISTS contabil_email text;
```

## 2. Disparo Manual
Para testar ou reenviar os resumos durante o dia, acesse a aba **Personalizar > E-mails & Entrega** e utilize o botão **"Disparar Agora"** na seção de e-mails de alerta.

## 2. Código da Edge Function (`daily-deadline-summaries`)

Crie uma nova Edge Function no Supabase com o seguinte código (ou adicione à sua lógica de exportação):

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apiKey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // 1. Buscar Branding (E-mails dos departamentos)
    const { data: branding } = await supabase
      .from('branding_settings')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single()

    if (!branding) throw new Error("Branding not found")

    // 2. Buscar Obrigações Ativas
    const { data: obligations } = await supabase
      .from('obligations')
      .select('*')
      .eq('is_active', true)

    const today = new Date().getDate()
    
    // 3. Processar demandas por departamento
    const depts = ['Fiscal', 'DP', 'Contábil']
    const emails = {
      'Fiscal': branding.fiscal_email,
      'DP': branding.dp_email,
      'Contábil': branding.contabil_email
    }

    const summaries: any = { 'Fiscal': [], 'DP': [], 'Contábil': [] }

    obligations?.forEach(o => {
      const maxAlert = o.alert_days?.length ? Math.max(...o.alert_days) : 5
      const minAlert = o.alert_days?.length ? Math.min(...o.alert_days) : 1
      
      const startDay = o.default_due_day - maxAlert
      const sendDay = o.default_due_day - minAlert
      const dueDay = o.default_due_day

      const dept = o.department;
      if (!summaries[dept]) return;

      if (today === startDay) summaries[dept].push({ name: o.name, type: '🟢 INICIAR' })
      if (today === sendDay) summaries[dept].push({ name: o.name, type: '🟡 ENVIAR AO CLIENTE' })
      if (today === dueDay) summaries[dept].push({ name: o.name, type: '🔴 VENCIMENTO FINAL' })
    })

    // 4. Disparar E-mails (Exemplo usando Resend ou similar configurado no Supabase)
    // Aqui você integraria com sua lógica de envio de e-mail existente
    console.log("Summaries generated:", summaries)

    return new Response(JSON.stringify({ success: true, summaries }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
```

## 3. Agendamento (Cron Job)

Após subir a função, configure o agendamento via SQL:

```sql
-- Agendar para rodar todos os dias às 08:00 (Fuso UTC)
select
  cron.schedule(
    'daily-deadline-email',
    '0 11 * * *', -- 08:00 no Brasil (UTC-3)
    $$
    select
      net.http_post(
        url:='https://[SEU-ID-PROJETO].functions.supabase.co/daily-deadline-summaries',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer [SUA-ANON-KEY]"}'
      ) as request_id;
    $$
  );
```
