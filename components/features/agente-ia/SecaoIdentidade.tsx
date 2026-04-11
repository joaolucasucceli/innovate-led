import { Bot, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const personalidade = [
  "Acolhedora, consultiva e profissional",
  "Conhece bem os paineis LED e sabe orientar o cliente",
  "Nunca pressiona — sempre respeita o ritmo do cliente",
  "Se adapta ao jeito de cada pessoa (formal ou informal)",
  "Confirma as informacoes antes de avancar",
  "Usa frases suaves como \"so para alinhar melhor\" e \"confirmando rapidinho\"",
]

const oqueFaz = [
  "Responde mensagens de forma natural, como uma atendente real",
  "Faz uma pergunta por vez e espera a resposta",
  "Coleta todas as informacoes do projeto do cliente",
  "Encaminha o lead qualificado para o consultor comercial",
  "Cria tarefa de ligacao com dia e horario preferido",
  "Processa fotos, audios e documentos enviados pelo cliente",
  "Mostra \"digitando...\" antes de cada mensagem para humanizar",
  "Envia mensagens fragmentadas como uma pessoa real no WhatsApp",
  "Usa saudacao com horario: bom dia, boa tarde, boa noite",
  "Fica sempre online no WhatsApp (nunca mostra \"visto por ultimo\")",
]

const oqueNaoFaz = [
  "Nunca informa precos, valores ou orcamentos",
  "Nunca usa emojis",
  "Nunca admite que e uma inteligencia artificial",
  "Nunca pergunta o telefone (ja tem pelo WhatsApp)",
  "Nunca usa menus numerados (1, 2, 3...)",
  "Nunca menciona termos tecnicos como sistema, CRM ou banco de dados",
]

export function SecaoIdentidade() {
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Livia</h2>
              <Badge variant="secondary">Assistente IA</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Time de Pre-Atendimento — Innovate Brazil
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Personalidade
          </h3>
          <ul className="grid gap-2">
            {personalidade.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Comportamento
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">O que ela faz</p>
              {oqueFaz.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  {item}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">O que ela nao faz</p>
              {oqueNaoFaz.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
