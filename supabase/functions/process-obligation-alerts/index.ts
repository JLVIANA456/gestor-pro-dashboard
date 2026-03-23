
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Using the same key as other functions
const RESEND_API_KEY = "re_LKH1oeKs_BFV4KuoXshpPFBnCtEed5yvL" 
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // Force target date to be "Today" in Brazil (UTC-3) for logic consistency
    // Even if server is UTC, we want to match the user's "Today"
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const competency = `${String(currentMonth).padStart(2, '0')}/${currentYear}`

    console.log(`[ALERT_ENGINE] --- START PROCESS --- Date: ${now.toISOString()}`);
    console.log(`[ALERT_ENGINE] Competency: ${competency}`);

    const { data: obligations, error: fetchError } = await supabase
      .from('obligations')
      .select('*')
      .eq('is_active', true)

    if (fetchError) throw fetchError;

    console.log(`[ALERT_ENGINE] Found ${obligations?.length || 0} active obligations.`);

    const emailsSent = []

    for (const obligation of obligations) {
      const { id, name, default_due_day, alert_days, alert_recipient_email, department, type } = obligation
      
      console.log(`[ALERT_ENGINE] Checking: "${name}" | Due Day: ${default_due_day} | Rules: ${alert_days}`);

      if (!alert_days || !Array.isArray(alert_days)) {
        console.log(`[ALERT_ENGINE] --> Skipping "${name}": No alert rules defined.`);
        continue;
      }

      for (const alertDayCount of alert_days) {
        // Calculate alert date based on the due date of THIS month
        const dueDate = new Date(currentYear, currentMonth - 1, default_due_day)
        const alertDate = new Date(dueDate.getTime())
        alertDate.setDate(dueDate.getDate() - alertDayCount)

        const isToday = alertDate.toDateString() === now.toDateString();
        
        console.log(`[ALERT_ENGINE] Rule: ${alertDayCount}d | Target Alert Date: ${alertDate.toDateString()} | Match Today: ${isToday}`);

        if (isToday) {
          console.log(`[ALERT_ENGINE] --> MATCH! It is time to alert for "${name}" (${alertDayCount} days)`);
          
          // Check if already sent
          const { data: alreadySent } = await supabase
            .from('obligation_alerts_sent')
            .select('*')
            .eq('obligation_id', id)
            .eq('alert_day', alertDayCount)
            .eq('competency', competency)
            .single()

          if (alreadySent) {
            console.log(`[ALERT_ENGINE] --> INFO: Alert already sent previously for this competency.`);
            continue;
          }

          // Build recipients
          const recipients = [
            'dp@jlviana.com.br', 
            'fiscal@jlviana.com.br', 
            'contabilidade@jlviana.com.br', 
            'qualidade@jlviana.com.br'
          ]
          
          if (alert_recipient_email) {
            const extraEmails = alert_recipient_email
              .split(/[,,;]/)
              .map((e: string) => e.trim())
              .filter((e: string) => e && e.includes('@'))
            for (const email of extraEmails) {
               if (!recipients.includes(email)) recipients.push(email)
            }
          }

          console.log(`[ALERT_ENGINE] Sending to: ${recipients.join(', ')}`);

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: 'JLVIANA Consultoria Contábil <avisos@jlviana.com>',
              to: recipients,
              subject: `🚨 Alerta JLVIANA: ${name} (${alertDayCount} dias para o vencimento)`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
                  <h2 style="color: #ef4444; font-weight: 300;">Alerta de Obrigação Próxima</h2>
                  <p style="font-size: 14px; color: #555;">Olá, <strong>Departamento ${department}</strong>,</p>
                  <p style="font-size: 14px; color: #555;">Faltam <strong>${alertDayCount} dias</strong> para o vencimento da seguinte obrigação:</p>
                  
                  <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Obrigação:</strong> ${name}</p>
                    <p style="margin: 5px 0;"><strong>Tipo:</strong> ${type}</p>
                    <p style="margin: 5px 0;"><strong>Vencimento:</strong> Dia ${default_due_day}</p>
                    <p style="margin: 5px 0;"><strong>Competência:</strong> ${competency}</p>
                  </div>
                  <p style="font-size: 12px; color: #999;">Aviso automático. Verifique a pendência no sistema.</p>
                  <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                  <p style="font-size: 10px; color: #ccc; text-align: center;">JLConecta & JLVIANA Consultoria Contábil</p>
                </div>
              `,
            }),
          })

          if (res.ok) {
            console.log(`[ALERT_ENGINE] Success! E-mail sent.`);
            await supabase.from('obligation_alerts_sent').insert({
              obligation_id: id,
              alert_day: alertDayCount,
              competency: competency
            })
            emailsSent.push({ obligation: name, recipients, days: alertDayCount })
          } else {
            console.error(`[ALERT_ENGINE] ERROR: Resend API failed.`, await res.text());
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Concluído', emailsSent }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (error) {
    console.error(`[ALERT_ENGINE] CRITICAL ERROR:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
