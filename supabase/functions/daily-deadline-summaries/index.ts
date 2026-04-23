import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Puxar as chaves primeiro pelas variáveis de ambiente, depois pelos valores que você forneceu para backup
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "re_LKH1oeKs_BFV4KuoXshpPFBnCtEed5yvL"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://qvnktgjoarotzzkuptht.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bmt0Z2pvYXJvdHp6a3VwdGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjMwMTAsImV4cCI6MjA4NTIzOTAxMH0.P5EJ29QhJAdigw0nJSXt1eJe2wrQQLmm_Y6X_jQf-fo"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

type Department = "Fiscal" | "DP" | "Contábil"

type SummaryTask = {
  id: string
  name: string
  label: string
  color: string
  icon: string
  message: string
  dueDateLabel: string
  deptOrig?: string // Identifica o depto original no resumo unificado
}

type ObligationRow = {
  id?: string
  name: string
  department: Department
  default_due_day: number
  alert_days?: number[] | null
  is_active?: boolean
}

const messageByLabel: Record<string, string> = {
  "INICIAR PRODUÇÃO": "Para esta demanda, hoje é o momento de iniciar a produção para garantir o prazo.",
  "ENVIAR AO CLIENTE": "Hoje é o dia recomendado para envio ao cliente. Priorize esta entrega.",
  "VENCIMENTO FINAL": "O vencimento desta obrigação é hoje. Trate este item com máxima prioridade.",
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function formatDateBR(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function sameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getDueDateForCurrentCycle(today: Date, dueDay: number): Date {
  const year = today.getFullYear()
  const month = today.getMonth()

  const currentMonthLastDay = new Date(year, month + 1, 0).getDate()
  const safeDueDayCurrentMonth = Math.min(dueDay, currentMonthLastDay)
  const dueDateCurrentMonth = new Date(year, month, safeDueDayCurrentMonth)

  if (today.getDate() <= safeDueDayCurrentMonth) {
    return startOfDay(dueDateCurrentMonth)
  }

  const nextMonthDate = new Date(year, month + 1, 1)
  const nextYear = nextMonthDate.getFullYear()
  const nextMonth = nextMonthDate.getMonth()
  const nextMonthLastDay = new Date(nextYear, nextMonth + 1, 0).getDate()
  const safeDueDayNextMonth = Math.min(dueDay, nextMonthLastDay)

  return startOfDay(new Date(nextYear, nextMonth, safeDueDayNextMonth))
}

function getUniqueAlertDays(alertDays: unknown): number[] {
  const raw = Array.isArray(alertDays) ? alertDays : [10, 5, 1]
  const cleaned = raw.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n >= 0)
  return [...new Set(cleaned)].sort((a, b) => b - a)
}

function getTaskDefinitions(dueDate: Date, alertDays: number[]) {
  const largestAlert = alertDays.length > 0 ? Math.max(...alertDays) : 5
  const smallestAlert = alertDays.length > 0 ? Math.min(...alertDays) : 1

  return [
    {
      key: "INICIAR PRODUÇÃO",
      date: addDays(dueDate, -largestAlert),
      label: "Iniciar Produção",
      color: "#D2232A",
      message: messageByLabel["INICIAR PRODUÇÃO"],
    },
    {
      key: "ENVIAR AO CLIENTE",
      date: addDays(dueDate, -smallestAlert),
      label: "Enviar ao Cliente",
      color: "#f59e0b",
      message: messageByLabel["ENVIAR AO CLIENTE"],
    },
    {
      key: "VENCIMENTO FINAL",
      date: dueDate,
      label: "Vencimento Final",
      color: "#D2232A",
      message: messageByLabel["VENCIMENTO FINAL"],
    },
  ]
}

function generateEmailHtml(dept: string, tasks: SummaryTask[], isUnified = false) {
  const tasksHtml = tasks
    .map((t) => `
      <tr>
        <td style="padding: 14px 12px; border-bottom: 1px solid #eceff3; font-size: 14px; font-weight: 600; color: #334155;">
          ${t.name} ${isUnified ? `<br/><span style="font-size: 10px; color: #94a3b8; text-transform: uppercase;">Setor: ${t.deptOrig}</span>` : ""}
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #eceff3; font-size: 13px; color: #64748b; text-align: center;">
          ${t.label}
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #eceff3; font-size: 13px; color: #64748b; text-align: center;">
          ${t.dueDateLabel}
        </td>
        <td style="padding: 14px 12px; border-bottom: 1px solid #eceff3; text-align: center;">
          <span style="display: inline-block; padding: 6px 10px; border-radius: 8px; background: #fdecec; color: #D2232A; font-size: 10px; font-weight: 700; text-transform: uppercase;">
            ${t.label}
          </span>
        </td>
      </tr>
      <tr>
        <td colspan="4" style="padding: 10px 12px 18px 12px; border-bottom: 2px solid #f1f5f9;">
          <div style="font-size: 12px; line-height: 1.5; color: #64748b;">${t.message}</div>
        </td>
      </tr>
    `)
    .join("")

  const title = isUnified ? "Visão Geral Unificada" : `Resumo do Departamento ${dept}`
  const subtitle = isUnified ? "Auditoria e Monitoramento Global" : "Acompanhamento operacional do departamento"

  return `
  <div style="margin: 0; padding: 32px 20px; background: #f5f6f8; font-family: Arial, sans-serif;">
    <div style="max-width: 760px; margin: 0 auto; background: #ffffff; border: 1px solid #e7eaee; border-radius: 22px; overflow: hidden;">
      <div style="padding: 42px 48px; text-align: center;">
        <div style="font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #b6c0cc; text-transform: uppercase; margin-bottom: 10px;">Painel Operacional JLVIANA</div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 400; color: #4b5563;">
          Tarefas do <span style="color: #D2232A; font-weight: 700;">Dia</span>
        </h1>
        <div style="margin-top: 10px; font-size: 12px; letter-spacing: 1px; color: #b8c2cf; text-transform: uppercase; font-weight: 600;">${subtitle}</div>
      </div>
      <div style="padding: 0 40px 20px 40px;">
        <p style="font-size: 15px; color: #556274;">Olá <strong>${dept}</strong>,</p>
        <p style="font-size: 14px; color: #5f6f82; line-height: 1.6;">Abaixo está o resumo das demandas operacionais para hoje.</p>
      </div>
      <div style="padding: 20px 40px;">
        <table width="100%" style="border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f3f6;">
              <th style="padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #5b7088;">Obrigação</th>
              <th style="padding: 12px; text-align: center; font-size: 11px; text-transform: uppercase; color: #5b7088;">Etapa</th>
              <th style="padding: 12px; text-align: center; font-size: 11px; text-transform: uppercase; color: #5b7088;">Vencimento</th>
              <th style="padding: 12px; text-align: center; font-size: 11px; text-transform: uppercase; color: #5b7088;">Status</th>
            </tr>
          </thead>
          <tbody>${tasksHtml}</tbody>
        </table>
      </div>
      <div style="padding: 30px 40px; text-align: center; border-top: 1px solid #edf1f5;">
        <p style="font-size: 11px; color: #a0acb8;">JLVIANA CONECTA • Organização • Estratégia • Conformidade</p>
      </div>
    </div>
  </div>
  `
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const { data: branding } = await supabase
      .from("branding_settings")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .single()

    const { data: obligations } = await supabase
      .from("obligations")
      .select("*")
      .eq("is_active", true)

    const today = startOfDay(new Date())
    const summaryKeys = new Set<string>()

    const summaries: Record<string, SummaryTask[]> = {
      Fiscal: [],
      DP: [],
      Contábil: [],
      Contabil: [], // Compatibilidade sem acento
    }

    const allTasksForToday: SummaryTask[] = []

      ; (obligations as ObligationRow[] | null)?.forEach((o) => {
        if (!o?.department || !summaries[o.department]) return
        if (!o?.name || !o?.default_due_day) return

        const alertDays = getUniqueAlertDays(o.alert_days)
        const dueDate = getDueDateForCurrentCycle(today, Number(o.default_due_day))
        const taskDefinitions = getTaskDefinitions(dueDate, alertDays)

        taskDefinitions.forEach((taskDef) => {
          if (!sameDate(today, taskDef.date)) return

          const uniqueKey = [o.department, o.id || o.name, taskDef.label, formatDateBR(dueDate)].join("::")
          if (summaryKeys.has(uniqueKey)) return
          summaryKeys.add(uniqueKey)

          const task = {
            id: uniqueKey,
            name: o.name,
            label: taskDef.label,
            color: taskDef.color,
            icon: "",
            message: taskDef.message,
            dueDateLabel: formatDateBR(dueDate),
            deptOrig: o.department
          }

          summaries[o.department].push(task)
          allTasksForToday.push(task)
        })
      })

    const results = []

    // 1. Disparar para os departamentos individuais
    const deptConfigs = [
      { name: "Fiscal", email: branding?.fiscal_email },
      { name: "DP", email: branding?.dp_email },
      { name: "Contábil", email: branding?.contabil_email }
    ]

    for (const config of deptConfigs) {
      // Buscar tarefas tanto para "Contábil" quanto para "Contabil"
      const deptTasks = summaries[config.name] || [];
      const alternateName = config.name === "Contábil" ? "Contabil" : null;
      const altTasks = alternateName ? (summaries[alternateName] || []) : [];

      const tasksToSend = [...deptTasks, ...altTasks];

      if (!config.email || tasksToSend.length === 0) {
        console.log(`Pulando ${config.name}: e-mail vazio ou sem tarefas.`);
        continue
      }

      const html = generateEmailHtml(config.name, tasksToSend)
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "JLVIANA Consultoria Contábil <comunicado@jlviana.com>",
          to: [config.email],
          subject: `JLVIANA CONECTA | Boletim Operacional - ${config.name}`,
          html
        }),
      })

      if (res.ok) {
        console.log(`E-mail enviado com sucesso para ${config.name} (${config.email})`);
        await supabase.from("obligation_alerts_sent").insert({
          alert_day: 0,
          competency: `BOLETIM ${config.name.toUpperCase()} • ${pad2(today.getMonth() + 1)}/${today.getFullYear()}`
        })
      } else {
        console.error(`Erro ao enviar para ${config.name}:`, await res.text());
      }
      results.push({ target: config.name, status: res.status })
    }

    // 2. Disparar o Resumo Unificado (Qualidade e Diretoria)
    if (allTasksForToday.length > 0) {
      const unifiedHtml = generateEmailHtml("Diretoria e Qualidade", allTasksForToday, true)
      const unifiedRecipients = [branding?.quality_email, branding?.board_email].filter(Boolean) as string[]

      if (unifiedRecipients.length > 0) {
        const unifiedRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({
            from: "JLVIANA Consultoria Contábil <comunicado@jlviana.com>",
            to: unifiedRecipients,
            subject: `JLVIANA CONECTA | Resumo Geral do Dia - Auditoria`,
            html: unifiedHtml
          }),
        })
        results.push({ target: "Unified (Qualidade/Diretoria)", status: unifiedRes.status, emails: unifiedRecipients })
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    })

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    })
  }
})