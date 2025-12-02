"use client"

import type { Invoice, Customer, CompanySettings, Coupon } from "./types"
import { COMPANY_INFO } from "./types"

const INVOICES_KEY = "syncspire_invoices"
const CUSTOMERS_KEY = "syncspire_customers"
const SETTINGS_KEY = "syncspire_settings"
const COUPONS_KEY = "syncspire_coupons"

// Invoice Storage
export function getInvoices(): Invoice[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(INVOICES_KEY)
  return data ? JSON.parse(data) : []
}

export function getInvoicesSync(): Invoice[] {
  return getInvoices()
}

export function saveInvoice(invoice: Invoice): void {
  const invoices = getInvoices()
  const existingIndex = invoices.findIndex((inv) => inv.id === invoice.id)
  if (existingIndex >= 0) {
    invoices[existingIndex] = invoice
  } else {
    invoices.unshift(invoice)
  }
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices))
}

export function deleteInvoice(id: string): void {
  const invoices = getInvoices().filter((inv) => inv.id !== id)
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices))
}

export function getInvoiceById(id: string): Invoice | undefined {
  return getInvoices().find((inv) => inv.id === id)
}

// Customer Storage
export function getCustomers(): Customer[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(CUSTOMERS_KEY)
  return data ? JSON.parse(data) : []
}

export function getCustomersSync(): Customer[] {
  return getCustomers()
}

export function saveCustomer(customer: Customer): void {
  const customers = getCustomers()
  const existingIndex = customers.findIndex((c) => c.id === customer.id)
  if (existingIndex >= 0) {
    customers[existingIndex] = customer
  } else {
    customers.unshift(customer)
  }
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers))
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers().filter((c) => c.id !== id)
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers))
}

export function getCustomerById(id: string): Customer | undefined {
  return getCustomers().find((c) => c.id === id)
}

// Settings Storage
export function getSettings(): CompanySettings {
  if (typeof window === "undefined") return COMPANY_INFO
  const data = localStorage.getItem(SETTINGS_KEY)
  return data ? JSON.parse(data) : COMPANY_INFO
}

export function getSettingsSync(): CompanySettings {
  return getSettings()
}

export function saveSettings(settings: CompanySettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// Generate Next Invoice Number
export function generateInvoiceNumber(): string {
  const settings = getSettingsSync()
  const number = settings.nextInvoiceNumber.toString().padStart(4, "0")
  return `${settings.invoicePrefix}-${number}`
}

export function incrementInvoiceNumber(): void {
  const settings = getSettingsSync()
  settings.nextInvoiceNumber += 1
  saveSettings(settings)
}

// Generate Next Project Number
export function generateProjectNumber(): string {
  const settings = getSettingsSync()
  const number = settings.nextProjectNumber.toString().padStart(4, "0")
  return `${settings.projectPrefix}-${number}`
}

export function incrementProjectNumber(): void {
  const settings = getSettingsSync()
  settings.nextProjectNumber += 1
  saveSettings(settings)
}

// Coupon Storage
export function getCoupons(): Coupon[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(COUPONS_KEY)
  return data ? JSON.parse(data) : []
}

export function getCouponsSync(): Coupon[] {
  return getCoupons()
}

export function saveCoupon(coupon: Coupon): void {
  const coupons = getCoupons()
  const existingIndex = coupons.findIndex((c) => c.id === coupon.id)
  if (existingIndex >= 0) {
    coupons[existingIndex] = coupon
  } else {
    coupons.unshift(coupon)
  }
  localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons))
}

export function deleteCoupon(id: string): void {
  const coupons = getCoupons().filter((c) => c.id !== id)
  localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons))
}

export function getCouponByCode(code: string): Coupon | undefined {
  return getCoupons().find((c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive)
}

export function redeemCoupon(code: string): {
  success: boolean
  discount: number
  discountType: "percentage" | "fixed"
  coupon?: Coupon
} {
  const coupon = getCouponByCode(code)
  if (!coupon) {
    return { success: false, discount: 0, discountType: "fixed" }
  }

  // Update usage count
  coupon.usageCount += 1

  // Delete the used coupon
  deleteCoupon(coupon.id)

  // Create a new coupon with same discount value
  const newCoupon: Coupon = {
    id: Date.now().toString(),
    code: `${coupon.code.replace(/-\d+$/, "")}-${Date.now().toString().slice(-4)}`,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    description: coupon.description,
    isActive: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
  }
  saveCoupon(newCoupon)

  return {
    success: true,
    discount: coupon.discountValue,
    discountType: coupon.discountType,
    coupon: coupon,
  }
}
