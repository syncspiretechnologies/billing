"use client"

import { supabase } from "./supabase"
import type { Invoice, Customer, CompanySettings, Coupon } from "./types"
import { COMPANY_INFO } from "./types"

// Helper to map database rows to our types
const mapInvoice = (row: any): Invoice => ({
  ...row,
  items: row.items || [],
  attachments: row.attachments || [],
  taxEnabled: row.tax_enabled,
  taxRate: row.tax_rate,
  discountCode: row.discount_code,
  discountAmount: row.discount_amount,
  poNumber: row.po_number,
  bankDetails: row.bank_details,
  paymentStatus: row.payment_status,
  amountPaid: row.amount_paid,
  isRecurring: row.is_recurring,
  recurringInterval: row.recurring_interval,
  clientName: row.client_name,
  clientEmail: row.client_email,
  clientPhone: row.client_phone,
  clientAddress: row.client_address,
  invoiceNumber: row.invoice_number,
  projectNumber: row.project_number,
  dueDate: row.due_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const mapCustomer = (row: any): Customer => ({
  ...row,
  createdAt: row.created_at,
})

const mapSettings = (row: any): CompanySettings => ({
  ...row,
  taxId: row.tax_id,
  bankDetails: row.bank_details,
  upiId: row.upi_id,
  defaultCurrency: row.default_currency,
  defaultTaxRate: row.default_tax_rate,
  invoicePrefix: row.invoice_prefix,
  nextInvoiceNumber: row.next_invoice_number,
  projectPrefix: row.project_prefix || "PRJ",
  nextProjectNumber: row.next_project_number || 1,
})

// Invoice Storage
export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching invoices:", error)
    return []
  }

  console.log(`Fetched ${data.length} invoices from Supabase`)
  return data.map(mapInvoice)
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  // Convert to snake_case for DB
  const dbInvoice: any = {
    invoice_number: invoice.invoiceNumber,
    project_number: invoice.projectNumber,
    date: invoice.date || null,
    due_date: invoice.dueDate || null,
    client_name: invoice.clientName,
    client_email: invoice.clientEmail,
    client_phone: invoice.clientPhone,
    client_address: invoice.clientAddress,
    currency: invoice.currency,
    tax_enabled: invoice.taxEnabled,
    tax_rate: invoice.taxRate,
    discount_code: invoice.discountCode,
    discount_amount: invoice.discountAmount,
    notes: invoice.notes,
    po_number: invoice.poNumber,
    bank_details: invoice.bankDetails,
    payment_status: invoice.paymentStatus,
    amount_paid: invoice.amountPaid,
    is_recurring: invoice.isRecurring,
    recurring_interval: invoice.recurringInterval,
    signature: invoice.signature,
    items: invoice.items,
    attachments: invoice.attachments,
    updated_at: new Date().toISOString(),
  }

  // Only include ID if it exists and is not empty
  if (invoice.id) {
    dbInvoice.id = invoice.id
  }

  console.log("Saving invoice to DB:", JSON.stringify(dbInvoice, null, 2))

  const { error } = await supabase.from("invoices").upsert(dbInvoice)

  if (error) {
    console.error("Error saving invoice:", JSON.stringify(error, null, 2))
    console.error("Error details:", error.message, error.details, error.hint)
    throw error
  }
  console.log("Invoice saved successfully to Supabase")
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from("invoices").delete().eq("id", id)
  if (error) {
    console.error("Error deleting invoice:", error)
  } else {
    console.log(`Invoice ${id} deleted successfully from Supabase`)
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  const { data, error } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle()
  if (error) {
    console.error("Error fetching invoice by ID:", error)
    return undefined
  }
  if (!data) {
    console.log(`Invoice ${id} not found in Supabase`)
    return undefined
  }
  console.log(`Fetched invoice ${id} from Supabase`)
  return mapInvoice(data)
}

// Customer Storage
export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching customers:", JSON.stringify(error, null, 2))
    console.error("Error details:", error.message, error.details, error.hint)
    return []
  }

  console.log(`Fetched ${data.length} customers from Supabase`)
  return data.map(mapCustomer)
}

export async function saveCustomer(customer: Customer): Promise<void> {
  const dbCustomer: any = {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    company: customer.company,
    created_at: customer.createdAt,
  }

  if (customer.id) {
    dbCustomer.id = customer.id
  }

  const { error } = await supabase.from("customers").upsert(dbCustomer)

  if (error) {
    console.error("Error saving customer:", error)
    throw error
  }
  console.log("Customer saved successfully to Supabase")
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id)
  if (error) {
    console.error("Error deleting customer:", error)
  } else {
    console.log(`Customer ${id} deleted successfully from Supabase`)
  }
}

// Settings Storage
export async function getSettings(): Promise<CompanySettings> {
  const { data, error } = await supabase.from("settings").select("*").maybeSingle()
  
  if (error) {
    console.error("Error fetching settings:", error)
    return COMPANY_INFO
  }

  if (!data) {
    console.log("No settings found in Supabase, initializing defaults")
    // Initialize default settings if none exist
    const defaultSettings = {
      name: COMPANY_INFO.name,
      email: COMPANY_INFO.email,
      phone: COMPANY_INFO.phone,
      address: COMPANY_INFO.address,
      website: "",
      tax_id: "",
      logo: COMPANY_INFO.logo,
      bank_details: COMPANY_INFO.bankDetails,
      default_currency: COMPANY_INFO.defaultCurrency,
      default_tax_rate: COMPANY_INFO.defaultTaxRate,
      invoice_prefix: COMPANY_INFO.invoicePrefix,
      next_invoice_number: COMPANY_INFO.nextInvoiceNumber,
      project_prefix: COMPANY_INFO.projectPrefix,
      next_project_number: COMPANY_INFO.nextProjectNumber,
    }
    
    const { error: insertError } = await supabase.from("settings").insert(defaultSettings)
    if (insertError) {
      console.error("Error initializing settings:", insertError)
    } else {
      console.log("Default settings initialized in Supabase")
    }
    return COMPANY_INFO
  }

  console.log("Fetched settings from Supabase")
  return mapSettings(data)
}

export async function saveSettings(settings: CompanySettings): Promise<void> {
  const { data: existing } = await supabase.from("settings").select("id").maybeSingle()
  
  const dbSettings: any = {
    name: settings.name,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    tax_id: settings.taxId,
    logo: settings.logo,
    signature: settings.signature,
    bank_details: settings.bankDetails,
    upi_id: settings.upiId,
    default_currency: settings.defaultCurrency,
    default_tax_rate: settings.defaultTaxRate,
    invoice_prefix: settings.invoicePrefix,
    next_invoice_number: settings.nextInvoiceNumber,
    project_prefix: settings.projectPrefix || "PRJ",
    next_project_number: settings.nextProjectNumber || 1,
  }

  if (existing?.id) {
    dbSettings.id = existing.id
  }

  const { error } = await supabase.from("settings").upsert(dbSettings)
  if (error) {
    console.error("Error saving settings:", error)
  } else {
    console.log("Settings saved successfully to Supabase")
  }
}

// Generate Next Invoice Number
export async function generateInvoiceNumber(): Promise<string> {
  const settings = await getSettings()
  const number = settings.nextInvoiceNumber.toString().padStart(4, "0")
  return `${settings.invoicePrefix}-${number}`
}

export async function incrementInvoiceNumber(): Promise<void> {
  const settings = await getSettings()
  settings.nextInvoiceNumber += 1
  await saveSettings(settings)
}

export async function generateProjectNumber(): Promise<string> {
  const settings = await getSettings()
  const number = settings.nextProjectNumber.toString().padStart(4, "0")
  return `${settings.projectPrefix}-${number}`
}

export async function incrementProjectNumber(): Promise<void> {
  const settings = await getSettings()
  settings.nextProjectNumber += 1
  await saveSettings(settings)
}

// File Upload (for Bill Copy)
export async function uploadFile(file: File): Promise<string | null> {
  const fileName = `${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('bills')
    .upload(fileName, file)

  if (error) {
    console.error("Error uploading file:", error)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('bills')
    .getPublicUrl(fileName)

  return publicUrl
}

// Coupon Storage
const mapCoupon = (row: any): Coupon => ({
  ...row,
  discountType: row.discount_type,
  discountValue: row.discount_value,
  isActive: row.is_active,
  usageCount: row.usage_count,
  createdAt: row.created_at,
})

export async function getCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching coupons:", error)
    return []
  }

  return data.map(mapCoupon)
}

export async function saveCoupon(coupon: Coupon): Promise<void> {
  const dbCoupon: any = {
    code: coupon.code,
    discount_type: coupon.discountType,
    discount_value: coupon.discountValue,
    description: coupon.description,
    is_active: coupon.isActive,
    usage_count: coupon.usageCount,
    created_at: coupon.createdAt,
  }

  if (coupon.id) {
    dbCoupon.id = coupon.id
  }

  const { error } = await supabase.from("coupons").upsert(dbCoupon)

  if (error) {
    console.error("Error saving coupon:", error)
    throw error
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase.from("coupons").delete().eq("id", id)
  if (error) console.error("Error deleting coupon:", error)
}

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .maybeSingle()

  if (error || !data) return undefined
  return mapCoupon(data)
}

export async function redeemCoupon(code: string): Promise<void> {
  const coupon = await getCouponByCode(code)
  if (coupon) {
    await saveCoupon({
      ...coupon,
      usageCount: coupon.usageCount + 1
    })
  }
}
