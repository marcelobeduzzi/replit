import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
      <p className="text-gray-700 mb-8">Lo sentimos, no tienes permiso para acceder a esta página.</p>
      <Link href="/" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Volver al Inicio
      </Link>
    </div>
  )
}
