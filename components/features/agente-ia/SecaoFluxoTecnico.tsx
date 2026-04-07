import {
  Webhook,
  Database,
  Cpu,
  UserSearch,
  ShieldCheck,
  BrainCircuit,
  FileText,
  Bot,
  Scissors,
  Send,
  Clock,
  Calendar,
  Mic,
  Image,
  VolumeX,
  RotateCcw,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const passosFluxo = [
  {
    icone: Webhook,
    titulo: "Webhook recebe mensagem",
    descricao: "WhatsApp → Uazapi → /api/webhooks/whatsapp",
  },
  {
    icone: Database,
    titulo: "Buffer Redis",
    descricao: "Mensagem acumulada no buffer (TTL 60s, debounce 20s)",
  },
  {
    icone: Cpu,
    titulo: "Processar",
    descricao: "/api/agente/processar chamado após debounce expirar",
  },
  {
    icone: UserSearch,
    titulo: "Consultar Lead",
    descricao: "Busca contexto do lead no banco (status, nome, histórico)",
  },
  {
    icone: ShieldCheck,
    titulo: "Verificar modo",
    descricao: "Se modoConversa = \"humano\", IA fica em silêncio",
  },
  {
    icone: BrainCircuit,
    titulo: "Carregar Memória",
    descricao: "Últimas 20 mensagens do Redis (TTL 48h)",
  },
  {
    icone: FileText,
    titulo: "Gerar System Prompt",
    descricao: "Prompt dinâmico com contexto do lead atual",
  },
  {
    icone: Bot,
    titulo: "Chamar GPT-4o",
    descricao: "Function calling habilitado (máx 10 iterações de tools)",
  },
  {
    icone: Scissors,
    titulo: "Segmentar Resposta",
    descricao: "Quebra em blocos de até 500 caracteres por mensagem",
  },
  {
    icone: Send,
    titulo: "Enviar via Uazapi",
    descricao: "Mensagens enviadas com delay aleatório de 3-5s entre elas",
  },
]

const followUps = [
  {
    tempo: "1 hora",
    tipo: "Leve",
    descricao: "Lembrete amigável e sutil para retomar a conversa",
  },
  {
    tempo: "6 horas",
    tipo: "Valor",
    descricao: "Proposta de valor: benefícios dos painéis LED + análise gratuita do consultor",
  },
  {
    tempo: "24 horas",
    tipo: "Encerramento",
    descricao: "Mensagem de despedida gentil + encerra a conversa automaticamente",
  },
]

const horarios = [
  { dia: "Segunda a Sexta", horario: "08:00 — 18:00" },
  { dia: "Sábado", horario: "08:00 — 12:00" },
  { dia: "Domingo", horario: "Fechado" },
]

export function SecaoFluxoTecnico() {
  return (
    <div className="space-y-6">
      {/* Fluxo da conversa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fluxo da Conversa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pipeline completo desde a mensagem do cliente até a resposta da Lívia.
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-0">
            {passosFluxo.map((passo, index) => {
              const Icone = passo.icone
              const ehUltimo = index === passosFluxo.length - 1
              return (
                <div key={passo.titulo} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Linha conectora */}
                  {!ehUltimo && (
                    <div className="absolute left-[17px] top-[36px] h-[calc(100%-20px)] w-px bg-border" />
                  )}
                  {/* Ícone */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-background">
                    <Icone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {/* Conteúdo */}
                  <div className="pt-1">
                    <p className="text-sm font-medium leading-tight">
                      <span className="mr-2 text-xs text-muted-foreground">{index + 1}.</span>
                      {passo.titulo}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{passo.descricao}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comportamentos especiais */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <VolumeX className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Silêncio Automático</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              A IA não responde quando o lead está nos seguintes status — o humano está conduzindo.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">em_negociacao</Badge>
              <Badge variant="secondary">venda_realizada</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Também fica em silêncio se a conversa estiver em modo &quot;humano&quot; (modoConversa).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Contato de Retorno</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Quando um lead com status &quot;venda_realizada&quot; ou &quot;perdido&quot; envia mensagem novamente.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Abre novo ciclo automaticamente
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Reseta status para &quot;qualificacao&quot;
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Cria nova conversa vinculada ao ciclo
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Pula acolhimento — vai direto para qualificação
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Follow-ups */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Follow-Up Automático</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Enviados automaticamente se o lead não responder. Gerados via GPT-4o com fallback para templates.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {followUps.map((fu) => (
                <div key={fu.tempo} className="flex gap-3">
                  <Badge variant="outline" className="h-fit shrink-0 text-xs">
                    {fu.tempo}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{fu.tipo}</p>
                    <p className="text-xs text-muted-foreground">{fu.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Horário comercial + Mídia */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Horário Comercial</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Follow-ups só são enviados em horário comercial. Timezone: America/Sao_Paulo.
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dia</TableHead>
                      <TableHead>Horário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {horarios.map((h) => (
                      <TableRow key={h.dia}>
                        <TableCell className="font-medium">{h.dia}</TableCell>
                        <TableCell>{h.horario}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Processamento de Mídia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Mic className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Áudio</p>
                  <p className="text-xs text-muted-foreground">
                    Transcrição via OpenAI Whisper (português brasileiro)
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Image className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Imagem</p>
                  <p className="text-xs text-muted-foreground">
                    Descrição visual via GPT-4o-mini (vision)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
