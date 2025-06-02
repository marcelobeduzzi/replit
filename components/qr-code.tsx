import { QRCode as QRCodeComponent } from "qrcode.react"

// Este componente es un adaptador que mantiene la API existente
// pero usa la importación correcta de qrcode.react
export function QRCode(props) {
  return <QRCodeComponent {...props} />
}

// También exportamos como default para mantener compatibilidad
export default QRCode
