"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getInvoices } from "@/lib/db"
import { CURRENCY_SYMBOLS, type Invoice, type PaymentStatus } from "@/lib/types"
import { Calendar, TrendingUp, TrendingDown, DollarSign, Eye } from "lucide-react"
import Link from "next/link"

const statusColors: Record<PaymentStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  paid: "bg-success/10 text-success border-success/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  partial: "bg-primary/10 text-primary border-primary/20",
}

export default function HistoryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [mounted, setMounted] = useState(false)
  const [timeFilter, setTimeFilter] = useState("all")

  useEffect(() => {
    setMounted(true)
    const loadInvoices = async () => {
      const data = await getInvoices()
      setInvoices(data)
    }
    loadInvoices()
  }, [])

  const calculateTotal = (inv: Invoice) => {
    const subtotal = inv.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const tax = inv.taxEnabled ? subtotal * (inv.taxRate / 100) : 0
    // Discount is already calculated based on total with tax in invoice-form
    return subtotal + tax - (inv.discountAmount || 0)
  }

  const filterByTime = (invoices: Invoice[]) => {
    const now = new Date()
    return invoices.filter((inv) => {
      const invDate = new Date(inv.date)
      switch (timeFilter) {
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return invDate >= weekAgo
        case "month":
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          return invDate >= monthAgo
        case "quarter":
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          return invDate >= quarterAgo
        case "year":
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          return invDate >= yearAgo
        default:
          return true
      }
    })
  }

  const filteredInvoices = filterByTime(invoices)

  // Group invoices by month
  const groupedByMonth = filteredInvoices.reduce(
    (acc, inv) => {
      const date = new Date(inv.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(inv)
      return acc
    },
    {} as Record<string, Invoice[]>,
  )

  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a))

  // Calculate stats
  const totalRevenue = filteredInvoices
    .filter((inv) => inv.paymentStatus === "paid")
    .reduce((sum, inv) => sum + calculateTotal(inv), 0)

  const totalPending = filteredInvoices
    .filter((inv) => inv.paymentStatus === "pending" || inv.paymentStatus === "partial")
    .reduce((sum, inv) => sum + (calculateTotal(inv) - inv.amountPaid), 0)

  const paidCount = filteredInvoices.filter((inv) => inv.paymentStatus === "paid").length
  const pendingCount = filteredInvoices.filter((inv) => inv.paymentStatus === "pending").length

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-64 p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Invoice History</h1>
            <p className="text-muted-foreground">Track your billing history and revenue</p>
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-success">${totalRevenue.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold text-warning">${totalPending.toFixed(2)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-warning/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Invoices</p>
                  <p className="text-2xl font-bold">{paidCount}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Invoices</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grouped History */}
        {sortedMonths.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No invoice history found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedMonths.map((monthKey) => {
              const [year, month] = monthKey.split("-")
              const monthName = new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })
              const monthInvoices = groupedByMonth[monthKey]
              const monthTotal = monthInvoices.reduce((sum, inv) => sum + calculateTotal(inv), 0)

              return (
                <Card key={monthKey}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{monthName}</CardTitle>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {monthInvoices.length} invoice{monthInvoices.length !== 1 ? "s" : ""}
                        </p>
                        <p className="font-bold">${monthTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {monthInvoices.map((inv) => {
                        const total = calculateTotal(inv)
                        const symbol = CURRENCY_SYMBOLS[inv.currency]
                        return (
                          <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className={statusColors[inv.paymentStatus]}>
                                {inv.paymentStatus}
                              </Badge>
                              <div>
                                <p className="font-medium">{inv.invoiceNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {inv.clientName} • {new Date(inv.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-bold">
                                {symbol}
                                {total.toFixed(2)}
                              </p>
                              <Link href={`/invoices/${inv.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
