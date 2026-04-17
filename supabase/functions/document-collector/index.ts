import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// Setup da API de Email Resend
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
    try {
        // Inicializa o cliente do Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Descobrir qual dia é hoje (0 a 31)
        const today = new Date()
        const currentDay = today.getDate()

        // Ajuste de fuso horário brasileiro (se necessário)
        const referenceMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString()

        console.log(`Iniciando Robô de Cobrança - Dia de hoje: ${currentDay}`)

        // URL base do seu painel (em produção você define o secret FRONTEND_URL na Supabase)
        const BASE_URL = Deno.env.get('FRONTEND_URL') || "http://localhost:8080";

        // =========================================================================
        // A. COBRANÇA INICIAL
        // =========================================================================
        
        // 2. Buscar regras configuradas para HOJE
        const { data: triggerRules, error: triggerError } = await supabase
            .from('collection_rules')
            .select('*')
            .eq('is_active', true)
            .eq('send_day', currentDay)

        if (triggerError) throw triggerError;

        if (triggerRules && triggerRules.length > 0) {
            console.log(`Encontradas ${triggerRules.length} regras para disparo inicial hoje.`)

            for (const rule of triggerRules) {
                const { data: ruleClients } = await supabase
                    .from('collection_rule_clients')
                    .select('clients(*)')
                    .eq('rule_id', rule.id)
                
                const clientsToEmail = ruleClients?.map(rc => rc.clients).filter(c => c && c.is_active === true && c.email) || [];

                for (const client of clientsToEmail) {
                    
                    // PASSO 1: CRIAR O EVENTO PRIMEIRO (Para termos o ID único do Link Mágico!)
                    const { data: newEvent, error: insertError } = await supabase.from('collection_events').insert({
                        rule_id: rule.id,
                        client_id: client.id,
                        reference_month: referenceMonth,
                        status: 'pending',
                        sent_at: new Date().toISOString()
                    }).select('id').single();

                    if (insertError) {
                        console.error('Erro ao gerar controle do evento:', insertError);
                        continue;
                    }

                    // PASSO 2: MONTAR O E-MAIL COM O LINK MÁGICO
                    const personalizedMessage = rule.template.replace(/{{nome_fantasia}}/g, client.nome_fantasia || client.razao_social || 'Cliente');
                    const uploadLink = `${BASE_URL}/envio-cobranca/${newEvent.id}`;

                    const { error: emailError } = await supabase.rpc('send_email_with_resend', {
                        to_email: client.email,
                        subject: "Solicitação Oficial de Documentos Contábeis",
                        html_content: `
                            <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; overflow: hidden;">
                                    <div style="padding: 40px;">
                                        <h2 style="text-align: center; color: #1e293b; font-size: 24px; margin-bottom: 30px; margin-top: 0;">
                                            Solicitação de <span style="color: #ef4444;">Documentos</span>
                                        </h2>
                                        <div style="color: #475569; font-size: 15px; line-height: 1.6;">
                                            ${personalizedMessage.replace(/\n/g, '<br>')}
                                        </div>
                                        
                                        <div style="text-align: center; margin-top: 40px; margin-bottom: 10px;">
                                            <a href="${uploadLink}" style="background-color: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">
                                                📤 Enviar Meus Documentos Agora
                                            </a>
                                            <p style="font-size: 12px; color: #94a3b8; margin-top: 16px; margin-bottom: 0;">
                                                Link único, seguro e criptografado exclusivo para sua empresa.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `
                    });

                    if (emailError) {
                        console.error('Erro ao enviar RPC:', emailError)
                    }
                }
            }
        }

        // =========================================================================
        // B. RECOBRANÇA (Aviso de Atraso / Pendência)
        // =========================================================================
        
        const { data: followUpRules, error: followUpError } = await supabase
            .from('collection_rules')
            .select('*')
            .eq('is_active', true)
            .eq('follow_up_day', currentDay)

        if (!followUpError && followUpRules && followUpRules.length > 0) {
            console.log(`Encontradas ${followUpRules.length} regras para RECOBRANÇA hoje.`)

            for (const rule of followUpRules) {
                const { data: events } = await supabase
                    .from('collection_events')
                    .select('*, clients(*)')
                    .eq('rule_id', rule.id)
                    .eq('status', 'pending')
                    .is('follow_up_at', null)

                for (const event of events || []) {
                    const client = event.clients;
                    if (!client || !client.email) continue;

                    // Na Recobrança o Evento JÁ Existe! É só aproveitar a ID dele.
                    const uploadLink = `${BASE_URL}/envio-cobranca/${event.id}`;

                    const { error: emailError } = await supabase.rpc('send_email_with_resend', {
                        to_email: client.email,
                        subject: "URGENTE: Pendência de Documentação Contábil",
                        html_content: `
                            <div style="background-color: #f8fafc; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; overflow: hidden;">
                                    <div style="padding: 40px;">
                                        <h2 style="text-align: center; color: #1e293b; font-size: 24px; margin-bottom: 30px; margin-top: 0;">
                                            Aviso de <span style="color: #ef4444;">Pendência</span>
                                        </h2>
                                        <div style="color: #475569; font-size: 15px; line-height: 1.6;">
                                            <p>Olá <strong>${client.nome_fantasia || client.razao_social}</strong>,</p>
                                            <p>Ainda não identificamos o recebimento dos seus documentos contábeis referentes à nossa solicitação anterior.</p>
                                            <p>O prazo estabelecido expirou e precisamos destes documentos com urgência para dar continuidade nas apurações e evitar possíveis sanções ou multas para a sua empresa.</p>
                                            <br>
                                            <p>Atenciosamente,</p>
                                            <p><strong>JLVIANA Consultoria Contábil</strong></p>
                                        </div>
                                        
                                        <div style="text-align: center; margin-top: 40px; margin-bottom: 10px;">
                                            <a href="${uploadLink}" style="background-color: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">
                                                ⚠️ Regularizar e Anexar Documentos
                                            </a>
                                            <p style="font-size: 12px; color: #94a3b8; margin-top: 16px; margin-bottom: 0;">
                                                Acesso Exclusivo e Seguro
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `
                    });

                    if (!emailError) {
                        await supabase.from('collection_events').update({
                            status: 'follow_up_sent',
                            follow_up_at: new Date().toISOString()
                        }).eq('id', event.id)
                    } else {
                        console.error('Erro na Recobrança RPC:', emailError)
                    }
                }
            }
        }

        return new Response(JSON.stringify({ status: "success", executed_day: currentDay }), {
            headers: { "Content-Type": "application/json" },
        })
        
    } catch (error) {
        console.error("Erro no processamento:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        })
    }
})
