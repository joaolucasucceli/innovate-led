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

function Ramificacao({ children }: { children: React.ReactNode }) {
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
          O script de atendimento guia a Lívia em 3 etapas. Ela faz uma pergunta por vez
          e aguarda a resposta antes de avançar.
        </p>

        <Accordion type="multiple" defaultValue={["etapa-1"]} className="w-full">
          {/* ETAPA 1 */}
          <AccordionItem value="etapa-1">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Etapa 1</Badge>
                <span className="text-sm font-medium">Acolhimento</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <Passo numero="1.1" titulo="Saudação Inicial">
                <MensagemModelo>
                  &quot;Olá! 👋&quot;
                  <br /><br />
                  &quot;Sou a Lívia, do time de pré-atendimento da Innovate Brazil,
                  especializada em painéis LED para comunicação visual.&quot;
                  <br /><br />
                  &quot;Que bom que você entrou em contato! Posso te ajudar a encontrar
                  a melhor solução para o seu projeto.&quot;
                  <br /><br />
                  &quot;Como posso te chamar?&quot;
                </MensagemModelo>
              </Passo>

              <Passo numero="1.2" titulo="Capturar Nome">
                <Ramificacao>
                  <p>Se informar nome → <Badge variant="secondary" className="text-xs">salvar_qualificacao</Badge> com nomeLead → Avança para Etapa 2</p>
                  <p className="mt-1">Se não informar e fizer pergunta → Responde brevemente e pergunta o nome novamente</p>
                </Ramificacao>
              </Passo>
            </AccordionContent>
          </AccordionItem>

          {/* ETAPA 2 */}
          <AccordionItem value="etapa-2">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Etapa 2</Badge>
                <span className="text-sm font-medium">Qualificação</span>
                <span className="text-xs text-muted-foreground">(8 perguntas)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <Passo numero="2.1" titulo="Objetivo do Painel">
                <MensagemModelo>
                  &quot;Prazer, [NOME]! 😊&quot;
                  <br /><br />
                  &quot;Para começar, qual seria o objetivo do painel?&quot;
                  <br /><br />
                  &quot;Por exemplo: divulgação, fachada, eventos, comunicação interna...&quot;
                </MensagemModelo>
                <Ramificacao>
                  <p>Se vago → &quot;Só para alinhar melhor: esse painel será usado para mostrar conteúdos como vídeos, imagens ou anúncios?&quot;</p>
                  <p className="mt-1">Se não souber → &quot;Ele seria mais para atrair clientes, informar pessoas ou uso em eventos?&quot;</p>
                </Ramificacao>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">Dado: Objetivo</Badge>
                </div>
              </Passo>

              <Separator />

              <Passo numero="2.2" titulo="Ambiente">
                <MensagemModelo>
                  &quot;O painel será instalado em ambiente interno ou externo?&quot;
                </MensagemModelo>
                <Ramificacao>
                  <p>Se confuso → &quot;Ele ficará dentro do ambiente ou exposto ao tempo, como sol e chuva?&quot;</p>
                </Ramificacao>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">Dado: Ambiente</Badge>
                </div>
              </Passo>

              <Separator />

              <Passo numero="2.3" titulo="Foto do Local">
                <MensagemModelo>
                  &quot;Se possível, você pode nos enviar uma foto do local onde o painel será instalado? 📸&quot;
                  <br /><br />
                  &quot;A foto ajuda bastante a entender o espaço e sugerir o melhor posicionamento.&quot;
                </MensagemModelo>
                <Ramificacao>
                  <p>Se enviar → &quot;Ótimo! Recebi a foto.&quot;</p>
                  <p className="mt-1">Se não tiver → &quot;Tranquilo! Quando tiver, pode enviar depois.&quot;</p>
                </Ramificacao>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">Dado: Foto</Badge>
                </div>
              </Passo>

              <Separator />

              <Passo numero="2.4" titulo="Distância de Visualização">
                <MensagemModelo>
                  &quot;Qual seria a distância mínima de visualização do painel?&quot;
                  <br /><br />
                  &quot;Por exemplo: 2 metros, 5 metros, 10 metros...&quot;
                </MensagemModelo>
                <Ramificacao>
                  <p>Se não souber → &quot;Ele será visto de perto (recepção) ou de longe (fachada/rua)?&quot;</p>
                </Ramificacao>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">Dado: Distância</Badge>
                </div>
              </Passo>

              <Separator />

              <Passo numero="2.5" titulo="Tamanho do Painel">
                <MensagemModelo>
                  &quot;Você já tem alguma ideia do tamanho do painel ou do espaço disponível?&quot;
                </MensagemModelo>
                <Ramificacao>
                  <p>Se genérico → &quot;Seria algo mais próximo de 1-2m, 2-4m, ou maior?&quot;</p>
                  <p className="mt-1">Se não souber → &quot;Podemos sugerir o tamanho ideal após analisar o local.&quot;</p>
                </Ramificacao>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">Dado: Tamanho</Badge>
                </div>
              </Passo>

              <Separator />

              <Passo numero="2.6" titulo="Fixo ou Móvel">
                <MensagemModelo>
                  &quot;O painel seria fixo ou móvel?&quot;
                </MensagemModelo>
                <Ramificacao>
                  <p>Se não entender → Explica: Fixo = permanente no local / Móvel = transportado para eventos</p>
                </Ramificacao>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">Dado: Tipo</Badge>
                </div>
              </Passo>

              <Separator />

              <Passo numero="2.7" titulo="Prazo do Projeto">
                <MensagemModelo>
                  &quot;Existe algum prazo previsto para esse projeto?&quot;
                  <br /><br />
                  &quot;Por exemplo: inauguração, evento, campanha...&quot;
                </MensagemModelo>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">Dado: Prazo</Badge>
                </div>
              </Passo>

              <Separator />

              <Passo numero="2.8" titulo="Faixa de Investimento">
                <MensagemModelo>
                  &quot;Para que possamos indicar a melhor solução, existe alguma faixa de investimento prevista?&quot;
                </MensagemModelo>
                <Ramificacao>
                  <p>Se perguntar preço → Responde com base de conhecimento, depois retoma a pergunta</p>
                  <p className="mt-1">Se não quiser informar → &quot;O consultor te apresentará algumas opções de orçamento.&quot;</p>
                </Ramificacao>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs">Dado: Investimento</Badge>
                </div>
              </Passo>

              <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
                Após coletar todas as informações → <Badge variant="secondary" className="text-xs">salvar_qualificacao</Badge> com todos os dados
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ETAPA 3 */}
          <AccordionItem value="etapa-3">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Etapa 3</Badge>
                <span className="text-sm font-medium">Encaminhamento</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <Passo numero="3.1" titulo="Salvar e Encaminhar">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">salvar_qualificacao</Badge>
                  <Badge variant="secondary" className="text-xs">encaminhar_contato</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Salva qualificação completa e move o lead para &quot;encaminhado&quot; no funil.
                </p>
              </Passo>

              <Separator />

              <Passo numero="3.2" titulo="Solicitar Horário de Contato">
                <MensagemModelo>
                  &quot;Perfeito, [NOME]! 😊&quot;
                  <br /><br />
                  &quot;Com todas essas informações, já conseguimos entender bem o seu projeto.&quot;
                  <br /><br />
                  &quot;Vou passar seu atendimento para um dos nossos consultores comerciais.&quot;
                  <br /><br />
                  &quot;Qual seria o melhor dia e horário para o consultor te ligar? 📅&quot;
                </MensagemModelo>
              </Passo>

              <Separator />

              <Passo numero="3.3" titulo="Criar Tarefa e Confirmação">
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant="secondary" className="text-xs">criar_tarefa</Badge>
                </div>
                <MensagemModelo>
                  &quot;Ótimo! ✅&quot;
                  <br /><br />
                  &quot;Anotei aqui: [DIA E HORÁRIO]&quot;
                  <br /><br />
                  &quot;Vou passar essas informações para nossa equipe comercial. Em breve um
                  consultor entrará em contato no horário combinado.&quot;
                  <br /><br />
                  &quot;Caso precise de algo antes, é só me chamar!&quot;
                  <br /><br />
                  &quot;Obrigada pelo contato e até breve! 👋&quot;
                </MensagemModelo>
              </Passo>
            </AccordionContent>
          </AccordionItem>

          {/* RETORNO */}
          <AccordionItem value="retorno">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Especial</Badge>
                <span className="text-sm font-medium">Contato de Retorno</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Quando o lead já entrou em contato antes (ehRetorno = true):
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Cumprimentar: &quot;Que bom ter você de volta, [nome]!&quot;
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Pular Etapa 1 (nome já conhecido)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Ir direto: &quot;Como posso ajudar dessa vez?&quot;
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Usar <Badge variant="secondary" className="text-xs">salvar_qualificacao</Badge> para o novo interesse
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
