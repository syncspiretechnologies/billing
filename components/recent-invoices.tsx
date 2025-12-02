"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CURRENCY_SYMBOLS, type Invoice } from "@/lib/types"
import { Eye, ArrowRight } from "lucide-react"
import Link from "next/link"

interface RecentInvoicesProps {
  invoices: Invoice[]
}

const statusColors = {
  pending: "bg-warning/10 text-warning border-warning/20",
  paid: "bg-success/10 text-success border-success/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  partial: "bg-primary/10 text-primary border-primary/20",
}

export default function RecentInvoices({ invoices }: RecentInvoicesProps) {
  const recentInvoices = invoices.slice(0, 5)

  const calculateTotal = (inv: Invoice) => {
    const items = inv.items || []
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const tax = inv.taxEnabled ? subtotal * (inv.taxRate / 100) : 0
    // Discount is already calculated based on total with tax in invoice-form
    return subtotal + tax - (inv.discountAmount || 0)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Invoices</CardTitle>
        <Link href="/invoices">
          <Button variant="ghost" size="sm" className="gap-2">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {recentInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No invoices yet. Create your first invoice!</p>
            <Link href="/invoices/new">
              <Button className="mt-4">Create Invoice</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentInvoices.map((invoice) => {
              const total = calculateTotal(invoice)
              const symbol = CURRENCY_SYMBOLS[invoice.currency]
              return (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{invoice.invoiceNumber}</p>
                      <Badge variant="outline" className={statusColors[invoice.paymentStatus]}>
                        {invoice.paymentStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {invoice.clientName} • {new Date(invoice.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-lg">
                      {symbol}
                      {total.toFixed(2)}
                    </p>
                    <Link href={`/invoices/${invoice.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
