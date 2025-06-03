import type { Employee, Payroll, Audit, Balance, Order } from "@/types"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
// Importar las nuevas funciones de date-utils
import { formatDisplayDate } from "./date-utils"

// Función para formatear fechas - Actualizada para usar las nuevas utilidades
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "-"

  try {
    // Usar la nueva función formatDisplayDate
    return formatDisplayDate(dateString)
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return dateString || "-" // Devolver el string original en caso de error
  }
}

// Función para exportar datos a CSV
export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) {
    console.error("No hay datos para exportar")
    return
  }

  // Obtener encabezados
  const headers = Object.keys(data[0])

  // Crear contenido CSV
  const csvContent = [
    headers.join(","), // Encabezados
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header]
          // Manejar valores especiales
          if (value === null || value === undefined) return ""
          if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`
          if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`
          return value
        })
        .join(","),
    ),
  ].join("\n")

  // Crear blob y descargar
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Función para generar reporte de auditoría en PDF
// Función para generar reporte de auditoría en PDF - CORREGIDA para manejar datos indefinidos
// Define the AuditItem type
interface AuditItem {
  name: string
  value: number
  completed: boolean
  category: string
}

export const generateAuditReport = (audit: Audit) => {
  try {
    // Verificar que audit sea un objeto válido
    if (!audit) {
      console.error("Error: audit es undefined o null")
      throw new Error("Datos de auditoría inválidos para generar reporte")
    }

    const doc = new jsPDF()

    // Encabezado
    doc.setFontSize(18)
    doc.text("REPORTE DE AUDITORÍA", 105, 20, { align: "center" })

    // Información general
    doc.setFontSize(12)
    doc.text(`Local: ${audit.localName || audit.local || "No especificado"}`, 14, 30)
    doc.text(`Fecha: ${formatDate(audit.date) || "No especificada"}`, 14, 35)
    doc.text(`Auditor: ${audit.auditorName || audit.auditor || "No especificado"}`, 14, 40)

    // Verificar si existe el campo shift
    if (audit.shift) {
      doc.text(
        `Turno: ${audit.shift === "morning" ? "Mañana" : audit.shift === "afternoon" ? "Tarde" : "Noche"}`,
        14,
        45,
      )
      doc.text(`Encargado: ${audit.managerName || "No especificado"}`, 14, 50)
      doc.text(`Puntaje Total: ${audit.totalScore || 0} / ${audit.maxScore || 150}`, 14, 55)
    } else {
      // Si no existe shift, es el nuevo formato de auditoría
      doc.text(`Puntaje Total: ${audit.totalScore || 0} / ${audit.maxScore || 0}`, 14, 45)
      doc.text(`Porcentaje: ${audit.percentage || 0}%`, 14, 50)
    }

    let yPos = 60

    // Verificar si tiene el campo categories (nuevo formato)
    if (audit.categories && Array.isArray(audit.categories) && audit.categories.length > 0) {
      // Mostrar resumen de categorías
      doc.setFontSize(14)
      doc.text("Resumen por Categorías", 14, yPos)
      yPos += 5
      doc.line(14, yPos, 196, yPos)
      yPos += 10

      // Tabla de categorías
      const categoryColumn = ["Categoría", "Puntaje", "Porcentaje"]
      const categoryRows = audit.categories.map((category) => {
        const categoryName = category.name || "Sin nombre"
        const categoryScore = category.score || 0
        const categoryMaxScore = category.maxScore || 1 // Evitar división por cero
        const percentage = Math.round((categoryScore / categoryMaxScore) * 100)

        return [categoryName, `${categoryScore} / ${categoryMaxScore}`, `${percentage}%`]
      })

      doc.autoTable({
        startY: yPos,
        head: [categoryColumn],
        body: categoryRows,
        theme: "grid",
        headStyles: {
          fillColor: [40, 40, 40],
          textColor: 255,
          fontStyle: "bold",
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 15

      // Detalles por categoría
      doc.setFontSize(14)
      doc.text("Detalle por Categorías", 14, yPos)
      yPos += 5
      doc.line(14, yPos, 196, yPos)
      yPos += 10

      // Recorrer cada categoría
      for (const category of audit.categories) {
        // Verificar si hay espacio suficiente en la página
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }

        // Verificar que category sea un objeto válido
        if (!category) continue

        doc.setFontSize(12)
        doc.text(`${category.name || "Sin nombre"} (${category.score || 0}/${category.maxScore || 0})`, 14, yPos)
        yPos += 5

        // Verificar que items sea un array válido
        if (!category.items || !Array.isArray(category.items) || category.items.length === 0) {
          doc.text("No hay ítems en esta categoría", 14, yPos + 5)
          yPos += 15
          continue
        }

        // Tabla de items
        const itemColumn = ["Ítem", "Puntaje", "Observaciones"]
        const itemRows = category.items.map((item) => [
          item.name || "Sin nombre",
          `${item.score || 0} / ${item.maxScore || 0}`,
          item.observations || "",
        ])

        doc.autoTable({
          startY: yPos,
          head: [itemColumn],
          body: itemRows,
          theme: "grid",
          headStyles: {
            fillColor: [40, 40, 40],
            textColor: 255,
            fontStyle: "bold",
          },
          columnStyles: {
            2: { cellWidth: 80 }, // Ancho para observaciones
          },
        })

        yPos = (doc as any).lastAutoTable.finalY + 10
      }
    } else if (audit.items && Array.isArray(audit.items) && audit.items.length > 0) {
      // Formato antiguo con items
      // Agrupar items por categoría
      const itemsByCategory: Record<string, AuditItem[]> = {}
      audit.items.forEach((item) => {
        if (!item || !item.category) return

        if (!itemsByCategory[item.category]) {
          itemsByCategory[item.category] = []
        }
        itemsByCategory[item.category].push(item)
      })

      // Mostrar items por categoría
      Object.entries(itemsByCategory).forEach(([category, items]) => {
        // Verificar si hay espacio suficiente en la página
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(14)
        doc.text(`${category}`, 14, yPos)
        yPos += 5
        doc.line(14, yPos, 196, yPos)
        yPos += 10

        // Calcular puntaje de la categoría
        const categoryScore = items.reduce((sum, item) => sum + (item.completed ? item.value : 0), 0)
        const categoryMaxScore = items.reduce((sum, item) => sum + item.value, 0)

        doc.setFontSize(12)
        doc.text(`Puntaje: ${categoryScore} / ${categoryMaxScore}`, 14, yPos)
        yPos += 10

        // Tabla de items
        const tableColumn = ["Item", "Valor", "Completado"]
        const tableRows = items.map((item) => [
          item.name || "Sin nombre",
          (item.value || 0).toString(),
          item.completed ? "Sí" : "No",
        ])

        doc.autoTable({
          startY: yPos,
          head: [tableColumn],
          body: tableRows,
          theme: "grid",
          headStyles: {
            fillColor: [40, 40, 40],
            textColor: 255,
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },
        })

        yPos = (doc as any).lastAutoTable.finalY + 15
      })
    } else {
      // No hay datos de categorías ni items
      doc.setFontSize(12)
      doc.text("No hay datos detallados disponibles para esta auditoría", 14, yPos)
      yPos += 10
    }

    // Observaciones generales
    if (audit.notes || audit.observations || audit.generalObservations) {
      // Verificar si hay espacio suficiente en la página
      if (yPos > 250) {
        doc.addPage()
        yPos = 20
      }

      doc.setFontSize(14)
      doc.text("Observaciones Generales", 14, yPos)
      yPos += 5
      doc.line(14, yPos, 196, yPos)
      yPos += 10

      doc.setFontSize(12)
      const observations = audit.notes || audit.observations || audit.generalObservations
      const splitText = doc.splitTextToSize(observations, 180)
      doc.text(splitText, 14, yPos)
    }

    // Guardar PDF
    const localName = audit.localName || audit.local || "Local"
    const formattedDate = formatDate(audit.date).replace(/\//g, "-")
    doc.save(`Auditoria_${localName}_${formattedDate}.pdf`)
  } catch (error) {
    console.error("Error al generar reporte de auditoría:", error)
    alert("Ocurrió un error al generar el reporte de auditoría. Por favor, intente nuevamente.")
  }
}

// Función para formatear moneda
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Función para calcular días trabajados
export const calculateWorkedDays = (hireDate: string, terminationDate?: string): number => {
  const start = new Date(hireDate)
  const end = terminationDate ? new Date(terminationDate) : new Date()

  // Calcular diferencia en milisegundos
  const diffTime = Math.abs(end.getTime() - start.getTime())

  // Convertir a días
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

// Función para generar recibo de sueldo en PDF
export const generatePayslip = (payroll: Payroll, employee: Employee) => {
  try {
    const doc = new jsPDF()

    // Encabezado
    doc.setFontSize(18)
    doc.text("RECIBO DE SUELDO", 105, 20, { align: "center" })

    // Información de la empresa
    doc.setFontSize(12)
    doc.text("Quadrifoglio S.A.", 14, 30)
    doc.text("CUIT: 30-12345678-9", 14, 35)
    doc.text("Av. Corrientes 1234, CABA", 14, 40)

    // Información del empleado
    doc.text("INFORMACIÓN DEL EMPLEADO", 14, 50)
    doc.line(14, 51, 196, 51)

    doc.text(`Nombre: ${employee.firstName} ${employee.lastName}`, 14, 60)
    doc.text(`DNI: ${employee.documentId}`, 14, 65)
    doc.text(`Cargo: ${employee.position}`, 14, 70)
    doc.text(`Local: ${employee.local}`, 14, 75)
    doc.text(`Fecha de ingreso: ${formatDate(employee.hireDate)}`, 14, 80)

    // Información del período
    doc.text("PERÍODO", 14, 90)
    doc.line(14, 91, 196, 91)

    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]
    doc.text(`Mes: ${monthNames[payroll.month - 1]} ${payroll.year}`, 14, 100)

    // Detalle de haberes y deducciones
    doc.text("DETALLE DE HABERES Y DEDUCCIONES", 14, 110)
    doc.line(14, 111, 196, 111)

    // Tabla de conceptos
    const tableColumn = ["Concepto", "Tipo", "Monto"]
    const tableRows = [
      ["Sueldo Base", "Haber", formatCurrency(payroll.baseSalary)],
      ["Sueldo Banco", "Haber", formatCurrency(payroll.bankSalary)],
    ]

    // Agregar deducciones y adiciones calculadas de asistencias
    if (payroll.deductions && payroll.deductions > 0) {
      tableRows.push(["Deducciones por Asistencias", "Deducción", `- ${formatCurrency(payroll.deductions)}`])
    }
    
    if (payroll.additions && payroll.additions > 0) {
      tableRows.push(["Adiciones por Asistencias", "Adición", formatCurrency(payroll.additions)])
    }

    // Agregar bono de presentismo si aplica
    if (payroll.hasAttendanceBonus && payroll.attendanceBonus && payroll.attendanceBonus > 0) {
      tableRows.push(["Bono de Presentismo", "Adición", formatCurrency(payroll.attendanceBonus)])
    }

    // Agregar detalles adicionales de payroll_details
    if (payroll.details && Array.isArray(payroll.details)) {
      payroll.details.forEach((detail) => {
        if (detail.type === "deduction") {
          tableRows.push([detail.concept, "Deducción", `- ${formatCurrency(detail.amount)}`])
        } else if (detail.type === "addition") {
          tableRows.push([detail.concept, "Adición", formatCurrency(detail.amount)])
        } else if (detail.type === "payment") {
          tableRows.push([detail.concept, "Pago", formatCurrency(detail.amount)])
        }
      })
    }

    // Totales
    tableRows.push(
      ["TOTAL DEDUCCIONES", "", `- ${formatCurrency(payroll.deductions || 0)}`],
      ["TOTAL ADICIONES", "", formatCurrency(payroll.additions || 0)],
      ["SUELDO EN MANO FINAL", "", formatCurrency(payroll.finalHandSalary || 0)],
      ["SUELDO TOTAL", "", formatCurrency(payroll.totalSalary || 0)],
    )

    doc.autoTable({
      startY: 115,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: {
        fillColor: [40, 40, 40],
        textColor: 255,
        fontStyle: "bold",
      },
    })

    // Firmas
    const finalY = (doc as any).lastAutoTable.finalY + 20

    doc.text("_______________________", 40, finalY)
    doc.text("_______________________", 150, finalY)

    doc.text("Firma del Empleado", 40, finalY + 10)
    doc.text("Firma del Empleador", 150, finalY + 10)

    // Guardar PDF
    doc.save(`Recibo_${employee.firstName}_${employee.lastName}_${payroll.month}_${payroll.year}.pdf`)
  } catch (error) {
    console.error("Error al generar recibo de sueldo:", error)
    alert("Ocurrió un error al generar el recibo de sueldo. Por favor, intente nuevamente.")
  }
}

// Función para exportar a PDF
export const exportToPDF = (
  data: any[],
  title: string,
  filename: string,
  columns?: { header: string; dataKey: string }[],
) => {
  try {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text(title, 14, 22)

    // Fecha
    doc.setFontSize(11)
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 14, 30)

    // Si no se proporcionan columnas, generarlas automáticamente
    if (!columns && data.length > 0) {
      columns = Object.keys(data[0]).map((key) => ({
        header: key.charAt(0).toUpperCase() + key.slice(1),
        dataKey: key,
      }))
    }

    // Crear tabla
    doc.autoTable({
      startY: 40,
      head: [columns?.map((col) => col.header) || []],
      body: data.map((item) => columns?.map((col) => item[col.dataKey]) || []),
      theme: "grid",
      headStyles: {
        fillColor: [40, 40, 40],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    })

    // Guardar PDF
    doc.save(`${filename}.pdf`)
  } catch (error) {
    console.error("Error al exportar a PDF:", error)
    alert("Ocurrió un error al exportar a PDF. Por favor, intente nuevamente.")
  }
}

// Función para generar reporte de balance en PDF
export const generateBalanceReport = (balance: Balance) => {
  try {
    if (!balance) {
      console.error("Error: balance es undefined o null")
      throw new Error("Datos de balance inválidos para generar reporte")
    }

    const doc = new jsPDF()

    // Encabezado
    doc.setFontSize(18)
    doc.text("REPORTE DE BALANCE", 105, 20, { align: "center" })

    // Información general
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]

    doc.setFontSize(12)
    doc.text(`Local: ${balance.local || "No especificado"}`, 14, 30)
    doc.text(`Período: ${monthNames[(balance.month || 1) - 1]} ${balance.year || new Date().getFullYear()}`, 14, 35)

    // Ingresos
    doc.setFontSize(14)
    doc.text("INGRESOS", 14, 45)
    doc.line(14, 46, 196, 46)

    doc.setFontSize(12)
    doc.text(`Ventas en Mostrador: ${formatCurrency(balance.counterSales || 0)}`, 14, 55)
    doc.text(`Ventas por Delivery: ${formatCurrency(balance.deliverySales || 0)}`, 14, 60)
    doc.text(`TOTAL INGRESOS: ${formatCurrency(balance.totalIncome || 0)}`, 14, 70)

    // Gastos
    doc.setFontSize(14)
    doc.text("GASTOS", 14, 80)
    doc.line(14, 81, 196, 81)

    doc.setFontSize(12)
    doc.text(`Nómina: ${formatCurrency(balance.payrollExpenses || 0)}`, 14, 90)
    doc.text(`Alquiler: ${formatCurrency(balance.rentExpenses || 0)}`, 14, 95)
    doc.text(`Expensas: ${formatCurrency(balance.maintenanceExpenses || 0)}`, 14, 100)
    doc.text(`Mercadería: ${formatCurrency(balance.suppliesExpenses || 0)}`, 14, 105)
    doc.text(`Reparaciones: ${formatCurrency(balance.repairsExpenses || 0)}`, 14, 110)
    doc.text(`Otros: ${formatCurrency(balance.otherExpenses || 0)}`, 14, 115)
    doc.text(`TOTAL GASTOS: ${formatCurrency(balance.totalExpenses || 0)}`, 14, 125)

    // Resultado
    doc.setFontSize(16)
    doc.text("RESULTADO", 14, 140)
    doc.line(14, 141, 196, 141)

    doc.setFontSize(14)
    doc.text(`RENTABILIDAD NETA: ${formatCurrency(balance.netProfit || 0)}`, 14, 150)

    // Gráfico de distribución de gastos (simulado con texto)
    doc.setFontSize(14)
    doc.text("DISTRIBUCIÓN DE GASTOS", 14, 170)
    doc.line(14, 171, 196, 171)

    // Calcular porcentajes
    const totalExpenses = balance.totalExpenses || 1 // Evitar división por cero
    const payrollPercentage = (((balance.payrollExpenses || 0) / totalExpenses) * 100).toFixed(2)
    const rentPercentage = (((balance.rentExpenses || 0) / totalExpenses) * 100).toFixed(2)
    const maintenancePercentage = (((balance.maintenanceExpenses || 0) / totalExpenses) * 100).toFixed(2)
    const suppliesPercentage = (((balance.suppliesExpenses || 0) / totalExpenses) * 100).toFixed(2)
    const repairsPercentage = (((balance.repairsExpenses || 0) / totalExpenses) * 100).toFixed(2)
    const otherPercentage = (((balance.otherExpenses || 0) / totalExpenses) * 100).toFixed(2)

    doc.setFontSize(12)
    doc.text(`Nómina: ${payrollPercentage}%`, 14, 180)
    doc.text(`Alquiler: ${rentPercentage}%`, 14, 185)
    doc.text(`Expensas: ${maintenancePercentage}%`, 14, 190)
    doc.text(`Mercadería: ${suppliesPercentage}%`, 14, 195)
    doc.text(`Reparaciones: ${repairsPercentage}%`, 14, 200)
    doc.text(`Otros: ${otherPercentage}%`, 14, 205)

    // Guardar PDF
    doc.save(
      `Balance_${balance.local || "Local"}_${monthNames[(balance.month || 1) - 1]}_${balance.year || new Date().getFullYear()}.pdf`,
    )
  } catch (error) {
    console.error("Error al generar reporte de balance:", error)
    alert("Ocurrió un error al generar el reporte de balance. Por favor, intente nuevamente.")
  }
}

// Función para generar reporte de pedido Brozziano en PDF
export const generateOrderReport = (order: Order) => {
  try {
    if (!order) {
      console.error("Error: order es undefined o null")
      throw new Error("Datos de pedido inválidos para generar reporte")
    }

    const doc = new jsPDF()

    // Encabezado
    doc.setFontSize(18)
    doc.text("PEDIDO BROZZIANO", 105, 20, { align: "center" })

    // Información general
    doc.setFontSize(12)
    doc.text(`Número de Pedido: ${order.id || "No especificado"}`, 14, 30)
    doc.text(`Fecha: ${formatDate(order.date || order.createdAt) || "No especificada"}`, 14, 35)
    doc.text(`Local: ${order.localName || order.local || "No especificado"}`, 14, 40)
    doc.text(`Estado: ${order.status || "Pendiente"}`, 14, 45)

    // Información del cliente
    if (order.clientName) {
      doc.text(`Cliente: ${order.clientName}`, 14, 50)
    }

    if (order.clientPhone) {
      doc.text(`Teléfono: ${order.clientPhone}`, 14, 55)
    }

    if (order.clientAddress) {
      doc.text(`Dirección: ${order.clientAddress}`, 14, 60)
    }

    let yPos = 65

    // Tabla de productos
    if (order.items && Array.isArray(order.items) && order.clientAddress) {
      doc.text(`Dirección: ${order.clientAddress}`, 14, 60)
    }

    //let yPos = 65 // Remove redeclaration

    // Tabla de productos
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      doc.setFontSize(14)
      doc.text("PRODUCTOS", 14, yPos)
      yPos += 5
      doc.line(14, yPos, 196, yPos)
      yPos += 5

      const itemsData = order.items.map((item: any) => {
        if (!item) return ["Item no disponible", 0, formatCurrency(0), formatCurrency(0)]

        const name = item.name || item.productName || "Producto sin nombre"
        const quantity = item.quantity || 0
        const price = item.price || 0

        return [name, quantity, formatCurrency(price), formatCurrency(quantity * price)]
      })

      doc.autoTable({
        startY: yPos,
        head: [["Producto", "Cantidad", "Precio", "Subtotal"]],
        body: itemsData,
        theme: "grid",
        headStyles: {
          fillColor: [40, 40, 40],
          textColor: 255,
          fontStyle: "bold",
        },
      })

      yPos = (doc as any).lastAutoTable.finalY + 10

      // Total
      let total = order.total || 0
      if (!total && order.items && Array.isArray(order.items)) {
        total = order.items.reduce((sum: number, item: any) => {
          if (!item) return sum
          return sum + (item.quantity || 0) * (item.price || 0)
        }, 0)
      }

      doc.setFontSize(14)
      doc.text(`TOTAL: ${formatCurrency(total)}`, 150, yPos, { align: "right" })
      yPos += 15
    } else {
      doc.setFontSize(12)
      doc.text("No hay productos en este pedido", 14, yPos)
      yPos += 10
    }

    // Observaciones
    if (order.notes || order.observations) {
      const notes = order.notes || order.observations

      doc.setFontSize(14)
      doc.text("OBSERVACIONES", 14, yPos)
      yPos += 5
      doc.line(14, yPos, 196, yPos)
      yPos += 10

      doc.setFontSize(12)
      const splitText = doc.splitTextToSize(notes, 180)
      doc.text(splitText, 14, yPos)
    }

    // Guardar PDF
    const orderId = order.id || "sin-id"
    const orderDate = formatDate(order.date || order.createdAt || "").replace(/\//g, "-") || "sin-fecha"
    doc.save(`Pedido_${orderId}_${orderDate}.pdf`)
  } catch (error) {
    console.error("Error al generar reporte de pedido:", error)
    alert("Ocurrió un error al generar el reporte de pedido. Por favor, intente nuevamente.")
  }
}









