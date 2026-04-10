import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

function MensagemModelo({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2 text-sm italic">
      {children}
    </div>
  )
}

function Passo({
  numero,
  titulo,
  children,
}: {
  numero: string
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        Passo {numero} — {titulo}
      </p>
      {children}
    </div>
  )
}

function Detalhe({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-4 border-l-2 border-muted-foreground/20 pl-3 text-sm text-muted-foreground">
      {children}
    </div>
  )
}

export function SecaoScript() {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          A Livia segue um processo de atendimento em 3 etapas. Ela faz uma pergunta por vez
          e espera a resposta antes de avancar.
        </p>

        <Accordion type="multiple" defaultValue={["etapa-1"]} className="w-full">
          <AccordionItem value="etapa-1">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Etapa 1</Badge>
                <span className="text-sm font-medium">Acolhimento</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <Passo numero="1.1" titulo="Saudacao">
                <MensagemModelo>
                  &quot;Ola!&quot;
                  <br /><br />
                  &quot;Sou a Livia, do time de pre-atendimento da Innovate Brazil, especializada em paineis LED para comunicacao visual.&quot;
                  <br /><br />
                  &quot;Que bom que voce entrou em contato! Posso te ajudar a encontrar a melhor solucao para o seu projeto.&quot;
                  <br /><br />
                  &quot;Como posso te chamar?&quot;
                </MensagemModelo>
              </Passo>

              <Passo numero="1.2" titulo="Capturar nome">
                <Detalhe>
                  <p>Se o cliente informar o nome → salva e avanca para qualificacao</p>
                  <p className="mt-1">Se nao informar e fizer uma pergunta → responde brevemente e pergunta o nome novamente</p>
                </Detalhe>
              </Passo>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="etapa-2">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Etapa 2</Badge>
                <span className="text-sm font-medium">Qualificacao</span>
                <span className="text-xs text-muted-foreground">(8 perguntas)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A Livia coleta as informacoes do projeto uma por uma. Se o cliente nao souber responder, ela oferece opcoes ou segue adiante.
              </p>

              <Passo numero="2.1" titulo="Objetivo do painel">
                <p className="text-sm text-muted-foreground">Para que sera usado? (fachada, eventos, comunicacao interna...)</p>
              </Passo>
              <Separator />
              <Passo numero="2.2" titulo="Ambiente">
                <p className="text-sm text-muted-foreground">Interno ou externo?</p>
              </Passo>
              <Separator />
              <Passo numero="2.3" titulo="Foto do local">
                <p className="text-sm text-muted-foreground">Pede uma foto do local de instalacao. Se receber, analisa o espaco e comenta.</p>
              </Passo>
              <Separator />
              <Passo numero="2.4" titulo="Distancia de visualizacao">
                <p className="text-sm text-muted-foreground">De que distancia o painel sera visto? (2m, 5m, 10m...)</p>
              </Passo>
              <Separator />
              <Passo numero="2.5" titulo="Tamanho do painel">
                <p className="text-sm text-muted-foreground">Ja tem ideia do tamanho ou do espaco disponivel?</p>
              </Passo>
              <Separator />
              <Passo numero="2.6" titulo="Fixo ou movel">
                <p className="text-sm text-muted-foreground">Instalacao permanente ou para transporte/eventos?</p>
              </Passo>
              <Separator />
              <Passo numero="2.7" titulo="Prazo do projeto">
                <p className="text-sm text-muted-foreground">Tem alguma data prevista? (inauguracao, evento, campanha...)</p>
              </Passo>
              <Separator />
              <Passo numero="2.8" titulo="Faixa de investimento">
                <p className="text-sm text-muted-foreground">Existe uma faixa de investimento prevista?</p>
                <Detalhe>
                  <p>Se perguntar preco → redireciona para o consultor comercial (Livia nao informa valores)</p>
                </Detalhe>
              </Passo>

              <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
                Apos coletar tudo → salva os dados do projeto automaticamente
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="etapa-3">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Etapa 3</Badge>
                <span className="text-sm font-medium">Encaminhamento</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <Passo numero="3.1" titulo="Perguntar horario de contato">
                <MensagemModelo>
                  &quot;Perfeito, [NOME]!&quot;
                  <br /><br />
                  &quot;Com todas essas informacoes, ja conseguimos entender bem o seu projeto.&quot;
                  <br /><br />
                  &quot;Vou passar seu atendimento para um dos nossos consultores comerciais, que fara a analise tecnica e entrara em contato com voce.&quot;
                  <br /><br />
                  &quot;Qual seria o melhor dia e horario para o consultor te ligar?&quot;
                </MensagemModelo>
              </Passo>

              <Separator />

              <Passo numero="3.2" titulo="Salvar e encaminhar">
                <p className="text-sm text-muted-foreground">
                  A Livia salva todos os dados do projeto (incluindo dia e horario), encaminha o lead para o comercial e cria a tarefa de ligacao — tudo automaticamente.
                </p>
              </Passo>

              <Separator />

              <Passo numero="3.3" titulo="Confirmacao final">
                <MensagemModelo>
                  &quot;Anotei aqui: [DIA E HORARIO]&quot;
                  <br /><br />
                  &quot;Vou passar essas informacoes para nossa equipe comercial. Em breve um consultor entrara em contato no horario combinado para apresentar a solucao e o orcamento do seu projeto.&quot;
                  <br /><br />
                  &quot;Caso precise de algo antes, e so me chamar!&quot;
                  <br /><br />
                  &quot;Obrigada pelo contato e ate breve!&quot;
                </MensagemModelo>
              </Passo>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="retorno">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Especial</Badge>
                <span className="text-sm font-medium">Contato de retorno</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Quando um cliente que ja foi atendido entra em contato novamente:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Reconhece o cliente: &quot;Que bom ter voce de volta!&quot;
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Nao pergunta o nome de novo (ja sabe)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Vai direto ao ponto: &quot;Como posso ajudar dessa vez?&quot;
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
