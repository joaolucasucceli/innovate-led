import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Parametro {
  nome: string
  tipo: string
  obrigatorio: boolean
  descricao: string
}

interface Ferramenta {
  nome: string
  titulo: string
  descricao: string
  quandoUsar: string
  rota: string
  parametros: Parametro[]
}

const ferramentas: Ferramenta[] = [
  {
    nome: "salvar_qualificacao",
    titulo: "Salvar Qualificação",
    descricao:
      "Salva informações de qualificação do lead no CRM. O campo sobreOLead é cumulativo (nunca sobrescrito). Também atualiza o nome do lead se informado via nomeLead.",
    quandoUsar:
      "Sempre que coletar informação nova sobre o lead durante a conversa.",
    rota: "/api/agente/salvar-qualificacao",
    parametros: [
      { nome: "leadId", tipo: "string", obrigatorio: true, descricao: "ID do lead/contato" },
      { nome: "conversaId", tipo: "string", obrigatorio: true, descricao: "ID da conversa ativa" },
      {
        nome: "sobreOLead",
        tipo: "string",
        obrigatorio: true,
        descricao: "Informações coletadas (cumulativo — append, nunca sobrescreve). Formato: \"Objetivo: X | Ambiente: Y | Distância: Z | Tamanho: W | Tipo: fixo/móvel | Prazo: P | Investimento: I | Foto: sim/não\"",
      },
      {
        nome: "nomeLead",
        tipo: "string",
        obrigatorio: false,
        descricao: "Nome real do contato, informado por ele na conversa",
      },
    ],
  },
  {
    nome: "encaminhar_contato",
    titulo: "Encaminhar para Comercial",
    descricao:
      "Move o lead para a etapa \"encaminhado\" no funil do CRM. Dispara webhook n8n para sincronizar com Kommo.",
    quandoUsar:
      "Após salvar a qualificação completa e quando o cliente confirmar interesse em falar com o consultor.",
    rota: "/api/agente/encaminhar-contato",
    parametros: [
      { nome: "leadId", tipo: "string", obrigatorio: true, descricao: "ID do lead/contato" },
      { nome: "conversaId", tipo: "string", obrigatorio: true, descricao: "ID da conversa ativa" },
    ],
  },
  {
    nome: "criar_tarefa",
    titulo: "Criar Tarefa de Ligação",
    descricao:
      "Cria uma tarefa de ligação para o consultor comercial entrar em contato com o cliente. Dispara webhook n8n para sincronizar com Kommo.",
    quandoUsar:
      "Após coletar dia e horário de preferência do cliente, e após ter usado salvar_qualificacao e encaminhar_contato.",
    rota: "/api/agente/criar-tarefa",
    parametros: [
      { nome: "leadId", tipo: "string", obrigatorio: true, descricao: "ID do lead/contato" },
      { nome: "conversaId", tipo: "string", obrigatorio: true, descricao: "ID da conversa ativa" },
      {
        nome: "dataHora",
        tipo: "string",
        obrigatorio: true,
        descricao: "Dia e horário de preferência (ex: \"Hoje às 16h\", \"Segunda às 10h\", \"Amanhã de manhã\")",
      },
      {
        nome: "resumo",
        tipo: "string",
        obrigatorio: true,
        descricao: "Resumo completo da qualificação. Formato: \"Nome: X | Objetivo: Y | Ambiente: Z | Distância: W | Tamanho: T | Tipo: fixo/móvel | Prazo: P | Investimento: I | Foto: sim/não\"",
      },
    ],
  },
]

export function SecaoFerramentas() {
  return (
    <div className="space-y-4">
      {ferramentas.map((ferramenta) => (
        <Card key={ferramenta.nome}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle className="text-base">{ferramenta.titulo}</CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                {ferramenta.nome}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{ferramenta.descricao}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm">
                <span className="font-medium">Quando usar:</span>{" "}
                {ferramenta.quandoUsar}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Parâmetros</p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Nome</TableHead>
                      <TableHead className="w-[80px]">Tipo</TableHead>
                      <TableHead className="w-[100px]">Obrigatório</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ferramenta.parametros.map((param) => (
                      <TableRow key={param.nome}>
                        <TableCell className="font-mono text-xs">{param.nome}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {param.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {param.obrigatorio ? (
                            <Badge variant="default" className="text-xs">Sim</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{param.descricao}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Rota:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
                {ferramenta.rota}
              </code>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
