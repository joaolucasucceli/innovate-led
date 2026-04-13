import { createClient } from "@supabase/supabase-js"
import { hash } from "bcryptjs"

function agora(): string {
  return new Date().toISOString()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log("Iniciando seed da Central Innovate...")

  // -- Usuario Gestor (admin) --
  const senhaHash = await hash("innovate2026", 10)

  const { data: existeAdmin } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", "admin@innovatebrazil.com")
    .maybeSingle()

  if (!existeAdmin) {
    const { data: admin } = await supabase
      .from("usuarios")
      .insert({
        id: crypto.randomUUID(),
        nome: "Administrador",
        email: "admin@innovatebrazil.com",
        senha: senhaHash,
        perfil: "gestor",
        tipo: "humano",
        atualizadoEm: agora(),
      })
      .select()
      .single()
    console.log(`Admin criado: ${admin?.email}`)
  } else {
    console.log("Admin ja existe: admin@innovatebrazil.com")
  }

  // -- Usuario IA (Livia) --
  const senhaIa = await hash("ia-livia-innovate-2026", 10)

  const { data: existeLivia } = await supabase
    .from("usuarios")
    .select("id")
    .eq("email", "livia@innovatebrazil.com")
    .maybeSingle()

  if (!existeLivia) {
    const { data: livia } = await supabase
      .from("usuarios")
      .insert({
        id: crypto.randomUUID(),
        nome: "Livia",
        email: "livia@innovatebrazil.com",
        senha: senhaIa,
        perfil: "atendente",
        tipo: "ia",
        atualizadoEm: agora(),
      })
      .select()
      .single()
    console.log(`Agente IA criado: ${livia?.nome} (${livia?.email})`)
  } else {
    console.log("Agente IA ja existe: livia@innovatebrazil.com")
  }

  console.log("\nSeed concluido!")
  console.log("Login admin: admin@innovatebrazil.com / innovate2026")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
