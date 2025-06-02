// En tu formulario de ventas, añade estas líneas:

// 1. Importa el componente StockCheck
import { StockCheck } from './stock-check'

// 2. Añade un estado para controlar si hay stock disponible
const [hasStock, setHasStock] = useState(true)

// 3. Añade el componente StockCheck en tu formulario, justo antes del botón de envío
<StockCheck 
  items={form.getValues('items')} 
  onStockCheck={setHasStock} 
/>

// 4. Modifica la función onSubmit para usar el nuevo método registerSale
async function onSubmit(data) {
  setIsSubmitting(true)
  setError(null)
  
  try {
    // Verificar stock una última vez antes de procesar
    const stockCheck = await salesService.checkStockForSale(data.items)
    
    if (!stockCheck.hasStock) {
      setHasStock(false)
      setIsSubmitting(false)
      return
    }
    
    // Procesar la venta (esto descontará automáticamente del inventario)
    const sale = await salesService.registerSale({
      ...data,
      createdBy: user?.name || user?.email || 'Usuario'
    })
    
    // Redirigir a la página de detalles de la venta
    router.push(`/ventas/detalle/${sale.id}`)
  } catch (error) {
    console.error("Error al procesar venta:", error)
    setError("Error al procesar la venta. Por favor, intenta nuevamente.")
  } finally {
    setIsSubmitting(false)
  }
}

// 5. Deshabilita el botón de envío si no hay stock
<Button 
  type="submit" 
  disabled={isSubmitting || !hasStock}
>
  {isSubmitting ? "Procesando..." : "Registrar Venta"}
</Button>