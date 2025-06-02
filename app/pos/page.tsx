"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { ShoppingCart, Plus, Minus, Trash2, Receipt, CheckCircle, AlertCircle, ArrowLeft, Search, RefreshCw } from 'lucide-react'
import { tusFacturasService } from "@/lib/tusfacturas-service" // Importar el servicio de facturación
import { FacturaButton } from "@/components/factura-button" // Importar el componente FacturaButton

export default function POSSystem() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cartItems, setCartItems] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [orderChannel, setOrderChannel] = useState("local")
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [recentSales, setRecentSales] = useState([])
  const [isLoadingRecentSales, setIsLoadingRecentSales] = useState(false)
  const [showFacturaDialog, setShowFacturaDialog] = useState(false) // Estado para controlar el diálogo de factura

  // Cargar productos y categorías
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // 1. Cargar categorías
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('sales_categories')
        .select('*')
      
      if (categoriesError) {
        console.error("Error al cargar categorías:", categoriesError)
        throw categoriesError
      }
      
      // 2. Cargar productos con sus precios
      // Primero cargamos los productos que no son variantes (productos principales)
      const { data: productsData, error: productsError } = await supabase
        .from('sales_products')
        .select(`
          id, 
          name, 
          description, 
          image_url, 
          is_active, 
          category_id, 
          is_variant,
          variant_name
        `)
        .eq('is_active', true)
        .eq('is_variant', false)
      
      if (productsError) {
        console.error("Error al cargar productos:", productsError)
        throw productsError
      }
      
      // Luego cargamos las variantes
      const { data: variantsData, error: variantsError } = await supabase
        .from('sales_products')
        .select(`
          id, 
          name, 
          description, 
          image_url, 
          is_active, 
          category_id, 
          parent_id,
          is_variant,
          variant_name
        `)
        .eq('is_active', true)
        .eq('is_variant', true)
      
      if (variantsError) {
        console.error("Error al cargar variantes:", variantsError)
        throw variantsError
      }
      
      // 3. Cargar precios de productos
      const { data: pricesData, error: pricesError } = await supabase
        .from('sales_product_prices')
        .select('*')
      
      if (pricesError) {
        console.error("Error al cargar precios:", pricesError)
        throw pricesError
      }
      
      // 4. Cargar inventario (si existe)
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('sales_inventory')
        .select('*')
      
      if (inventoryError && inventoryError.code !== 'PGRST116') {
        // PGRST116 significa que la tabla no existe, lo cual es aceptable
        console.error("Error al cargar inventario:", inventoryError)
      }
      
      // Mapear categorías
      const formattedCategories = categoriesData.map(category => ({
        id: category.id,
        name: category.name || 'Sin nombre'
      }))
      
      // Crear un mapa de precios por producto_id
      const priceMap = {}
      if (pricesData) {
        pricesData.forEach(price => {
          if (!priceMap[price.product_id]) {
            priceMap[price.product_id] = {}
          }
          // Asumimos que el channel puede ser 'local', 'pedidosya', 'rappi', etc.
          priceMap[price.product_id][price.channel || 'local'] = price.price
        })
      }
      
      // Crear un mapa de inventario por product_id
      const inventoryMap = {}
      if (inventoryData) {
        inventoryData.forEach(item => {
          inventoryMap[item.product_id] = item.current_quantity || 0
        })
      }
      
      // Crear un mapa de variantes por parent_id
      const variantsMap = {}
      if (variantsData) {
        variantsData.forEach(variant => {
          if (!variantsMap[variant.parent_id]) {
            variantsMap[variant.parent_id] = []
          }
          variantsMap[variant.parent_id].push({
            id: variant.id,
            name: variant.variant_name || variant.name,
            description: variant.description,
            category_id: variant.category_id,
            price: priceMap[variant.id] ? priceMap[variant.id]['local'] || 0 : 0,
            price_pedidosya: priceMap[variant.id] ? priceMap[variant.id]['pedidosya'] || 0 : 0,
            price_rappi: priceMap[variant.id] ? priceMap[variant.id]['rappi'] || 0 : 0,
            stock: inventoryMap[variant.id] || 0
          })
        })
      }
      
      // Formatear productos con sus variantes y precios
      const formattedProducts = productsData.map(product => {
        // Buscar la categoría del producto
        const category = formattedCategories.find(c => c.id === product.category_id)
        
        // Obtener las variantes del producto
        const variants = variantsMap[product.id] || []
        
        // Si el producto tiene variantes, lo expandimos a múltiples productos
        if (variants.length > 0) {
          return variants.map(variant => ({
            id: variant.id,
            name: `${product.name} - ${variant.name}`,
            description: variant.description || product.description,
            category: category ? category.name : 'Sin categoría',
            category_id: variant.category_id,
            price: variant.price,
            price_pedidosya: variant.price_pedidosya,
            price_rappi: variant.price_rappi,
            stock: variant.stock,
            is_variant: true,
            parent_id: product.id
          }))
        } else {
          // Si no tiene variantes, devolvemos el producto principal
          return [{
            id: product.id,
            name: product.name,
            description: product.description,
            category: category ? category.name : 'Sin categoría',
            category_id: product.category_id,
            price: priceMap[product.id] ? priceMap[product.id]['local'] || 0 : 0,
            price_pedidosya: priceMap[product.id] ? priceMap[product.id]['pedidosya'] || 0 : 0,
            price_rappi: priceMap[product.id] ? priceMap[product.id]['rappi'] || 0 : 0,
            stock: inventoryMap[product.id] || 0,
            is_variant: false,
            parent_id: null
          }]
        }
      })
      
      // Aplanar el array de productos (ya que algunos pueden ser arrays de variantes)
      const flattenedProducts = formattedProducts.flat()
      
      console.log("Productos formateados:", flattenedProducts)
      
      // Extraer categorías únicas de los productos
      const uniqueCategories = [...new Set(flattenedProducts.map(item => item.category))]
        .filter(category => category) // Eliminar valores nulos o vacíos
      
      setProducts(flattenedProducts)
      setCategories(uniqueCategories)
      
      // Cargar ventas recientes
      await loadRecentSales()
    } catch (error) {
      console.error("Error al cargar datos:", error)
      setErrorMessage("Error al cargar productos. Por favor, recarga la página.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cargar ventas recientes
  const loadRecentSales = async () => {
    try {
      setIsLoadingRecentSales(true)
      
      // Cargar las ventas recientes
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) throw error
      
      // Si no hay datos, usar un array vacío
      const salesData = data || []
      
      console.log("Ventas recientes cargadas:", salesData)
      
      // Formatear los datos
      const formattedSales = salesData.map(sale => ({
        id: sale.id,
        date: sale.created_at,
        total: sale.total_amount || 0,
        items: 0, // No tenemos esta información directamente
        paymentMethod: sale.payment_method || 'Desconocido',
        status: sale.payment_status || 'pending',
        channel: sale.channel || 'local'
      }))
      
      setRecentSales(formattedSales)
    } catch (error) {
      console.error("Error al cargar ventas recientes:", error)
      // No mostrar error al usuario para no interrumpir la experiencia
    } finally {
      setIsLoadingRecentSales(false)
    }
  }

  // Efecto para cargar los datos al montar el componente
  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtrar productos por categoría y búsqueda
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Agregar producto al carrito
  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id)
    
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price } 
          : item
      ))
    } else {
      // Determinar qué precio usar según el canal
      let price = product.price || 0
      if (orderChannel === "pedidosya" && product.price_pedidosya) {
        price = product.price_pedidosya
      } else if (orderChannel === "rappi" && product.price_rappi) {
        price = product.price_rappi
      }
      
      setCartItems([...cartItems, { 
        id: product.id, 
        name: product.name, 
        price: price,
        quantity: 1,
        subtotal: price
      }])
    }
  }

  // Incrementar cantidad de un producto en el carrito
  const incrementQuantity = (id) => {
    setCartItems(cartItems.map(item => 
      item.id === id 
        ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price } 
        : item
    ))
  }

  // Decrementar cantidad de un producto en el carrito
  const decrementQuantity = (id) => {
    setCartItems(cartItems.map(item => 
      item.id === id && item.quantity > 1
        ? { ...item, quantity: item.quantity - 1, subtotal: (item.quantity - 1) * item.price } 
        : item
    ).filter(item => item.quantity > 0))
  }

  // Eliminar producto del carrito
  const removeFromCart = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id))
  }

  // Calcular total
  const total = cartItems.reduce((sum, item) => sum + item.subtotal, 0)

  // Procesar venta
  const processSale = async () => {
    if (cartItems.length === 0) {
      setErrorMessage("No hay productos en el carrito")
      return
    }
    
    if (!paymentMethod) {
      setErrorMessage("Selecciona un método de pago")
      return
    }
    
    setIsSaving(true)
    setErrorMessage("")
    
    try {
      // 1. Crear la venta en la tabla sales_orders
      const { data: orderData, error: orderError } = await supabase
        .from('sales_orders')
        .insert({
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: paymentConfirmed ? 'completed' : 'pending',
          channel: orderChannel,
          created_by: "encargado" // Idealmente, usar el ID o nombre del usuario actual
        })
        .select()
      
      if (orderError) throw orderError
      
      const orderId = orderData[0].id
      
      // 2. Crear los items de la venta
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }))
      
      const { error: itemsError } = await supabase
        .from('sales_order_items')
        .insert(orderItems)
      
      if (itemsError) throw itemsError
      
      // 3. Actualizar el inventario (si existe la tabla)
      try {
        for (const item of cartItems) {
          // Intentar actualizar el inventario
          const { error: updateError } = await supabase
            .from('sales_inventory')
            .update({ 
              current_quantity: supabase.rpc('decrement', { x: item.quantity })
            })
            .eq('product_id', item.id)
          
          if (updateError && updateError.code !== 'PGRST116') {
            console.error("Error al actualizar inventario:", updateError)
          }
        }
      } catch (inventoryError) {
        console.error("Error al actualizar inventario:", inventoryError)
        // Continuar con el proceso aunque falle la actualización del inventario
      }
      
      // Limpiar carrito y mostrar mensaje de éxito
      setCartItems([])
      setPaymentMethod("")
      setPaymentConfirmed(false)
      setSuccessMessage(`Venta #${orderId} registrada correctamente`)
      
      // Recargar ventas recientes
      loadRecentSales()
      
    } catch (error) {
      console.error("Error al procesar venta:", error)
      setErrorMessage("Error al procesar la venta. Intenta nuevamente.")
    } finally {
      setIsSaving(false)
    }
  }

  // Generar factura - FUNCIÓN ACTUALIZADA
  const generateInvoice = async () => {
    console.log("Iniciando generación de factura");
    
    if (!cartItems.length) {
      setErrorMessage("No hay productos para facturar");
      return;
    }
    
    // Verificar si las credenciales están configuradas
    if (!tusFacturasService.hasCredentials()) {
      console.error("No hay credenciales configuradas para TusFacturasAPP");
      setErrorMessage("No se han configurado las credenciales para TusFacturasAPP. Vaya a Configuración > Facturación.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Preparar los datos de la venta para la factura
      const ventaData = {
        customerName: "Consumidor Final", // Puedes agregar un campo para capturar esto
        customerDocument: "0", // Puedes agregar un campo para capturar esto
        totalAmount: total,
        items: cartItems.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        channel: orderChannel,
        paymentMethod: paymentMethod
      };
      
      console.log("Datos de venta para facturación:", ventaData);
      
      // Convertir la venta al formato de TusFacturas
      const { cliente, comprobante } = tusFacturasService.convertirVentaAFactura(ventaData);
      
      console.log("Datos convertidos para TusFacturas:", { cliente, comprobante });
      
      // Generar la factura
      const response = await tusFacturasService.generarFactura(cliente, comprobante);
      
      console.log("Respuesta de TusFacturas:", response);
      
      if (response.error) {
        setErrorMessage(`Error al generar factura: ${response.errores?.join(", ") || "Error desconocido"}`);
      } else {
        setSuccessMessage(`Factura generada correctamente. ${response.cae ? `CAE: ${response.cae}` : "Comprobante de prueba generado con éxito"}`);
      }
    } catch (error) {
      console.error("Error al generar factura:", error);
      setErrorMessage(`Error al generar la factura: ${error.message || "Error desconocido"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar el éxito de la facturación
  const handleFacturaSuccess = (facturaData) => {
    console.log("Factura generada con éxito:", facturaData);
    setSuccessMessage(`Factura generada correctamente. ${facturaData.cae ? `CAE: ${facturaData.cae}` : "Comprobante de prueba generado con éxito"}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Encabezado */}
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="secondary" 
              size="icon" 
              className="mr-2"
              onClick={() => router.push('/ventas')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Punto de Venta</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={loadData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => router.push('/ventas/historial')}
            >
              Ver Historial
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto p-4">
        {/* Mensajes de éxito o error */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>{successMessage}</span>
            <button 
              className="absolute top-0 right-0 p-2" 
              onClick={() => setSuccessMessage("")}
            >
              &times;
            </button>
          </div>
        )}
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{errorMessage}</span>
            <button 
              className="absolute top-0 right-0 p-2" 
              onClick={() => setErrorMessage("")}
            >
              &times;
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Panel de productos */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  {/* Selector de canal */}
                  <div className="w-full md:w-1/3">
                    <Label htmlFor="channel">Canal de Venta</Label>
                    <Select 
                      value={orderChannel} 
                      onValueChange={setOrderChannel}
                    >
                      <SelectTrigger id="channel">
                        <SelectValue placeholder="Seleccionar canal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local</SelectItem>
                        <SelectItem value="pedidosya">PedidosYa</SelectItem>
                        <SelectItem value="rappi">Rappi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Búsqueda */}
                  <div className="w-full md:w-2/3">
                    <Label htmlFor="search">Buscar Producto</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Nombre del producto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Categorías */}
                <div className="mb-4">
                  <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
                    <TabsList className="w-full overflow-x-auto flex-nowrap">
                      <TabsTrigger value="all">Todos</TabsTrigger>
                      {categories.map((category) => (
                        <TabsTrigger key={category} value={category}>
                          {category}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                
                {/* Lista de productos */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, index) => (
                      <Card key={index} className="animate-pulse">
                        <CardContent className="p-4 text-center">
                          <div className="h-5 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
                        </CardContent>
                      </Card>
                    ))
                  ) : filteredProducts.length === 0 ? (
                    <p className="col-span-full text-center text-muted-foreground py-8">
                      No se encontraron productos
                    </p>
                  ) : (
                    filteredProducts.map((product) => (
                      <Card 
                        key={product.id} 
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="font-medium truncate">{product.name || 'Producto sin nombre'}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {product.category || 'Sin categoría'}
                          </div>
                          <div className="mt-2 font-bold">
                            ${orderChannel === "pedidosya" && product.price_pedidosya 
                              ? product.price_pedidosya.toFixed(2) 
                              : orderChannel === "rappi" && product.price_rappi 
                                ? product.price_rappi.toFixed(2)
                                : (product.price || 0).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Stock: {product.stock || 0}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel del carrito */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Carrito
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCartItems([])}
                    disabled={cartItems.length === 0}
                  >
                    Limpiar
                  </Button>
                </div>
                
                {/* Items del carrito */}
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay productos en el carrito
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center border-b pb-2">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} x {item.quantity}
                          </div>
                        </div>
                        <div className="font-bold mr-4">
                          ${item.subtotal.toFixed(2)}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => decrementQuantity(item.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => incrementQuantity(item.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="font-bold text-lg">Total:</div>
                      <div className="font-bold text-lg">${total.toFixed(2)}</div>
                    </div>
                  </div>
                )}
                
                {/* Opciones de pago */}
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="payment-method">Método de Pago</Label>
                    <Select 
                      value={paymentMethod} 
                      onValueChange={setPaymentMethod}
                    >
                      <SelectTrigger id="payment-method">
                        <SelectValue placeholder="Seleccionar método" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Efectivo</SelectItem>
                        <SelectItem value="card">Tarjeta</SelectItem>
                        <SelectItem value="transfer">Transferencia</SelectItem>
                        <SelectItem value="mercadopago">MercadoPago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Confirmación de pago */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="payment-confirmed"
                      checked={paymentConfirmed}
                      onChange={() => setPaymentConfirmed(!paymentConfirmed)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="payment-confirmed" className="text-sm">
                      Pago confirmado
                    </Label>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="default" 
                      className="w-full"
                      disabled={cartItems.length === 0 || isSaving}
                      onClick={processSale}
                    >
                      {isSaving ? "Procesando..." : "Finalizar Venta"}
                    </Button>
                    
                    {/* CAMBIO IMPORTANTE: Reemplazar el botón de facturar con el componente FacturaButton */}
                    <FacturaButton 
                      venta={{
                        customerName: "Consumidor Final",
                        customerDocument: "0",
                        total: total,
                        items: cartItems.map(item => ({
                          productId: item.id,
                          productName: item.name,
                          quantity: item.quantity,
                          price: item.price
                        })),
                        channel: orderChannel,
                        paymentMethod: paymentMethod
                      }}
                      onSuccess={handleFacturaSuccess}
                      variant="outline"
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Ventas recientes */}
        <div className="mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Ventas Recientes</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadRecentSales}
                  disabled={isLoadingRecentSales}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingRecentSales ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Método de Pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRecentSales ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Cargando ventas recientes...
                        </TableCell>
                      </TableRow>
                    ) : recentSales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No hay ventas recientes
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>{sale.id}</TableCell>
                          <TableCell>{new Date(sale.date).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              sale.channel === "local" 
                                ? "bg-blue-100 text-blue-800" 
                                : sale.channel === "pedidosya"
                                  ? "bg-[#FF5A5F]/20 text-[#FF5A5F]"
                                  : "bg-[#FF9500]/20 text-[#FF9500]"
                            }`}>
                              {sale.channel}
                            </span>
                          </TableCell>
                          <TableCell>{sale.paymentMethod}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              sale.status === "completed" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {sale.status === "completed" ? "Pagado" : "Pendiente"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${sale.total.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Link href={`/ventas/detalle/${sale.id}`}>
                              <Button variant="ghost" size="sm">
                                Ver
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}