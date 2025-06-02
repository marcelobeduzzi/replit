export function LoadingSpinner({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  )
}

