"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Algo deu errado</h2>
          <p className="text-neutral-400">Ocorreu um erro inesperado no sistema.</p>
          <button
            onClick={() => reset()}
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
