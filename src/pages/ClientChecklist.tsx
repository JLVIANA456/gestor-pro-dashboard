import React, { useState, useEffect, useMemo } from 'react';
import {
    ClipboardCheck,
    Building2,
    Users,
    Briefcase,
    BookOpen,
    FileText,
    Send,
    Check,
    ChevronDown,
    Loader2,
    Info,
    Hash,
    Zap,
    Target,
    ShieldCheck,
    ArrowRight,
    Star,
    Layers,
    Activity,
    UserCheck,
    Coins,
    Calendar,
    FileMinus,
    Search,
    ChevronRight,
    Globe,
    Scale,
    PieChart,
    MailCheck,
    Lock,
    Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useClients } from '@/hooks/useClients';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import { ResendService } from '@/services/resendService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const EMAIL_RECIPIENTS = [
    'dp@jlviana.com.br',
    'fiscal@jlviana.com.br',
    'financeiro@jlviana.com.br',
    'bpo@jlviana.com.br',
    'contabil@jlviana.com.br',
    'contabilidade@jlviana.com.br'
];

export default function ClientChecklist() {
    const { clients, loading: lc } = useClients();

    // UI state
    const [openClient, setOpenClient] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeSection, setActiveSection] = useState('identificacao');
    const [selectedEmails, setSelectedEmails] = useState<string[]>(EMAIL_RECIPIENTS);

    const [selectedClientId, setSelectedClientId] = useState('');

    // Form inputs - Dados da Empresa
    const [razaoSocial, setRazaoSocial] = useState('');
    const [nomeFantasia, setNomeFantasia] = useState('');
    const [responsavelEmpresa, setResponsavelEmpresa] = useState('');
    const [hasEmployees, setHasEmployees] = useState(false);
    const [isServiceTaker, setIsServiceTaker] = useState(false);
    const [nire, setNire] = useState('');
    const [naturezaJuridica, setNaturezaJuridica] = useState('');
    const [ccm, setCcm] = useState('');
    const [dataEntrada, setDataEntrada] = useState('');
    const [dataSaida, setDataSaida] = useState('');
    const [proLabore, setProLabore] = useState('');
    const [regimeEscrituracao, setRegimeEscrituracao] = useState('');
    const [responsavelDp, setResponsavelDp] = useState('');
    const [responsavelFiscal, setResponsavelFiscal] = useState('');
    const [responsavelContabil, setResponsavelContabil] = useState('');
    const [cnpj, setCnpj] = useState('');

    // Atividades
    const [cnaePrincipal, setCnaePrincipal] = useState('');
    const [cnaeSecundarias, setCnaeSecundarias] = useState('');

    // Enquadramento
    const [regimeTributario, setRegimeTributario] = useState('');
    const [atividadePredominante, setAtividadePredominante] = useState('');
    const [estruturaSocietaria, setEstruturaSocietaria] = useState('');
    const [obsEstrategica, setObsEstrategica] = useState('');

    // Demandas por Depto
    const [demandaFiscal, setDemandaFiscal] = useState('✔ Parametrização para prestação de serviços (ISS)\n✔ Configuração do regime Lucro Presumido\n✔ Vinculação do sócio administrador');
    const [demandaDP, setDemandaDP] = useState('✔ Empresa sem funcionários e sem pró-labore neste momento');
    const [demandaContabil, setDemandaContabil] = useState('✔ Cadastro inicial e lançamento do capital social\n✔ Definição de plano de contas adequado');
    const [demandaQualidade, setDemandaQualidade] = useState('✔ Auditoria inicial de conformidade\n✔ Verificação de padrões de atendimento\n✔ Checklist de boas-vindas');

    const [dataAberturaCnpj, setDataAberturaCnpj] = useState('');
    const [tipoAtividade, setTipoAtividade] = useState('servicos'); // servicos, comercio, holding
    const [origemContabil, setOrigemContabil] = useState('jlviana'); // anterior, jlviana
    const [statusBpo, setStatusBpo] = useState('nao_contratado'); // contratado, nao_contratado

    // Documentos
    const [documentos, setDocumentos] = useState('✔ Contrato Social (Ficha de Inteiro Teor)\n✔ Cartão CNPJ\n✔ CCM');

    const filteredClients = useMemo(() => {
        return (clients || []).filter(c => c.isActive);
    }, [clients]);

    // Fill data when client is selected
    const handleClientSelect = (clientId: string) => {
        setSelectedClientId(clientId);
        const client = clients.find(c => c.id === clientId);
        if (client) {
            setRazaoSocial(client.razaoSocial || '');
            setNomeFantasia(client.nomeFantasia || '');
            setResponsavelEmpresa(client.responsavelEmpresa || '');
            setHasEmployees(!!client.hasEmployees);
            setIsServiceTaker(!!client.isServiceTaker);
            setCnpj(client.cnpj || '');
            setRegimeTributario(client.regimeTributario || '');
            setCcm(client.ccm || '');
            setDataEntrada(client.dataEntrada || '');
            setDataSaida(client.dataSaida || '');
            setProLabore(client.proLabore || '');
            setRegimeEscrituracao(client.regimeEscrituracao || '');
            setResponsavelDp(client.responsavelDp || '');
            setResponsavelFiscal(client.responsavelFiscal || '');
            setResponsavelContabil(client.responsavelContabil || '');

            // Map new optional fields if they exist in the client record
            if (client.dataAberturaCnpj) setDataAberturaCnpj(client.dataAberturaCnpj);
            if (client.tipoAtividade) setTipoAtividade(client.tipoAtividade);
            if (client.origemContabil) setOrigemContabil(client.origemContabil);
            if (client.statusBpo) setStatusBpo(client.statusBpo);

            if (client.quadroSocietario && client.quadroSocietario.length > 0) {
                setEstruturaSocietaria(client.quadroSocietario.map(s => `${s.nome} (${s.participacao}%)`).join(', '));
            }

            toast.success('Perfil Selecionado', {
                description: `${client.razaoSocial} carregado.`
            });
            setTimeout(() => setActiveSection('corporativo'), 600);
        }
    };

    const handleSendChecklist = async () => {
        if (!razaoSocial) {
            toast.error('Razão Social é obrigatória');
            return;
        }

        try {
            setSubmitting(true);

            if (selectedEmails.length === 0) {
                toast.error('Selecione pelo menos um destinatário');
                return;
            }

            const formattedDate = dataEntrada
                ? dataEntrada.split('-').reverse().join('/')
                : new Date().toLocaleDateString('pt-BR');

            const emailHtml = `
                <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; background-color: #fcfcfc; border: 1px solid #f0f0f0; border-radius: 24px; overflow: hidden; color: #334155;">
                    <!-- Top Ribbon -->
                    <div style="background: #D2232A; padding: 40px; text-align: center;">
                        <span style="background: rgba(255,255,255,0.15); color: #fff; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; padding: 6px 12px; border-radius: 50px;">Checklist de Integração</span>
                        <div style="color: rgba(255,255,255,0.8); margin: 15px 0 5px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Cliente Novo</div>
                        <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: -0.01em;">${razaoSocial}</h1>
                    </div>

                    <div style="padding: 40px;">
                        <!-- Primary Identity Block -->
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; background: #fff; padding: 25px; border-radius: 20px; border: 1px solid #f1f5f9;">
                            <div>
                                <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px;">CNPJ</span>
                                <span style="font-size: 14px; font-weight: 600; color: #1e293b;">${cnpj}</span>
                            </div>
                            <div>
                                <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px;">Data Abertura CNPJ</span>
                                <span style="font-size: 14px; font-weight: 600; color: #1e293b;">${dataAberturaCnpj ? dataAberturaCnpj.split('-').reverse().join('/') : '-'}</span>
                            </div>
                            <div>
                                <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px;">Regime Tributário</span>
                                <span style="font-size: 14px; font-weight: 600; color: #1e293b; text-transform: uppercase;">${regimeTributario}</span>
                            </div>
                            <div>
                                <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px;">Data de Entrada</span>
                                <span style="font-size: 14px; font-weight: 600; color: #1e293b;">${formattedDate}</span>
                            </div>
                            
                            <div style="padding-top: 15px; border-top: 1px solid #f8fafc;">
                                <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px;">Tipo Atividade</span>
                                <span style="font-size: 14px; font-weight: 800; color: #D2232A; text-transform: uppercase;">${tipoAtividade}</span>
                            </div>
                            <div style="padding-top: 15px; border-top: 1px solid #f8fafc;">
                                <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px;">Pró-labore</span>
                                <span style="font-size: 14px; font-weight: 800; color: #1e293b;">${proLabore || 'SEM PRÓ-LABORE'}</span>
                            </div>
                            <div style="padding-top: 15px; border-top: 1px solid #f8fafc;">
                                <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 5px;">Funcionários</span>
                                <span style="font-size: 14px; font-weight: 800; color: #1e293b;">${hasEmployees ? 'SIM' : 'NÃO'}</span>
                            </div>
                        </div>

                        <!-- Responsibility Section -->
                        <div style="margin-bottom: 40px;">
                            <h3 style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #D2232A; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Equipe Responsável</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f8fafc;">
                                        <span style="font-size: 12px; color: #64748b;">Fiscal:</span><br>
                                        <strong style="font-size: 14px; color: #1e293b;">${responsavelFiscal || 'Não definido'}</strong>
                                    </td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f8fafc;">
                                        <span style="font-size: 12px; color: #64748b;">Pessoal:</span><br>
                                        <strong style="font-size: 14px; color: #1e293b;">${responsavelDp || 'Não definido'}</strong>
                                    </td>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f8fafc;">
                                        <span style="font-size: 12px; color: #64748b;">Contábil:</span><br>
                                        <strong style="font-size: 14px; color: #1e293b;">${responsavelContabil || 'Não definido'}</strong>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <!-- Directives / Demands Section -->
                        <div style="margin-bottom: 40px;">
                            <h3 style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; margin-bottom: 25px;">Plano de Ação Departamental</h3>
                            
                            <!-- Fiscal -->
                            <div style="background: #fff; border-left: 4px solid #D2232A; border-radius: 0 15px 15px 0; padding: 25px; margin-bottom: 20px; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
                                <strong style="font-size: 11px; color: #D2232A; text-transform: uppercase; display: block; margin-bottom: 10px;">Departamento Fiscal</strong>
                                <div style="font-size: 13px; line-height: 1.6; color: #475569; white-space: pre-wrap;">${demandaFiscal}</div>
                            </div>
                            
                            <!-- DP -->
                            <div style="background: #fff; border-left: 4px solid #10b981; border-radius: 0 15px 15px 0; padding: 25px; margin-bottom: 20px; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
                                <strong style="font-size: 11px; color: #10b981; text-transform: uppercase; display: block; margin-bottom: 10px;">Departamento Pessoal</strong>
                                <div style="font-size: 13px; line-height: 1.6; color: #475569; white-space: pre-wrap;">${demandaDP}</div>
                            </div>

                            <!-- Contábil -->
                            <div style="background: #fff; border-left: 4px solid #3b82f6; border-radius: 0 15px 15px 0; padding: 25px; margin-bottom: 20px; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
                                <strong style="font-size: 11px; color: #3b82f6; text-transform: uppercase; display: block; margin-bottom: 10px;">Departamento Contábil</strong>
                                <div style="font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px;">Origem: ${origemContabil === 'jlviana' ? 'Abertura JLVIANA' : 'Transferência Anterior'}</div>
                                <div style="font-size: 13px; line-height: 1.6; color: #475569; white-space: pre-wrap;">${demandaContabil}</div>
                            </div>

                            <!-- Qualidade -->
                            <div style="background: #fff; border-left: 4px solid #f59e0b; border-radius: 0 15px 15px 0; padding: 25px; margin-bottom: 20px; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
                                <strong style="font-size: 11px; color: #f59e0b; text-transform: uppercase; display: block; margin-bottom: 10px;">Departamento de Qualidade</strong>
                                <div style="font-size: 13px; line-height: 1.6; color: #475569; white-space: pre-wrap;">${demandaQualidade}</div>
                            </div>

                            <!-- BPO -->
                            <div style="background: #fff; border-left: 4px solid #64748b; border-radius: 0 15px 15px 0; padding: 25px; margin-bottom: 20px; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
                                <strong style="font-size: 11px; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 10px;">Departamento BPO</strong>
                                <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Status do Contrato: ${statusBpo.toUpperCase()}</div>
                                <div style="font-size: 13px; line-height: 1.6; color: #475569; font-style: italic;">Aguardando alinhamento estratégico para integração BPO Financeiro.</div>
                            </div>

                            <!-- Financeiro -->
                            <div style="background: #fff; border-left: 4px solid #9333ea; border-radius: 0 15px 15px 0; padding: 25px; margin-bottom: 20px; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
                                <strong style="font-size: 11px; color: #9333ea; text-transform: uppercase; display: block; margin-bottom: 10px;">Departamento Financeiro</strong>
                                <div style="font-size: 13px; line-height: 1.6; color: #475569;">Responsável por providenciar a elaboração do contrato.</div>
                            </div>
                        </div>

                        <!-- Strategic Observation -->
                        <div style="background: #f8fafc; border-radius: 20px; padding: 25px; margin-bottom: 40px;">
                            <h4 style="font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin: 0 0 15px 0;">Diretriz Estratégica JLVIANA</h4>
                            <p style="font-size: 14px; font-style: italic; line-height: 1.6; color: #64748b; margin: 0;">"${obsEstrategica || 'Nenhuma diretriz adicional definida.'}"</p>
                        </div>

                        <!-- Sócio Grid -->
                        <div style="margin-bottom: 40px;">
                             <h3 style="font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; margin-bottom: 15px;">Estrutura Societária</h3>
                             <p style="font-size: 13px; color: #475569;">${estruturaSocietaria || 'Pendente de detalhamento'}</p>
                        </div>

                        <!-- Documents Section -->
                        <div style="background: #fff; border: 1px dashed #cbd5e1; border-radius: 20px; padding: 25px;">
                            <h4 style="font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; margin: 0 0 15px 0;">Documentação Mapeada</h4>
                            <div style="font-size: 12px; line-height: 1.6; color: #64748b; white-space: pre-wrap;">${documentos}</div>
                        </div>

                        <!-- Footer -->
                        <div style="margin-top: 50px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 30px;">
                            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 5px;">Este é um disparo automático via protocolo JLV-ONB-24.</p>
                            <p style="font-size: 13px; font-weight: 700; color: #1e293b;">JLVIANA GESTÃO CONTÁBIL</p>
                        </div>
                    </div>
                </div>
            `;

            await ResendService.sendEmail({
                to: selectedEmails.join(','),
                subject: `CHECKLIST CLIENTE NOVO - ${razaoSocial}`,
                html: emailHtml
            });

            toast.success('Checklist enviado com sucesso!');
            setSelectedClientId('');
            setActiveSection('identificacao');
        } catch (error) {
            toast.error('Erro ao enviar checklist');
        } finally {
            setSubmitting(false);
        }
    };

    if (lc) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-slate-50 p-6 font-primary text-slate-700">
            {/* Nav - Clean Vertical */}
            <div className="w-[300px] flex flex-col gap-6 mr-6">
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 transition-transform hover:rotate-3">
                        <ClipboardCheck className="h-8 w-8" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-800">Checklist Cliente</h1>
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mt-1 italic">Protocolo JLVIANA</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-4 space-y-2">
                    {[
                        { id: 'identificacao', label: 'Seleção', icon: Search },
                        { id: 'corporativo', label: 'Empresa', icon: Building2 },
                        { id: 'societario', label: 'Equipe & Sócios', icon: Users },
                        { id: 'demandas', label: 'Planos Depto', icon: Zap },
                        { id: 'finalizacao', label: 'Envio Final', icon: MailCheck },
                    ].map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative",
                                activeSection === s.id
                                    ? "bg-primary/5 text-primary border border-primary/20"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <s.icon className={cn("h-5 w-5", activeSection === s.id ? "text-primary" : "text-slate-300")} />
                            <span className="font-bold text-sm">{s.label}</span>
                            {activeSection === s.id && <motion.div layoutId="nav-glow" className="absolute left-0 w-1 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(210,35,42,0.5)]" />}
                        </button>
                    ))}
                </div>

                {selectedClientId && (
                    <div className="bg-primary/5 rounded-[2rem] border border-primary/10 p-6 flex flex-col gap-3">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Sincronização Ativa</p>
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-xs font-bold truncate max-w-[200px] text-slate-800">{razaoSocial}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Area - Card Grid Style */}
            <div className="flex-1 overflow-hidden flex flex-col gap-6">

                {/* Header Information Bar */}
                <div className="bg-white h-20 rounded-[1.5rem] shadow-sm border border-slate-200 flex items-center justify-between px-10">
                    <div className="flex items-center gap-3">
                        <Info className="h-4 w-4 text-slate-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status de Onboarding: </span>
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">AGUARDANDO PROTOCOLO</span>
                    </div>
                    <div className="flex items-center gap-8 opacity-40">
                        <div className="flex items-center gap-2"><ShieldCheck className="h-3 w-3" /><span className="text-[10px] font-bold">AES-256</span></div>
                        <div className="flex items-center gap-2"><Lock className="h-3 w-3" /><span className="text-[10px] font-bold">SECURE_SYNC</span></div>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 relative overflow-hidden flex flex-col">
                    <AnimatePresence mode="wait">
                        {activeSection === 'identificacao' && (
                            <motion.div
                                key="step-1"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                            >
                                <div className="max-w-xl space-y-10">
                                    <h2 className="text-5xl font-black text-slate-800 tracking-tighter leading-none">
                                        Selecione a <br />
                                        <span className="text-primary italic">empresa.</span>
                                    </h2>
                                    <p className="text-slate-400 text-lg font-medium leading-relaxed">Localize o parceiro cadastrado para carregar os dados e iniciar o checklist de departamentos.</p>

                                    <div className="relative">
                                        {!selectedClientId ? (
                                            <Popover open={openClient} onOpenChange={setOpenClient}>
                                                <PopoverTrigger asChild>
                                                    <Button className="w-full h-24 rounded-[2rem] bg-slate-50 hover:bg-white border-2 border-slate-100 hover:border-primary/30 transition-all text-xl font-bold text-slate-400 hover:text-slate-900 justify-between px-10 shadow-sm group">
                                                        Buscar por Razão ou CNPJ...
                                                        <Search className="h-6 w-6 text-slate-300 group-hover:text-primary transition-colors" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-[1.5rem] bg-white border border-slate-200 shadow-2xl z-[9999]">
                                                    <Command>
                                                        <CommandInput placeholder="Digite para filtrar..." className="h-16 px-6 text-lg border-none focus:ring-0" />
                                                        <CommandList className="max-h-[300px]">
                                                            <CommandEmpty className="p-10 text-slate-400 font-medium">Nenhum resultado.</CommandEmpty>
                                                            <CommandGroup>
                                                                {filteredClients.map(c => (
                                                                    <CommandItem key={c.id} onSelect={() => handleClientSelect(c.id)} className="flex items-center gap-4 py-4 px-6 cursor-pointer hover:bg-primary/5 transition-colors group">
                                                                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold group-hover:bg-primary group-hover:text-white">{c.razaoSocial?.charAt(0)}</div>
                                                                        <span className="font-bold text-slate-700">{c.razaoSocial}</span>
                                                                        <Check className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-30" />
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="w-full p-8 bg-white border-2 border-primary/20 rounded-[2.5rem] shadow-xl shadow-primary/5 flex items-center justify-between group"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                                        <Building2 className="h-8 w-8" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Empresa Vinculada</p>
                                                        <h4 className="text-2xl font-black text-slate-800">{razaoSocial}</h4>
                                                        <p className="text-xs font-mono text-slate-400">{cnpj}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => { setSelectedClientId(''); setRazaoSocial(''); }}
                                                    className="h-12 px-6 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                >
                                                    Alterar Cliente
                                                </Button>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'corporativo' && (
                            <motion.div
                                key="step-2"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex-1 p-16 space-y-12 overflow-y-auto"
                            >
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">Registro <span className="text-primary italic">Corporativo</span></h3>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Informações Fiscais e Legais</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Razão Social</Label>
                                        <Input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} className="h-16 rounded-2xl border-slate-200 bg-white shadow-sm font-bold text-slate-700 text-lg focus:ring-primary/20" />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nome Fantasia</Label>
                                        <Input value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} className="h-16 rounded-2xl border-slate-200 bg-white shadow-sm font-bold text-slate-700 text-lg focus:ring-primary/20" />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Responsável na Empresa</Label>
                                        <Input value={responsavelEmpresa} onChange={e => setResponsavelEmpresa(e.target.value)} className="h-16 rounded-2xl border-slate-200 bg-white shadow-sm font-bold text-slate-700 text-base focus:ring-primary/20" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">CCM Municipal</Label>
                                            <Input value={ccm} onChange={e => setCcm(e.target.value)} className="h-16 rounded-2xl border-slate-200 bg-white shadow-sm font-bold text-slate-700 focus:ring-primary/20" />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Protocolo NIRE</Label>
                                            <Input value={nire} onChange={e => setNire(e.target.value)} className="h-16 rounded-2xl border-slate-200 bg-white shadow-sm font-bold text-slate-700 focus:ring-primary/20" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-12">
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Calendar className="h-4 w-4 text-primary" /> Abertura CNPJ</h4>
                                        <input type="date" value={dataAberturaCnpj} onChange={e => setDataAberturaCnpj(e.target.value)} className="bg-transparent text-slate-800 font-bold outline-none text-sm" />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Globe className="h-4 w-4 text-primary" /> Tipo Atividade</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { id: 'servicos', label: 'Prestador' },
                                                { id: 'comercio', label: 'Comércio' },
                                                { id: 'holding', label: 'Holding' }
                                            ].map(opt => (
                                                <button key={opt.id} onClick={() => setTipoAtividade(opt.id)} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all", tipoAtividade === opt.id ? "bg-primary text-white" : "bg-slate-200 text-slate-500")}>{opt.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Scale className="h-4 w-4 text-primary" /> Regime</h4>
                                        <input value={regimeTributario} onChange={e => setRegimeTributario(e.target.value)} className="bg-transparent text-primary font-black outline-none text-sm uppercase placeholder:text-slate-300" placeholder="Ex: Lucro Presumido" />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><BookOpen className="h-4 w-4 text-primary" /> Escrituração</h4>
                                        <div className="flex gap-2">
                                            {['caixa', 'competencia'].map(r => (
                                                <button key={r} onClick={() => setRegimeEscrituracao(r)} className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all", regimeEscrituracao === r ? "bg-primary text-white" : "bg-slate-200 text-slate-500 hover:bg-slate-300")}>{r}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'societario' && (
                            <motion.div
                                key="step-3"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex-1 p-16 space-y-12"
                            >
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-slate-800 tracking-tight italic">Time & <span className="text-primary not-italic">Capital</span></h3>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Responsáveis e Quadro Societário</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col gap-8">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Responsáveis JLVIANA</h4>
                                        <div className="space-y-6">
                                            {[
                                                { label: 'Fiscal', val: responsavelFiscal, icon: Briefcase },
                                                { label: 'Pessoal', val: responsavelDp, icon: UserCheck },
                                                { label: 'Contábil', val: responsavelContabil, icon: Scale },
                                            ].map(r => (
                                                <div key={r.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{r.label}</span>
                                                        <span className="text-sm font-bold text-slate-700">{r.val || 'Não Definido'}</span>
                                                    </div>
                                                    <r.icon className="h-5 w-5 text-slate-200 group-hover:text-primary transition-colors" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2rem] flex flex-col gap-6">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><PieChart className="h-4 w-4 text-primary" /> Estrutura de Sócios</h4>
                                        <textarea
                                            value={estruturaSocietaria}
                                            onChange={e => setEstruturaSocietaria(e.target.value)}
                                            className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-500 font-medium leading-relaxed outline-none focus:border-primary/30 shadow-inner resize-none min-h-[100px]"
                                            placeholder="Descreva participações..."
                                        />

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex items-center justify-between px-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <Coins className="h-5 w-5 text-amber-500" />
                                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Pró-labore</span>
                                                </div>
                                                <input value={proLabore} onChange={e => setProLabore(e.target.value)} className="bg-transparent border-none outline-none text-right font-black text-primary text-base w-32" placeholder="R$ 0,00" />
                                            </div>

                                            <div onClick={() => setHasEmployees(!hasEmployees)} className={cn("flex items-center justify-between px-2 p-4 rounded-2xl border transition-all cursor-pointer shadow-sm", hasEmployees ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100")}>
                                                <div className="flex items-center gap-3">
                                                    <Briefcase className={cn("h-5 w-5", hasEmployees ? "text-emerald-500" : "text-slate-300")} />
                                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Funcionários</span>
                                                </div>
                                                <div className={cn("h-6 w-12 rounded-full relative transition-colors", hasEmployees ? "bg-emerald-500" : "bg-slate-200")}>
                                                    <div className={cn("bg-white h-4 w-4 rounded-full absolute top-1 transition-all", hasEmployees ? "right-1" : "left-1")} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'demandas' && (
                            <motion.div
                                key="step-4"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex-1 p-16 space-y-12 overflow-y-auto"
                            >
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">Demandas <span className="text-primary italic">Processuais</span></h3>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Alinhamento entre Departamentos</p>
                                </div>

                                <Tabs defaultValue="fiscal" className="w-full space-y-8">
                                    <div className="flex justify-center">
                                        <TabsList className="bg-slate-100/80 backdrop-blur-md p-1.5 h-16 rounded-[1.25rem] w-full max-w-4xl border border-slate-200/50 shadow-sm">
                                            {[
                                                { id: 'fiscal', title: 'Ação Fiscal', icon: Briefcase, color: 'text-primary' },
                                                { id: 'dp', title: 'Ação Pessoal', icon: Users, color: 'text-emerald-600' },
                                                { id: 'contabil', title: 'Ação Contábil', icon: BookOpen, color: 'text-blue-600' },
                                                { id: 'qualidade', title: 'Ação Qualidade', icon: Star, color: 'text-amber-600' },
                                            ].map(dept => (
                                                <TabsTrigger
                                                    key={dept.id}
                                                    value={dept.id}
                                                    className="flex-1 rounded-[1rem] data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-slate-900 text-slate-500 font-bold transition-all gap-3 h-full px-6"
                                                >
                                                    <dept.icon className={cn("h-4 w-4", dept.color)} />
                                                    <span className="text-[11px] uppercase tracking-wider">{dept.title}</span>
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>

                                    {/* Tabs Content Sections */}
                                    <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">

                                        {/* Fiscal */}
                                        <TabsContent value="fiscal" className="m-0 focus-visible:ring-0">
                                            <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                                    <div className="space-y-1">
                                                        <h4 className="text-xl font-black text-slate-800">Planejamento <span className="text-primary italic">Fiscal</span></h4>
                                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Escrituração e Obrigações Acessórias</p>
                                                    </div>
                                                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                        <Briefcase className="h-6 w-6" />
                                                    </div>
                                                </div>
                                                <Textarea
                                                    value={demandaFiscal}
                                                    onChange={e => setDemandaFiscal(e.target.value)}
                                                    className="min-h-[400px] text-base font-medium leading-relaxed border-none bg-slate-50/50 rounded-2xl p-8 focus-visible:ring-primary/20"
                                                    placeholder="Descreva as ações fiscais..."
                                                />
                                            </div>
                                        </TabsContent>

                                        {/* Pessoal */}
                                        <TabsContent value="dp" className="m-0 focus-visible:ring-0">
                                            <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                                    <div className="space-y-1">
                                                        <h4 className="text-xl font-black text-slate-800">Planejamento <span className="text-emerald-600 italic">Pessoal</span></h4>
                                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Rotinas de RH e Folha de Pagamento</p>
                                                    </div>
                                                    <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                                        <Users className="h-6 w-6" />
                                                    </div>
                                                </div>
                                                <Textarea
                                                    value={demandaDP}
                                                    onChange={e => setDemandaDP(e.target.value)}
                                                    className="min-h-[400px] text-base font-medium leading-relaxed border-none bg-slate-50/50 rounded-2xl p-8 focus-visible:ring-emerald-500/20"
                                                    placeholder="Descreva as ações de DP..."
                                                />
                                            </div>
                                        </TabsContent>

                                        {/* Contábil */}
                                        <TabsContent value="contabil" className="m-0 focus-visible:ring-0">
                                            <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                                    <div className="space-y-1">
                                                        <h4 className="text-xl font-black text-slate-800">Planejamento <span className="text-blue-600 italic">Contábil</span></h4>
                                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Conciliação, Balanços e Integração BPO</p>
                                                    </div>
                                                    <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                                        <BookOpen className="h-6 w-6" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-blue-600 tracking-widest ml-1">Origem do Cadastro</Label>
                                                        <div className="flex gap-2 p-1 bg-white rounded-xl border border-blue-100">
                                                            {[
                                                                { id: 'anterior', label: 'Transferência Anterior' },
                                                                { id: 'jlviana', label: 'Abertura JLVIANA' }
                                                            ].map(opt => (
                                                                <button key={opt.id} onClick={() => setOrigemContabil(opt.id)} className={cn("flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all", origemContabil === opt.id ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-blue-400 hover:bg-blue-50")}>{opt.label}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-blue-600 tracking-widest ml-1">Modalidade BPO Financeiro</Label>
                                                        <div className="flex gap-2 p-1 bg-white rounded-xl border border-blue-100">
                                                            {[
                                                                { id: 'contratado', label: 'Contratado' },
                                                                { id: 'nao_contratado', label: 'Não Contratado' }
                                                            ].map(opt => (
                                                                <button key={opt.id} onClick={() => setStatusBpo(opt.id)} className={cn("flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all", statusBpo === opt.id ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:bg-slate-50")}>{opt.label}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Textarea
                                                    value={demandaContabil}
                                                    onChange={e => setDemandaContabil(e.target.value)}
                                                    className="min-h-[300px] text-base font-medium leading-relaxed border-none bg-slate-50/50 rounded-2xl p-8 focus-visible:ring-blue-500/20"
                                                    placeholder="Descreva as ações contábeis..."
                                                />
                                            </div>
                                        </TabsContent>

                                        {/* Qualidade */}
                                        <TabsContent value="qualidade" className="m-0 focus-visible:ring-0">
                                            <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                                    <div className="space-y-1">
                                                        <h4 className="text-xl font-black text-slate-800">Garantia de <span className="text-amber-600 italic">Qualidade</span></h4>
                                                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Padrões de Atendimento e Conformidade</p>
                                                    </div>
                                                    <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                                        <Star className="h-6 w-6" />
                                                    </div>
                                                </div>
                                                <Textarea
                                                    value={demandaQualidade}
                                                    onChange={e => setDemandaQualidade(e.target.value)}
                                                    className="min-h-[400px] text-base font-medium leading-relaxed border-none bg-slate-50/50 rounded-2xl p-8 focus-visible:ring-amber-500/20"
                                                    placeholder="Descreva as ações de qualidade..."
                                                />
                                            </div>
                                        </TabsContent>
                                    </div>
                                </Tabs>

                                <div className="p-10 bg-slate-100 rounded-[2.5rem] space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Star className="h-5 w-5 text-primary" />
                                        <h4 className="text-lg font-bold text-slate-800">Diretriz Estratégica</h4>
                                    </div>
                                    <textarea
                                        value={obsEstrategica}
                                        onChange={e => setObsEstrategica(e.target.value)}
                                        className="w-full h-32 bg-white rounded-2xl border border-slate-200 p-6 text-sm text-slate-400 font-medium italic outline-none resize-none shadow-inner"
                                        placeholder="Defina o foco inicial e potenciais expansões..."
                                    />
                                </div>
                            </motion.div>
                        )}

                        {activeSection === 'finalizacao' && (
                            <motion.div
                                key="step-5"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                            >
                                <div className="max-w-2xl space-y-12">
                                    <div className="space-y-6">
                                        <div className="h-32 w-32 bg-primary/10 rounded-[2.5rem] flex items-center justify-center text-primary mx-auto shadow-[0_30px_60px_-15px_rgba(210,35,42,0.3)] animate-bounce-slow">
                                            <MailCheck className="h-12 w-12" />
                                        </div>
                                        <h3 className="text-5xl font-black text-slate-800 tracking-tighter">Cadastro Finalizado.</h3>
                                        <p className="text-slate-400 text-lg font-medium">Os dados de <span className="text-primary">{razaoSocial}</span> foram revisados. <br />Deseja confirmar o disparo para a integração JLVIANA?</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 text-left">
                                        <div className="grid grid-cols-1 gap-12 text-left">
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <MailCheck className="h-4 w-4 text-primary" />
                                                        Destinatários do Checklist
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            className="h-6 px-3 rounded-full text-[9px] font-black uppercase text-primary hover:bg-primary/5"
                                                            onClick={() => setSelectedEmails(EMAIL_RECIPIENTS)}
                                                        >
                                                            Selecionar Todos
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {[
                                                        { email: 'dp@jlviana.com.br', label: 'Departamento Pessoal (DP)' },
                                                        { email: 'fiscal@jlviana.com.br', label: 'Escrituração Fiscal' },
                                                        { email: 'financeiro@jlviana.com.br', label: 'Gestão Financeira' },
                                                        { email: 'bpo@jlviana.com.br', label: 'Departamento BPO' },
                                                        { email: 'contabil@jlviana.com.br', label: 'Departamento Contábil' },
                                                        { email: 'contabilidade@jlviana.com.br', label: 'Diretoria' },
                                                    ].map(dept => {
                                                        const isActive = selectedEmails.includes(dept.email);
                                                        return (
                                                            <button
                                                                key={dept.email}
                                                                onClick={() => {
                                                                    setSelectedEmails(prev =>
                                                                        prev.includes(dept.email) ? prev.filter(e => e !== dept.email) : [...prev, dept.email]
                                                                    )
                                                                }}
                                                                className={cn(
                                                                    "flex items-center justify-between p-6 rounded-2xl border-2 transition-all group w-full",
                                                                    isActive
                                                                        ? "bg-primary/5 border-primary shadow-sm"
                                                                        : "bg-white border-slate-100 hover:border-slate-200"
                                                                )}
                                                            >
                                                                <div className="text-left flex flex-col gap-1">
                                                                    <span className={cn("text-xs font-black uppercase tracking-wider", isActive ? "text-primary" : "text-slate-400")}>
                                                                        {dept.label}
                                                                    </span>
                                                                    <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-500 transition-colors">
                                                                        {dept.email}
                                                                    </span>
                                                                </div>
                                                                <div className={cn(
                                                                    "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                                    isActive ? "bg-primary border-primary" : "bg-transparent border-slate-200 group-hover:border-slate-300"
                                                                )}>
                                                                    {isActive && <Check className="h-3 w-3 text-white stroke-[4px]" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Docs Mapeados</span>
                                                <textarea
                                                    value={documentos}
                                                    onChange={e => setDocumentos(e.target.value)}
                                                    className="w-full h-24 bg-transparent border-none outline-none text-xs text-slate-500 italic resize-none"
                                                />
                                            </div>
                                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-200 flex flex-col justify-center gap-4">
                                                <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Status:</span><span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Revisado</span></div>
                                                <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Protocolo:</span><span className="text-xs font-mono text-slate-700">JLV-ONB-24</span></div>
                                                <div className="h-px bg-slate-200" />
                                                <p className="text-[9px] font-black text-slate-400 uppercase leading-tight italic">Confirmação via protocolo de rede segura.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleSendChecklist}
                                        disabled={submitting || !selectedClientId}
                                        className="w-full h-24 rounded-[2rem] bg-primary hover:bg-slate-900 text-white text-2xl font-black shadow-2xl shadow-primary/40 active:scale-95 transition-all flex items-center justify-center gap-6 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        {submitting ? <Loader2 className="h-5 w-8 animate-spin" /> : <Send className="h-7 w-7 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform" />}
                                        CONFIRMAR E DISPARAR AGORA
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer Nav Dots */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
                        {['identificacao', 'corporativo', 'societario', 'demandas', 'finalizacao'].map(s => (
                            <div key={s} className={cn("h-1.5 rounded-full transition-all duration-500", activeSection === s ? "w-10 bg-primary" : "w-1.5 bg-slate-200")} />
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
