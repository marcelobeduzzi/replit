import { objectToCamelCase } from "../utils"
import { DatabaseServiceBase } from "./db-core"

// Clase para gestionar las auditorías
export class AuditService extends DatabaseServiceBase {
  // Audit methods
  async getAudits(startDate?: Date, endDate?: Date) {
    try {
      let query = this.supabase.from("audits").select("*").order("date", { ascending: false })

      if (startDate) {
        query = query.gte("date", startDate.toISOString())
      }

      if (endDate) {
        query = query.lte("date", endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      // Convertir de snake_case a camelCase y asegurar que localName esté disponible
      return (data || []).map((item) => {
        const audit = objectToCamelCase(item)

        // Si no hay localName pero hay local_name, usar ese valor
        if (!audit.localName && item.local_name) {
          audit.localName = item.local_name
        }

        // Si no hay auditorName pero hay auditor_name, usar ese valor
        if (!audit.auditorName && item.auditor_name) {
          audit.auditorName = item.auditor_name
        }

        console.log("Audit después de procesamiento:", audit)
        return audit
      })
    } catch (error) {
      console.error("Error en getAudits:", error)
      return []
    }
  }

  async createAudit(auditData: any): Promise<any> {
    try {
      console.log("Datos recibidos en createAudit:", auditData)

      // Asegurarse de que categories sea un array
      if (!auditData.categories || !Array.isArray(auditData.categories)) {
        console.error("Error: categories no es un array o está vacío")
        throw new Error("Las categorías de la auditoría deben ser un array")
      }

      // Mapear los campos para que coincidan con lo que espera la base de datos
      // Usar auditor_name como nombre de la columna y notes en lugar de general_observations
      const dataToSave = {
        local_id: auditData.localId || "",
        local_name: auditData.localName || "",
        auditor_name: auditData.auditor || "", // Cambiado a auditor_name
        date: auditData.date ? new Date(auditData.date).toISOString() : new Date().toISOString(),
        notes: auditData.generalObservations || "", // Cambiado a notes que es el nombre correcto en la base de datos
        categories: auditData.categories,
        total_score: auditData.totalScore || 0,
        max_score: auditData.maxScore || 0,
        percentage: auditData.percentage || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("Datos de auditoría a insertar:", dataToSave)

      const { data, error } = await this.supabase.from("audits").insert([dataToSave]).select().single()

      if (error) {
        console.error("Error en createAudit:", error)
        throw error
      }

      console.log("Auditoría creada con éxito:", data)
      return objectToCamelCase(data)
    } catch (error) {
      console.error("Error en createAudit:", error)
      throw error
    }
  }

  /**
   * Obtiene una auditoría por su ID
   * @param id ID de la auditoría
   * @returns La auditoría encontrada o null si no existe
   */
  async getAuditById(id: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase.from("audits").select("*").eq("id", id).single()

      if (error) {
        console.error("Error en getAuditById:", error)
        throw error
      }

      // Convertir de snake_case a camelCase y asegurar que localName y auditorName estén disponibles
      const audit = objectToCamelCase(data)

      // Si no hay localName pero hay local_name, usar ese valor
      if (!audit.localName && data.local_name) {
        audit.localName = data.local_name
      }

      // Si no hay auditorName pero hay auditor_name, usar ese valor
      if (!audit.auditorName && data.auditor_name) {
        audit.auditorName = data.auditor_name
      }

      console.log("Audit por ID después de procesamiento:", audit)
      return audit
    } catch (error) {
      console.error("Error en getAuditById:", error)
      return null
    }
  }

  /**
   * Obtiene la configuración de auditorías
   * @param type Tipo de auditoría ('rapida' o 'completa')
   * @returns Configuración de categorías e ítems para auditorías
   */
  async getAuditConfig(type = "completa") {
    try {
      console.log(`Obteniendo configuración de auditorías tipo: ${type}`)
      const { data, error } = await this.supabase.from("audit_config").select("*").eq("type", type).single()

      if (error) {
        console.error(`Error al obtener configuración de auditorías tipo ${type}:`, error)

        // Si el error es porque no existe la tabla o no hay registros, devolver configuración por defecto
        if (error.code === "PGRST116" || error.code === "22P02") {
          console.log("No se encontró configuración, devolviendo valores por defecto")

          // Configuración por defecto según el tipo
          if (type === "rapida") {
            return {
              type: "rapida",
              categories: [
                {
                  id: "limpieza",
                  name: "Limpieza",
                  maxScore: 20,
                  items: [
                    {
                      id: "limpieza_pisos",
                      name: "Pisos limpios",
                      maxScore: 5,
                      description: "Los pisos están limpios y sin residuos",
                    },
                    {
                      id: "limpieza_mesas",
                      name: "Mesas y sillas",
                      maxScore: 5,
                      description: "Mesas y sillas limpias y en buen estado",
                    },
                    {
                      id: "limpieza_banos",
                      name: "Baños",
                      maxScore: 5,
                      description: "Baños limpios y con insumos completos",
                    },
                    {
                      id: "limpieza_cocina",
                      name: "Cocina",
                      maxScore: 5,
                      description: "Área de cocina limpia y ordenada",
                    },
                  ],
                },
                {
                  id: "presentacion",
                  name: "Presentación",
                  maxScore: 15,
                  items: [
                    {
                      id: "uniforme",
                      name: "Uniforme del personal",
                      maxScore: 5,
                      description: "Personal con uniforme completo y en buen estado",
                    },
                    {
                      id: "higiene_personal",
                      name: "Higiene personal",
                      maxScore: 5,
                      description: "Personal con buena higiene y presentación",
                    },
                    {
                      id: "presentacion_productos",
                      name: "Presentación de productos",
                      maxScore: 5,
                      description: "Productos bien presentados y etiquetados",
                    },
                  ],
                },
                {
                  id: "atencion",
                  name: "Atención al Cliente",
                  maxScore: 15,
                  items: [
                    {
                      id: "saludo",
                      name: "Saludo y bienvenida",
                      maxScore: 5,
                      description: "Se saluda correctamente a los clientes",
                    },
                    {
                      id: "tiempo_atencion",
                      name: "Tiempo de atención",
                      maxScore: 5,
                      description: "Tiempo de espera adecuado",
                    },
                    {
                      id: "resolucion_problemas",
                      name: "Resolución de problemas",
                      maxScore: 5,
                      description: "Se resuelven adecuadamente los problemas",
                    },
                  ],
                },
                {
                  id: "procesos",
                  name: "Procesos",
                  maxScore: 15,
                  items: [
                    {
                      id: "preparacion",
                      name: "Preparación de alimentos",
                      maxScore: 5,
                      description: "Se siguen los procedimientos de preparación",
                    },
                    {
                      id: "manejo_caja",
                      name: "Manejo de caja",
                      maxScore: 5,
                      description: "Procedimientos de caja correctos",
                    },
                    {
                      id: "control_stock",
                      name: "Control de stock",
                      maxScore: 5,
                      description: "Inventario actualizado y controlado",
                    },
                  ],
                },
                {
                  id: "seguridad",
                  name: "Seguridad",
                  maxScore: 15,
                  items: [
                    {
                      id: "extintores",
                      name: "Extintores",
                      maxScore: 5,
                      description: "Extintores en buen estado y accesibles",
                    },
                    {
                      id: "salidas_emergencia",
                      name: "Salidas de emergencia",
                      maxScore: 5,
                      description: "Salidas de emergencia señalizadas y despejadas",
                    },
                    {
                      id: "elementos_seguridad",
                      name: "Elementos de seguridad",
                      maxScore: 5,
                      description: "Elementos de seguridad en buen estado",
                    },
                  ],
                },
              ],
            }
          } else {
            return {
              type: "completa",
              categories: [
                {
                  id: "limpieza",
                  name: "Limpieza y Orden",
                  maxScore: 25,
                  items: [
                    { id: "limpieza_general", name: "Limpieza general del local", maxScore: 5 },
                    { id: "orden_cocina", name: "Orden en la cocina", maxScore: 5 },
                    { id: "limpieza_banos", name: "Limpieza de baños", maxScore: 5 },
                    { id: "manejo_residuos", name: "Manejo de residuos", maxScore: 5 },
                    { id: "orden_almacen", name: "Orden en almacén", maxScore: 5 },
                  ],
                },
                {
                  id: "seguridad_alimentaria",
                  name: "Seguridad Alimentaria",
                  maxScore: 25,
                  items: [
                    { id: "control_temperatura", name: "Control de temperatura de alimentos", maxScore: 5 },
                    { id: "almacenamiento", name: "Almacenamiento adecuado", maxScore: 5 },
                    { id: "fechas_vencimiento", name: "Control de fechas de vencimiento", maxScore: 5 },
                    { id: "manipulacion", name: "Manipulación de alimentos", maxScore: 5 },
                    { id: "contaminacion_cruzada", name: "Prevención de contaminación cruzada", maxScore: 5 },
                  ],
                },
                {
                  id: "atencion_cliente",
                  name: "Atención al Cliente",
                  maxScore: 20,
                  items: [
                    { id: "presentacion_personal", name: "Presentación del personal", maxScore: 5 },
                    { id: "amabilidad", name: "Amabilidad y cortesía", maxScore: 5 },
                    { id: "rapidez", name: "Rapidez en el servicio", maxScore: 5 },
                    { id: "conocimiento_menu", name: "Conocimiento del menú", maxScore: 5 },
                  ],
                },
                {
                  id: "calidad_producto",
                  name: "Calidad del Producto",
                  maxScore: 20,
                  items: [
                    { id: "presentacion_platos", name: "Presentación de platos", maxScore: 5 },
                    { id: "sabor", name: "Sabor y temperatura adecuados", maxScore: 5 },
                    { id: "consistencia", name: "Consistencia en la calidad", maxScore: 5 },
                    { id: "frescura", name: "Frescura de ingredientes", maxScore: 5 },
                  ],
                },
                {
                  id: "procesos_operativos",
                  name: "Procesos Operativos",
                  maxScore: 10,
                  items: [
                    { id: "seguimiento_recetas", name: "Seguimiento de recetas estándar", maxScore: 5 },
                    { id: "eficiencia", name: "Eficiencia en procesos", maxScore: 5 },
                  ],
                },
              ],
            }
          }
        }

        throw error
      }

      console.log(`Configuración de auditoría ${type} obtenida:`, data)
      return data
    } catch (error) {
      console.error(`Error en getAuditConfig para tipo ${type}:`, error)
      throw error
    }
  }

  /**
   * Guarda la configuración de auditorías
   * @param config Configuración de categorías e ítems para auditorías
   * @returns Resultado de la operación
   */
  async saveAuditConfig(config: any) {
    try {
      const type = config.type || "completa"

      // Verificar si ya existe una configuración para este tipo
      const { data: existingConfig, error: checkError } = await this.supabase
        .from("audit_config")
        .select("id")
        .eq("type", type)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error(`Error al verificar configuración existente para tipo ${type}:`, checkError)
        throw checkError
      }

      if (existingConfig) {
        // Actualizar configuración existente
        console.log(`Actualizando configuración existente para tipo ${type}:`, existingConfig.id)
        const { data, error } = await this.supabase
          .from("audit_config")
          .update(config)
          .eq("id", existingConfig.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Crear nueva configuración
        console.log(`Creando nueva configuración para tipo ${type}`)
        const { data, error } = await this.supabase.from("audit_config").insert([config]).select().single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error("Error en saveAuditConfig:", error)
      throw error
    }
  }
}

// Crear una instancia del servicio
export const auditService = new AuditService()
