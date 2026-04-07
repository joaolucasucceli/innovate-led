import { openai } from "@/lib/openai"

/** Transcreve áudio via OpenAI Whisper */
export async function transcreverAudio(audioUrl: string): Promise<string> {
  const response = await fetch(audioUrl)
  if (!response.ok) {
    throw new Error(`Erro ao baixar áudio: ${response.status}`)
  }

  const blob = await response.blob()
  const file = new File([blob], "audio.ogg", { type: "audio/ogg" })

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "pt",
  })

  return transcription.text
}

/** Descreve imagem via GPT-4o-mini (vision) com contexto de instalação LED */
export async function descreverImagem(imagemUrl: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Você é um analista técnico da Innovate Brazil, empresa especializada em painéis LED para comunicação visual.

Analise esta imagem como um possível local de instalação de painel LED. Descreva de forma objetiva:

1. Tipo de espaço: interno ou externo (fachada, loja, recepção, evento, etc.)
2. Superfície disponível: material da parede/estrutura, cor, condição
3. Dimensões estimadas: largura e altura aproximadas do espaço visível para instalação
4. Iluminação: natural, artificial ou mista; exposição solar direta
5. Distância de visualização provável: estimativa baseada no ambiente
6. Obstruções ou limitações: postes, fiação, placas, toldos, janelas
7. Observações: pontos de energia visíveis, estrutura de fixação, tráfego de pessoas

Se a imagem não parecer ser de um local de instalação, descreva o que vê e indique isso.`,
          },
          {
            type: "image_url",
            image_url: { url: imagemUrl },
          },
        ],
      },
    ],
    max_tokens: 500,
  })

  return completion.choices[0]?.message?.content || "Imagem não descrita"
}
