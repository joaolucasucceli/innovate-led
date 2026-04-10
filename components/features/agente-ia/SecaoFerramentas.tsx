import { Save, ArrowRight, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ferramentas = [
  {
    icone: Save,
    titulo: "Salvar qualificacao",
    descricao: "Toda vez que a Livia coleta uma informacao nova sobre o projeto do cliente, ela salva automaticamente no sistema e no Kommo CRM.",
    quando: "A cada resposta do cliente durante a qualificacao (objetivo, ambiente, tamanho, prazo, etc.)",
    exemplos: [
      "Cliente informou o nome → salva o nome",
      "Cliente disse que quer painel para fachada → salva o objetivo",
      "Cliente enviou foto do local → salva que enviou foto",
    ],
  },
  {
    icone: ArrowRight,
    titulo: "Encaminhar para o comercial",
    descricao: "Quando a qualificacao esta completa, a Livia encaminha o lead para a equipe comercial. A partir desse momento, ela para de responder — o consultor assume.",
    quando: "Apos coletar todas as informacoes e o cliente confirmar o dia/horario para contato",
    exemplos: [
      "Lead muda de \"em qualificacao\" para \"encaminhado\"",
      "Livia para de responder mensagens desse lead",
      "Dados ficam disponiveis para o consultor no sistema e no Kommo",
    ],
  },
  {
    icone: Phone,
    titulo: "Criar tarefa de ligacao",
    descricao: "Cria uma tarefa para o consultor comercial ligar para o cliente no dia e horario combinado, com um resumo completo do projeto.",
    quando: "Apos o cliente informar quando prefere receber a ligacao",
    exemplos: [
      "Cliente disse \"terca as 14h\" → tarefa criada para terca 14h",
      "Resumo inclui: objetivo, ambiente, tamanho, prazo, investimento",
      "Tarefa aparece no Kommo CRM para o consultor",
    ],
  },
]

export function SecaoFerramentas() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        A Livia tem 3 acoes automaticas que executa durante o atendimento. Tudo acontece sem intervencao humana.
      </p>

      {ferramentas.map((ferramenta) => {
        const Icone = ferramenta.icone
        return (
          <Card key={ferramenta.titulo}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Icone className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">{ferramenta.titulo}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{ferramenta.descricao}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm">
                  <span className="font-medium">Quando acontece:</span>{" "}
                  <span className="text-muted-foreground">{ferramenta.quando}</span>
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Exemplos:</p>
                <ul className="space-y-1">
                  {ferramenta.exemplos.map((exemplo) => (
                    <li key={exemplo} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {exemplo}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
