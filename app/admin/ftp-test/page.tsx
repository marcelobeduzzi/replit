"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, Check, AlertCircle } from "lucide-react"

export default function FtpTestPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("Por favor selecciona un archivo")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/ftp-up", {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa("quadrifoglio:secure_password"),
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)

      toast({
        title: "Archivo subido correctamente",
        description: `El archivo ${file.name} ha sido subido correctamente.`,
      })
    } catch (err) {
      console.error("Error uploading file:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")

      toast({
        title: "Error al subir archivo",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Prueba de API FTP</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subir archivo de prueba</CardTitle>
          <CardDescription>Utiliza este formulario para probar la API de carga FTP</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Selecciona un archivo</Label>
              <Input id="file" type="file" onChange={handleFileChange} className="cursor-pointer" />
              {error && (
                <div className="text-sm text-destructive flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir archivo
                </>
              )}
            </Button>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-muted rounded-md">
              <div className="flex items-center mb-2 text-green-600">
                <Check className="h-5 w-5 mr-2" />
                <h3 className="font-medium">Resultado de la carga</h3>
              </div>
              <pre className="text-sm overflow-auto p-2 bg-background rounded">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Información de autenticación:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Usuario: quadrifoglio</li>
              <li>Contraseña: secure_password</li>
            </ul>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

