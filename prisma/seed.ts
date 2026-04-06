import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hash } from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Iniciando seed da Central Innovate...")

  // ── Usuário Gestor (admin) ──────────────────────────────────────────────────
  const senhaHash = await hash("innovate2026", 10)

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@innovatebrazil.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@innovatebrazil.com",
      senha: senhaHash,
      perfil: "gestor",
      tipo: "humano",
    },
  })
  console.log(`✅ Admin: ${admin.email}`)

  // ── Usuário IA (Andressa) ──────────────────────────────────────────────────
  const senhaIa = await hash("ia-andressa-innovate-2026", 10)

  const andressa = await prisma.usuario.upsert({
    where: { email: "andressa@innovatebrazil.com" },
    update: {},
    create: {
      nome: "Andressa",
      email: "andressa@innovatebrazil.com",
      senha: senhaIa,
      perfil: "atendente",
      tipo: "ia",
    },
  })
  console.log(`✅ Agente IA: ${andressa.nome} (${andressa.email})`)

  // ── Config Site ──────────────────────────────────────────────────────────────
  await prisma.configSite.upsert({
    where: { id: "default-config" },
    update: {},
    create: {
      id: "default-config",
      empresaNome: "Innovate Brazil",
      empresaSegmento: "Painéis LED para comunicação visual",
      whatsappNumero: "",
      contatoTelefone: "",
      contatoEndereco: "",
      contatoCidade: "",
      instagramUrl: "",
    },
  })
  console.log("✅ ConfigSite criada")

  console.log("\n🎉 Seed concluído!")
  console.log("─────────────────────────────────────────")
  console.log("Login admin: admin@innovatebrazil.com / innovate2026")
  console.log("─────────────────────────────────────────")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
