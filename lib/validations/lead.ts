import { z } from "zod"

export const criarLeadSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  whatsapp: z.string().regex(/^\d{10,13}$/, "WhatsApp deve conter apenas dígitos (10 a 13)"),
  origem: z.string().optional(),
  statusFunil: z
    .enum(["acolhimento", "qualificacao", "encaminhado"])
    .default("acolhimento"),
  responsavelId: z.string().cuid().optional(),
})

export const atualizarLeadSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  whatsapp: z.string().regex(/^\d{10,13}$/, "WhatsApp deve conter apenas dígitos (10 a 13)").optional(),
  origem: z.string().optional(),
  statusFunil: z
    .enum(["acolhimento", "qualificacao", "encaminhado"])
    .optional(),
  responsavelId: z.string().cuid().optional().nullable(),
  sobreOLead: z.string().optional(),
})

export const mudarStatusSchema = z.object({
  statusFunil: z.enum(["acolhimento", "qualificacao", "encaminhado"]),
})

export type CriarLeadInput = z.infer<typeof criarLeadSchema>
export type AtualizarLeadInput = z.infer<typeof atualizarLeadSchema>
