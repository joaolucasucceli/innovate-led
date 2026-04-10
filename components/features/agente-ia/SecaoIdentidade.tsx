import { Bot, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const personalidade = [
  "Acolhedora, consultiva e profissional",
  "Conhecimento técnico sobre painéis LED",
  "Nunca pressiona o cliente",
  "Adapta-se ao estilo de cada cliente (formal ou informal)",
  "Valida informações antes de prosseguir",
  "Usa frases suaves: \"só para alinhar melhor\", \"confirmando rapidinho\"",
]

const regrasFaz = [
  "Mensagens curtas e objetivas",
  "Tom profissional e amigavel",
  "Escrita natural, sem emojis",
  "Uma pergunta por vez",
  "Sempre em portugues brasileiro",
  "Negrito com *asterisco simples* (padrao WhatsApp)",
]

const regrasNaoFaz = [
  "Nunca pergunta o telefone",
  "Nunca usa menus numerados (1, 2, 3...)",
  "Nunca menciona \"sistema\", \"CRM\", \"salvar\"",
  "Nunca informa valores, precos ou orcamentos",
  "Nunca admite ser IA",
  "Nunca usa emojis",
]

export function SecaoIdentidade() {
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {/* Header com identidade */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Lívia</h2>
              <Badge variant="secondary">GPT-4o</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Assistente de Pré-Atendimento — Innovate Brazil
            </p>
          </div>
        </div>

        <Separator />

        {/* Personalidade */}
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

        {/* Regras de comunicação */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Regras de Comunicação
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Faz</p>
              {regrasFaz.map((regra) => (
                <div key={regra} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  {regra}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Não faz</p>
              {regrasNaoFaz.map((regra) => (
                <div key={regra} className="flex items-start gap-2 text-sm">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  {regra}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
