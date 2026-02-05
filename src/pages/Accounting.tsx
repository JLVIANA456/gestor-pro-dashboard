import { useState, useEffect } from 'react';
import { useClients, Client } from '@/hooks/useClients';
import { useAccounting } from '@/hooks/useAccounting';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Calculator, Loader2, Lock } from 'lucide-react';
import { AccountingModal } from '@/components/accounting/AccountingModal';

export default function Accounting() {
    const { clients, loading } = useClients();
    const { fetchClosedCompanies } = useAccounting();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [closedCompanyIds, setClosedCompanyIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchClosedCompanies().then(setClosedCompanyIds);
    }, []);

    const filteredClients = clients.filter(client =>
        client.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cnpj.includes(searchTerm)
    );

    const handleClientClick = (client: Client) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-light tracking-tight text-foreground">Contabilidade</h1>
                <p className="text-sm font-normal text-muted-foreground uppercase tracking-[0.2em]">
                    Gerenciamento e fechamentos mensais
                </p>
            </div>

            <Card className="border-border/50 shadow-card">
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle>Clientes</CardTitle>
                            <CardDescription>
                                Selecione um cliente para registrar fechamentos contábeis.
                            </CardDescription>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border/50 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/5 hover:bg-muted/5">
                                    <TableHead className="w-[300px]">Razão Social</TableHead>
                                    <TableHead>CNPJ</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center">
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                                                Carregando clientes...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredClients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                            Nenhum cliente encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredClients.map((client) => {
                                        const isClosed = closedCompanyIds.has(client.id);
                                        return (
                                            <TableRow
                                                key={client.id}
                                                className={`cursor-pointer transition-colors ${isClosed ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50'}`}
                                                onClick={() => handleClientClick(client)}
                                            >
                                                <TableCell className="font-medium">
                                                    {client.razaoSocial}
                                                    {isClosed && (
                                                        <span className="ml-2 text-xs font-semibold text-destructive border border-destructive/30 px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                                            <Lock className="h-3 w-3" />
                                                            ENCERRADA
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono text-muted-foreground">{client.cnpj}</TableCell>
                                                <TableCell>
                                                    <Badge variant={client.isActive ? 'default' : 'secondary'} className={client.isActive ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200' : ''}>
                                                        {client.isActive ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant={isClosed ? "secondary" : "ghost"}
                                                        size="sm"
                                                        className={isClosed ? "text-muted-foreground" : "hover:text-primary"}
                                                    >
                                                        {isClosed ? 'Ver Registro' : (
                                                            <>
                                                                <Calculator className="h-4 w-4 mr-2" />
                                                                Registrar
                                                            </>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <AccountingModal
                client={selectedClient}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
