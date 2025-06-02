# Lógica y circuito de la sección Nómina

## 1. Alta de empleado
- El administrativo da de alta un empleado.
- Se cargan:
  - Sueldo en mano (`handSalary`)
  - Sueldo en banco (`bankSalary`)
  - Sueldo total (`baseSalary`), calculado automáticamente como la suma de los anteriores.

## 2. Generación de nóminas
- El día 1 de cada mes a las 00:00 se genera automáticamente la nómina de todos los empleados activos.
- También puede generarse manualmente con un botón.
- Para cada empleado activo:
  - Se toma el `baseSalary` para calcular el valor del minuto.
  - Se consulta la tabla de asistencias (`attendance`) para ese mes:
    - Llegadas tarde, salidas anticipadas, faltas justificadas/injustificadas, horas extra, feriados trabajados.
  - Se calculan deducciones y adiciones en base a esos minutos.
  - El `handSalary` se ajusta con deducciones/adiciones y se obtiene el `finalHandSalary`.
  - El total a pagar = `bankSalary` + `finalHandSalary` + bono de presentismo (si corresponde).
  - Se guarda la nómina con todos estos datos.

## 3. Regeneración de nóminas
- El botón de regenerar nóminas recalcula y pisa las nóminas existentes para ese mes, útil si hubo cambios en sueldos, asistencias, etc.

## 4. Liquidaciones
- Cuando un empleado pasa a inactivo y se le pone fecha de egreso:
  - Se calculan los días trabajados del mes en curso.
  - Se calcula el pago proporcional de salario, aguinaldo y vacaciones si corresponde.
  - Se genera la liquidación final.

## 5. Pagos y confirmaciones
- El administrativo puede marcar cuándo se pagó en mano y/o en banco.
- Cuando ambos pagos están confirmados, la nómina desaparece de pendientes y pasa a historial.
- Desde el historial se puede exportar o imprimir el comprobante de pago.

---

**Este documento debe mantenerse actualizado ante cualquier cambio en la lógica de nómina.** 