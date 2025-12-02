export type Currency = "USD" | "EUR" | "INR" | "GBP"

export type PaymentStatus = "pending" | "paid" | "overdue" | "partial"

export type ItemType = "product" | "service" | "hourly" | "miscellaneous"

export type DiscountType = "percentage" | "fixed"

export interface Coupon {
  id: string
  code: string
  discountType: DiscountType
  discountValue: number
  description?: string
  isActive: boolean
  usageCount: number
  createdAt: string
}

export interface InvoiceItem {
  id: string
  description: string
  type: ItemType
  quantity: number
  unitPrice: number
  extraHours?: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  company?: string
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  projectNumber: string
  date: string
  dueDate: string
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  items: InvoiceItem[]
  currency: Currency
  taxEnabled: boolean
  taxRate: number
  discountCode?: string
  discountAmount: number
  notes: string
  poNumber: string
  bankDetails: string
  paymentStatus: PaymentStatus
  amountPaid: number
  isRecurring: boolean
  recurringInterval?: "monthly" | "quarterly" | "yearly"
  signature?: string
  attachments?: string[] // Array of base64 strings or URLs
  createdAt: string
  updatedAt: string
}

export interface CompanySettings {
  taxId: any
  name: string
  email: string
  phone: string
  address: string
  logo: string
  bankDetails: string
  upiId?: string
  signature?: string
  defaultCurrency: Currency
  defaultTaxRate: number
  invoicePrefix: string
  nextInvoiceNumber: number
  projectPrefix: string
  nextProjectNumber: number
}

export const COMPANY_INFO: CompanySettings = {
  name: "SyncSpire Technologies",
  email: "syncspiretechnologies@gmail.com",
  phone: "8089921762",
  address: "",
  logo: "/syncspire-logo.png",
  bankDetails: "",
  defaultCurrency: "USD",
  defaultTaxRate: 18,
  invoicePrefix: "INV",
  nextInvoiceNumber: 1,
  projectPrefix: "PRJ",
  nextProjectNumber: 1,
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  INR: "₹",
  GBP: "£",
}
