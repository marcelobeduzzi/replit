import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const testData = {
  employee: {
    firstName: "John",
    lastName: "Doe",
    documentId: "12345678",
    documentType: "DNI",
    phone: "+1234567890",
    email: "john.doe@example.com",
    address: "123 Main St",
    birthDate: "1990-01-01",
    hireDate: "2024-01-01",
    position: "Cashier",
    local: "BR Cabildo",
    workShift: "morning",
    baseSalary: 2000,
    bankSalary: 1800,
    totalSalary: 3800,
    status: "active",
    role: "cashier",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  attendance: {
    employeeId: "", // Will be set after employee is created
    date: new Date().toISOString(),
    checkIn: "08:00",
    checkOut: "17:00",
    expectedCheckIn: "08:00",
    expectedCheckOut: "17:00",
    lateMinutes: 0,
    earlyDepartureMinutes: 0,
    isHoliday: false,
    isAbsent: false,
    isJustified: false,
    notes: "Regular attendance",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  payroll: {
    employeeId: "", // Will be set after employee is created
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    baseSalary: 2000,
    bankSalary: 1800,
    deductions: 200,
    additions: 100,
    finalHandSalary: 1900,
    totalSalary: 3700,
    isPaidHand: true,
    isPaidBank: true,
    handPaymentDate: new Date().toISOString(),
    bankPaymentDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  payrollDetail: {
    payrollId: "", // Will be set after payroll is created
    type: "deduction",
    concept: "Health Insurance",
    amount: 100,
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  deliveryStats: {
    platform: "PedidosYa",
    week: Math.floor(new Date().getDate() / 7) + 1,
    year: new Date().getFullYear(),
    orderCount: 150,
    revenue: 3000,
    complaints: 2,
    rating: 4.5,
    local: "BR Cabildo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  audit: {
    date: new Date().toISOString(),
    type: "Regular",
    status: "Completed",
    notes: "Monthly audit",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  auditItem: {
    auditId: "", // Will be set after audit is created
    category: "Cleanliness",
    name: "Kitchen Area",
    value: 8,
    completed: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  billing: {
    date: new Date().toISOString(),
    amount: 5000,
    type: "Income",
    status: "Paid",
    notes: "Monthly billing",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  balance: {
    date: new Date().toISOString(),
    counterSales: 10000,
    deliverySales: 5000,
    totalIncome: 15000,
    payrollExpenses: 5000,
    rentExpenses: 2000,
    maintenanceExpenses: 500,
    suppliesExpenses: 1000,
    repairsExpenses: 300,
    otherExpenses: 200,
    totalExpenses: 9000,
    netProfit: 6000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}

export async function POST() {
  try {
    console.log("Starting to seed all tables...")

    // 1. Create Employee
    console.log("Creating employee...")
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .insert({
        first_name: testData.employee.firstName,
        last_name: testData.employee.lastName,
        document_id: testData.employee.documentId,
        document_type: testData.employee.documentType,
        phone: testData.employee.phone,
        email: testData.employee.email,
        address: testData.employee.address,
        birth_date: testData.employee.birthDate,
        hire_date: testData.employee.hireDate,
        position: testData.employee.position,
        local: testData.employee.local,
        work_shift: testData.employee.workShift,
        base_salary: testData.employee.baseSalary,
        bank_salary: testData.employee.bankSalary,
        total_salary: testData.employee.totalSalary,
        status: testData.employee.status,
        role: testData.employee.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (employeeError) {
      console.error("Error creating employee:", employeeError)
      return NextResponse.json(
        {
          success: false,
          error: employeeError.message,
        },
        { status: 500 },
      )
    }

    // 2. Create Attendance
    console.log("Creating attendance...")
    const attendanceData = {
      employee_id: employee.id,
      date: new Date().toISOString(),
      check_in: testData.attendance.checkIn,
      check_out: testData.attendance.checkOut,
      expected_check_in: testData.attendance.expectedCheckIn,
      expected_check_out: testData.attendance.expectedCheckOut,
      late_minutes: testData.attendance.lateMinutes,
      early_departure_minutes: testData.attendance.earlyDepartureMinutes,
      is_holiday: testData.attendance.isHoliday,
      is_absent: testData.attendance.isAbsent,
      is_justified: testData.attendance.isJustified,
      justification_document: null,
      notes: testData.attendance.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { error: attendanceError } = await supabase.from("attendance").insert(attendanceData)

    if (attendanceError) {
      console.error("Error creating attendance:", attendanceError)
      return NextResponse.json(
        {
          success: false,
          error: attendanceError.message,
        },
        { status: 500 },
      )
    }

    // 3. Create Payroll
    console.log("Creating payroll...")
    const payrollData = {
      employee_id: employee.id,
      month: testData.payroll.month,
      year: testData.payroll.year,
      base_salary: testData.payroll.baseSalary,
      bank_salary: testData.payroll.bankSalary,
      deductions: testData.payroll.deductions,
      additions: testData.payroll.additions,
      final_hand_salary: testData.payroll.finalHandSalary,
      total_salary: testData.payroll.totalSalary,
      is_paid_hand: testData.payroll.isPaidHand,
      is_paid_bank: testData.payroll.isPaidBank,
      hand_payment_date: testData.payroll.handPaymentDate,
      bank_payment_date: testData.payroll.bankPaymentDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data: payroll, error: payrollError } = await supabase.from("payroll").insert(payrollData).select().single()

    if (payrollError) {
      console.error("Error creating payroll:", payrollError)
      return NextResponse.json(
        {
          success: false,
          error: payrollError.message,
        },
        { status: 500 },
      )
    }

    // 4. Create PayrollDetail
    console.log("Creating payroll detail...")
    const payrollDetailData = {
      payroll_id: payroll.id,
      type: "deduction",
      concept: "Health Insurance",
      amount: 100,
      date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { error: payrollDetailError } = await supabase.from("payroll_details").insert(payrollDetailData)

    if (payrollDetailError) {
      console.error("Error creating payroll detail:", payrollDetailError)
      return NextResponse.json(
        {
          success: false,
          error: payrollDetailError.message,
        },
        { status: 500 },
      )
    }

    // 5. Create DeliveryStats
    console.log("Creating delivery stats...")
    const deliveryStatsData = {
      ...testData.deliveryStats,
      order_count: testData.deliveryStats.orderCount,
      created_at: testData.deliveryStats.createdAt,
      updated_at: testData.deliveryStats.updatedAt,
    }
    const { error: deliveryStatsError } = await supabase.from("delivery_stats").insert(deliveryStatsData)

    if (deliveryStatsError) {
      console.error("Error creating delivery stats:", deliveryStatsError)
      return NextResponse.json(
        {
          success: false,
          error: deliveryStatsError.message,
        },
        { status: 500 },
      )
    }

    // 6. Get supervisor and manager IDs
    console.log("Getting supervisor and manager IDs...")
    const { data: supervisor } = await supabase.from("users").select("id").eq("role", "supervisor").single()

    const { data: manager } = await supabase.from("users").select("id").eq("role", "manager").single()

    if (!supervisor || !manager) {
      return NextResponse.json(
        {
          success: false,
          error: "Supervisor or manager user not found. Please ensure test users are created first.",
        },
        { status: 500 },
      )
    }

    // 7. Create Audit
    console.log("Creating audit...")
    const auditData = {
      ...testData.audit,
      created_at: testData.audit.createdAt,
      updated_at: testData.audit.updatedAt,
    }
    const { data: audit, error: auditError } = await supabase.from("audits").insert(auditData).select().single()

    if (auditError) {
      console.error("Error creating audit:", auditError)
      return NextResponse.json(
        {
          success: false,
          error: auditError.message,
        },
        { status: 500 },
      )
    }

    // 8. Create AuditItem
    console.log("Creating audit item...")
    const auditItemData = {
      ...testData.auditItem,
      audit_id: audit.id,
      created_at: testData.auditItem.createdAt,
      updated_at: testData.auditItem.updatedAt,
    }
    const { error: auditItemError } = await supabase.from("audit_items").insert(auditItemData)

    if (auditItemError) {
      console.error("Error creating audit item:", auditItemError)
      return NextResponse.json(
        {
          success: false,
          error: auditItemError.message,
        },
        { status: 500 },
      )
    }

    // 9. Create Billing
    console.log("Creating billing...")
    const billingData = {
      ...testData.billing,
      created_at: testData.billing.createdAt,
      updated_at: testData.billing.updatedAt,
    }
    const { error: billingError } = await supabase.from("billing").insert(billingData)

    if (billingError) {
      console.error("Error creating billing:", billingError)
      return NextResponse.json(
        {
          success: false,
          error: billingError.message,
        },
        { status: 500 },
      )
    }

    // 10. Create Balance
    console.log("Creating balance...")
    const balanceData = {
      ...testData.balance,
      counter_sales: testData.balance.counterSales,
      delivery_sales: testData.balance.deliverySales,
      total_income: testData.balance.totalIncome,
      payroll_expenses: testData.balance.payrollExpenses,
      rent_expenses: testData.balance.rentExpenses,
      maintenance_expenses: testData.balance.maintenanceExpenses,
      supplies_expenses: testData.balance.suppliesExpenses,
      repairs_expenses: testData.balance.repairsExpenses,
      other_expenses: testData.balance.otherExpenses,
      total_expenses: testData.balance.totalExpenses,
      net_profit: testData.balance.netProfit,
      created_at: testData.balance.createdAt,
      updated_at: testData.balance.updatedAt,
    }
    const { error: balanceError } = await supabase.from("balance").insert(balanceData)

    if (balanceError) {
      console.error("Error creating balance:", balanceError)
      return NextResponse.json(
        {
          success: false,
          error: balanceError.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Test data inserted successfully for all tables",
    })
  } catch (err) {
    console.error("Unexpected error:", err)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to insert test data",
        details: err instanceof Error ? err.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

