import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const secoes = [
  {
    id: "empresa",
    titulo: "Sobre a Empresa",
    conteudo:
      "A Innovate Brazil é especializada em painéis LED para comunicação visual. Atuamos em fachadas, eventos, comunicação interna, publicidade e retail.",
  },
  {
    id: "precos",
    titulo: "Preços e Orçamento",
    conteudo:
      "O valor depende do tamanho, pitch e ambiente. Projetos geralmente variam de R$ 15.000 a R$ 500.000+. Para orçamento preciso, nosso consultor fará análise personalizada do projeto.",
  },
  {
    id: "indoor",
    titulo: "Painel Indoor (Interno)",
    conteudo:
      "Para ambientes internos como recepções, lojas, shoppings e auditórios. Não precisa resistir a chuva ou sol, exige menos brilho, oferece melhor definição para curtas distâncias.",
  },
  {
    id: "outdoor",
    titulo: "Painel Outdoor (Externo)",
    conteudo:
      "Resistente a chuva, sol e variações de temperatura. Possui alto brilho para visibilidade sob luz solar. Ideal para fachadas, totens e eventos ao ar livre.",
  },
  {
    id: "pitch",
    titulo: "Pitch e Resolução",
    conteudo:
      "O pitch é a distância entre os LEDs. Quanto menor o pitch, maior a resolução e mais nítida a imagem de perto.",
    tabela: true,
  },
  {
    id: "energia",
    titulo: "Consumo de Energia",
    conteudo:
      "Painéis LED são muito eficientes. Consomem em média 100 a 300 watts por metro quadrado, dependendo do brilho. Muito mais econômico que painéis tradicionais.",
  },
  {
    id: "instalacao",
    titulo: "Instalação",
    conteudo:
      "Oferecemos instalação completa com equipe técnica especializada. Podemos fornecer estrutura metálica se necessário. Todos os painéis possuem garantia.",
  },
  {
    id: "manutencao",
    titulo: "Manutenção e Durabilidade",
    conteudo:
      "Baixa manutenção — geralmente apenas limpeza periódica. Vida útil média de 100.000 horas (mais de 10 anos de uso). Oferecemos suporte técnico.",
  },
  {
    id: "conteudo",
    titulo: "Conteúdo e Controle",
    conteudo:
      "Aceita vídeos, imagens, animações e texto. Pode ser controlado remotamente via software. O conteúdo pode ser atualizado a qualquer momento.",
  },
]

const tabelaPitch = [
  { pitch: "P2.5 a P4", distancia: "2 a 5 metros", uso: "Recepções, lojas, shoppings" },
  { pitch: "P5 a P6", distancia: "5 a 10 metros", uso: "Fachadas próximas, auditórios" },
  { pitch: "P8 a P10", distancia: "10 a 20 metros", uso: "Fachadas médias, eventos" },
  { pitch: "P16 ou maior", distancia: "20+ metros", uso: "Rodovias, grandes distâncias" },
]

export function SecaoBaseConhecimento() {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Informações que a Andressa utiliza para responder dúvidas dos clientes durante a conversa.
        </p>
        <Accordion type="multiple" className="w-full">
          {secoes.map((secao) => (
            <AccordionItem key={secao.id} value={secao.id}>
              <AccordionTrigger className="text-sm font-medium">
                {secao.titulo}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm">{secao.conteudo}</p>
                {secao.tabela && (
                  <div className="mt-3 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pitch</TableHead>
                          <TableHead>Distância Ideal</TableHead>
                          <TableHead>Uso Típico</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tabelaPitch.map((row) => (
                          <TableRow key={row.pitch}>
                            <TableCell className="font-medium">{row.pitch}</TableCell>
                            <TableCell>{row.distancia}</TableCell>
                            <TableCell>{row.uso}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
