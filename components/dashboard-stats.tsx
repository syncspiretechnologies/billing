"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CURRENCY_SYMBOLS, type Invoice, type Currency } from "@/lib/types"
import { FileText, DollarSign, Clock, CheckCircle } from "lucide-react"

interface DashboardStatsProps {
  invoices: Invoice[]
  currency: Currency
}

export default function DashboardStats({ invoices, currency }: DashboardStatsProps) {
  const symbol = CURRENCY_SYMBOLS[currency]

  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter((inv) => inv.paymentStatus === "paid").length
  const pendingInvoices = invoices.filter((inv) => inv.paymentStatus === "pending").length
  const overdueInvoices = invoices.filter((inv) => inv.paymentStatus === "overdue").length

  const calculateTotal = (inv: Invoice) => {
    const items = inv.items || []
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const tax = inv.taxEnabled ? subtotal * (inv.taxRate / 100) : 0
    // Discount is already calculated based on total with tax in invoice-form
    return subtotal + tax - (inv.discountAmount || 0)
  }

  const totalRevenue = invoices
    .filter((inv) => inv.paymentStatus === "paid")
    .reduce((sum, inv) => sum + calculateTotal(inv), 0)

  const pendingAmount = invoices
    .filter((inv) => inv.paymentStatus === "pending" || inv.paymentStatus === "partial")
    .reduce((sum, inv) => sum + (calculateTotal(inv) - (inv.amountPaid || 0)), 0)

  const stats = [
    {
      title: "Total Invoices",
      value: totalInvoices,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Revenue",
      value: `${symbol}${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Pending Amount",
      value: `${symbol}${pendingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      title: "Paid Invoices",
      value: `${paidInvoices}/${totalInvoices}`,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
