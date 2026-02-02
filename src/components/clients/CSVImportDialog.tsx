import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Check, AlertCircle, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import type { TaxRegime, Client } from '@/hooks/useClients';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport?: (clients: Omit<Client, 'id'>[]) => void;
}

const expectedColumns = [
  { key: 'razaoSocial', label: 'Razão Social', required: true },
  { key: 'cnpj', label: 'CNPJ', required: true },
  { key: 'nomeFantasia', label: 'Nome Fantasia', required: false },
  { key: 'email', label: 'Email', required: true },
  { key: 'telefone', label: 'Telefone', required: false },
  { key: 'regimeTributario', label: 'Regime Tributário', required: true },
  { key: 'ccm', label: 'CCM', required: false },
  { key: 'ie', label: 'Inscrição Estadual', required: false },
  { key: 'dataEntrada', label: 'Data de Entrada', required: false },
  { key: 'dataSaida', label: 'Data de Saída', required: false },
];

const templateHeaders = [
  'Razão Social',
  'Nome Fantasia',
  'CNPJ',
  'Email',
  'Telefone',
  'Regime Tributário',
  'CCM',
  'Inscrição Estadual',
  'Senha Prefeitura',
  'Data de Entrada',
  'Data de Saída',
];

const templateExample = [
  'Empresa Exemplo Ltda',
  'Exemplo',
  '12.345.678/0001-90',
  'contato@exemplo.com.br',
  '(11) 99999-9999',
  'simples',
  '1234567',
  '123456789',
  'senha123',
  '2024-01-01',
  '',
];

interface ParsedClient {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  regimeTributario: TaxRegime;
  ccm?: string;
  ie?: string;
  senhaPrefeitura?: string;
  dataEntrada: string;
  dataSaida?: string;
  isActive: boolean;
  quadroSocietario: { nome: string; cpf: string; participacao: number }[];
  isValid: boolean;
  errors: string[];
}

export function CSVImportDialog({ open, onOpenChange, onImport }: CSVImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedData, setParsedData] = useState<ParsedClient[]>([]);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [existingCnpjs, setExistingCnpjs] = useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Buscar CNPJs já cadastrados no banco
  useEffect(() => {
    const fetchExistingCnpjs = async () => {
      const { data } = await supabase.from('clients').select('cnpj');
      if (data) {
        setExistingCnpjs(new Set(data.map(c => c.cnpj)));
      }
    };
    if (open) {
      fetchExistingCnpjs();
    }
  }, [open]);

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [templateHeaders, templateExample];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Ajustar largura das colunas
    const colWidths = templateHeaders.map(h => ({ wch: Math.max(h.length + 5, 20) }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo_importacao_clientes.xlsx');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = async (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { header: 1 });

        if (jsonData.length > 0) {
          const headers = Object.values(jsonData[0] as Record<string, string>).map(String);
          setCsvColumns(headers);

          // Auto-mapear colunas
          const autoMapping: Record<string, string> = {};
          expectedColumns.forEach(col => {
            const match = headers.find(h =>
              h.toLowerCase().includes(col.label.toLowerCase()) ||
              col.label.toLowerCase().includes(h.toLowerCase())
            );
            if (match) {
              autoMapping[col.key] = match;
            }
          });
          setColumnMapping(autoMapping);

          // Converter para array de objetos
          const rows = jsonData.slice(1).map((row: unknown) => {
            const obj: Record<string, string> = {};
            headers.forEach((header, index) => {
              obj[header] = String((row as string[])[index] || '');
            });
            return obj;
          });
          setRawData(rows);
          setStep('mapping');
        }
      } catch (error) {
        console.error('Erro ao ler arquivo:', error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleMapping = (systemColumn: string, csvColumn: string) => {
    setColumnMapping({ ...columnMapping, [systemColumn]: csvColumn });
  };

  const parseRegime = (value: string): TaxRegime => {
    const normalized = value.toLowerCase().trim();
    if (normalized.includes('presumido')) return 'presumido';
    if (normalized.includes('real')) return 'real';
    return 'simples';
  };

  const validateAndParseData = async () => {
    setIsValidating(true);

    // Buscar CNPJs mais recentes do banco
    const { data: currentClients } = await supabase.from('clients').select('cnpj');
    const dbCnpjs = new Set(currentClients?.map(c => c.cnpj) || []);

    // Rastrear CNPJs já vistos na planilha atual
    const seenCnpjs = new Set<string>();

    const parsed: ParsedClient[] = rawData.map(row => {
      const errors: string[] = [];

      const razaoSocial = row[columnMapping.razaoSocial] || '';
      const cnpj = row[columnMapping.cnpj] || '';
      const email = row[columnMapping.email] || '';
      const regimeStr = row[columnMapping.regimeTributario] || 'simples';

      // Validações de campos obrigatórios
      if (!razaoSocial) errors.push('Razão Social obrigatória');
      if (!cnpj) errors.push('CNPJ obrigatório');
      if (!email) errors.push('Email obrigatório');

      // Validação de CNPJ duplicado no banco
      if (cnpj && dbCnpjs.has(cnpj)) {
        errors.push('CNPJ já cadastrado no sistema');
      }

      // Validação de CNPJ duplicado na própria planilha
      if (cnpj && seenCnpjs.has(cnpj)) {
        errors.push('CNPJ duplicado na planilha');
      }

      if (cnpj) {
        seenCnpjs.add(cnpj);
      }

      return {
        razaoSocial,
        nomeFantasia: row[columnMapping.nomeFantasia] || razaoSocial,
        cnpj,
        email,
        telefone: row[columnMapping.telefone] || '',
        regimeTributario: parseRegime(regimeStr),
        ccm: row[columnMapping.ccm] || undefined,
        ie: row[columnMapping.ie] || undefined,
        senhaPrefeitura: row['Senha Prefeitura'] || undefined,
        dataEntrada: row[columnMapping.dataEntrada] || new Date().toISOString().split('T')[0],
        dataSaida: row[columnMapping.dataSaida] || undefined,
        isActive: true,
        quadroSocietario: [],
        isValid: errors.length === 0,
        errors,
      };
    });

    setParsedData(parsed);
    setIsValidating(false);
    setStep('preview');
  };

  const handleImport = () => {
    const validClients = parsedData
      .filter(c => c.isValid)
      .map(({ isValid, errors, ...client }) => client);

    onImport?.(validClients);
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setCsvColumns([]);
    setColumnMapping({});
    setParsedData([]);
    setRawData([]);
    onOpenChange(false);
  };

  const validCount = parsedData.filter(c => c.isValid).length;
  const invalidCount = parsedData.filter(c => !c.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-light text-foreground">Importar Clientes</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="py-6 space-y-6">
            {/* Download Template */}
            <div className="rounded-xl bg-muted p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">1. Baixe o Modelo</h4>
                  <p className="text-sm text-muted-foreground">
                    Use nossa planilha modelo para garantir o formato correto
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={handleDownloadTemplate} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Baixar Planilha Modelo (.xlsx)
              </Button>
            </div>

            {/* Upload File */}
            <div className="rounded-xl bg-muted p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">2. Envie sua Planilha</h4>
                  <p className="text-sm text-muted-foreground">
                    Após preencher, faça upload do arquivo
                  </p>
                </div>
              </div>
              <label
                htmlFor="csv-upload"
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary/50 hover:bg-background/50 transition-all"
              >
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">
                  Clique para selecionar ou arraste o arquivo
                </p>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: .xlsx, .xls, .csv
                </p>
                <input
                  id="csv-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {csvColumns.length} colunas detectadas • {rawData.length} registros
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Mapeamento de Colunas</h4>
              <p className="text-sm text-muted-foreground">
                Associe as colunas do seu arquivo com os campos do sistema.
              </p>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {expectedColumns.map((col) => (
                  <div key={col.key} className="flex items-center gap-4">
                    <div className="w-40 flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{col.label}</span>
                      {col.required && (
                        <span className="text-xs text-primary">*</span>
                      )}
                    </div>
                    <Select
                      value={columnMapping[col.key] || ''}
                      onValueChange={(value) => handleMapping(col.key, value)}
                    >
                      <SelectTrigger className="flex-1 rounded-xl">
                        <SelectValue placeholder="Selecionar coluna" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {csvColumns.map((csvCol) => (
                          <SelectItem key={csvCol} value={csvCol}>
                            {csvCol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {columnMapping[col.key] && (
                      <Check className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Voltar
              </Button>
              <Button onClick={validateAndParseData} disabled={isValidating}>
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validando...
                  </>
                ) : (
                  'Continuar'
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6 py-4">
            {validCount > 0 && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-emerald-900">Pronto para importar</p>
                    <p className="text-sm text-emerald-700">
                      {validCount} cliente(s) válido(s) serão importados
                    </p>
                  </div>
                </div>
              </div>
            )}

            {invalidCount > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-900">Atenção</p>
                    <p className="text-sm text-amber-700">
                      {invalidCount} registro(s) com erros serão ignorados
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="max-h-[200px] overflow-y-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left font-medium">Status</th>
                    <th className="p-2 text-left font-medium">Razão Social</th>
                    <th className="p-2 text-left font-medium">CNPJ</th>
                    <th className="p-2 text-left font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 10).map((client, index) => (
                    <tr key={index} className={cn(
                      "border-t border-border",
                      !client.isValid && "bg-red-50"
                    )}>
                      <td className="p-2">
                        {client.isValid ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <div className="group relative">
                            <AlertCircle className="h-4 w-4 text-red-600 cursor-help" />
                            <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10 w-48 p-2 text-xs bg-red-100 text-red-800 rounded shadow-lg">
                              {client.errors.join(', ')}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-foreground">{client.razaoSocial || '-'}</td>
                      <td className="p-2 text-muted-foreground">{client.cnpj || '-'}</td>
                      <td className="p-2 text-muted-foreground">{client.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Voltar
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Importar {validCount} Cliente(s)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
