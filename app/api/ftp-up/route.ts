import type { NextRequest } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"

// Configuración de Supabase (ya configurada)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Credenciales para autenticación básica (ya configuradas)
const FTP_USERNAME = process.env.FTP_USERNAME || "quadrifoglio"
const FTP_PASSWORD = process.env.FTP_PASSWORD || "secure_password"

// Manejar solicitudes GET (para pruebas)
export async function GET(request: NextRequest) {
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prueba de API FTP</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .info { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        form { background: #f9f9f9; padding: 20px; border-radius: 5px; }
        label { display: block; margin-bottom: 10px; }
        input[type="file"] { margin-bottom: 15px; }
        button { background: #0070f3; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
        #result { margin-top: 20px; padding: 15px; border-radius: 5px; background: #f0f0f0; display: none; }
      </style>
    </head>
    <body>
      <h1>Prueba de API FTP</h1>
      <div class="info">
        <p>Esta página te permite probar la API de carga FTP. Selecciona un archivo y haz clic en "Subir archivo".</p>
        <p>La API utiliza autenticación básica con las siguientes credenciales:</p>
        <ul>
          <li>Usuario: quadrifoglio</li>
          <li>Contraseña: secure_password</li>
        </ul>
      </div>
      <form id="uploadForm">
        <label for="fileInput">Selecciona un archivo:</label>
        <input type="file" id="fileInput" required>
        <button type="submit">Subir archivo</button>
      </form>
      <div id="result"></div>

      <script>
        document.getElementById('uploadForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const fileInput = document.getElementById('fileInput');
          const resultDiv = document.getElementById('result');
          
          if (!fileInput.files[0]) {
            resultDiv.textContent = 'Por favor selecciona un archivo';
            resultDiv.style.display = 'block';
            return;
          }
          
          const formData = new FormData();
          formData.append('file', fileInput.files[0]);
          
          try {
            resultDiv.textContent = 'Subiendo...';
            resultDiv.style.display = 'block';
            
            const response = await fetch('/api/ftp-up', {
              method: 'POST',
              headers: {
                'Authorization': 'Basic ' + btoa('quadrifoglio:secure_password')
              },
              body: formData
            });
            
            if (!response.ok) {
              throw new Error('Error: ' + response.status + ' ' + response.statusText);
            }
            
            const data = await response.json();
            resultDiv.innerHTML = '<strong>Resultado:</strong><br>' + JSON.stringify(data, null, 2).replace(/\\n/g, '<br>').replace(/ /g, '&nbsp;');
          } catch (error) {
            resultDiv.textContent = 'Error: ' + error.message;
          }
        });
      </script>
    </body>
    </html>
  `,
    {
      headers: {
        "Content-Type": "text/html",
      },
    },
  )
}

// Manejar solicitudes POST (para subir archivos)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación básica
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !verifyAuth(authHeader)) {
      return new Response("Unauthorized", { status: 401 })
    }

    // Obtener el tipo de datos y el archivo
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return new Response("Missing file", { status: 400 })
    }

    // Identificar el local (asumimos BR Pacifico por defecto)
    const locationId = "local-3"
    const locationName = "BR Pacifico"

    // Guardar archivo en Vercel Blob Storage
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `${locationId}_${timestamp}_${file.name}`
    const blob = await put(filename, file, { access: "private" })

    // Registrar la sincronización en la base de datos
    try {
      await supabase.from("sync_logs").insert({
        location_id: locationId,
        location_name: locationName,
        data_type: "ventas", // Asumimos ventas por defecto
        rows_processed: 1,
        sync_date: new Date().toISOString(),
        file_name: file.name,
      })
      console.log("Registro de sincronización guardado en la base de datos")
    } catch (error) {
      console.error("Error al guardar registro de sincronización:", error)
    }

    return Response.json({
      success: true,
      message: `File uploaded successfully as ${filename}`,
      url: blob.url,
    })
  } catch (error) {
    console.error("Error processing upload:", error)
    return new Response("Error processing upload", { status: 500 })
  }
}

// Función para verificar autenticación básica
function verifyAuth(authHeader: string): boolean {
  if (!authHeader.startsWith("Basic ")) return false

  const base64Credentials = authHeader.split(" ")[1]
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
  const [username, password] = credentials.split(":")

  return username === FTP_USERNAME && password === FTP_PASSWORD
}



