"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Sidebar from "@/components/sidebar"
import InvoicePreviewFull from "@/components/invoice-preview-full"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getInvoiceById, saveInvoice } from "@/lib/db"
import { CURRENCY_SYMBOLS, type Invoice, type PaymentStatus } from "@/lib/types"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function InvoiceDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setMounted(true)
    const load = async () => {
      const inv = await getInvoiceById(id)
      if (inv) {
        setInvoice({ ...inv, amountPaid: inv.amountPaid ?? 0 })
      }
    }
    load()
  }, [id])

  const handleUpdatePaymentStatus = async (status: PaymentStatus) => {
    if (!invoice) return
    const updated = { ...invoice, paymentStatus: status, updatedAt: new Date().toISOString() }
    await saveInvoice(updated)
    setInvoice(updated)
    toast({ title: "Updated", description: "Payment status updated." })
  }

  const handleUpdateAmountPaid = async (amount: number) => {
    if (!invoice) return
    const total = calculateTotal(invoice)
    let status: PaymentStatus = "pending"
    if (amount >= total) {
      status = "paid"
    } else if (amount > 0) {
      status = "partial"
    }
    const updated = {
      ...invoice,
      amountPaid: amount,
      paymentStatus: status,
      updatedAt: new Date().toISOString(),
    }
    await saveInvoice(updated)
    setInvoice(updated)
    toast({ title: "Updated", description: "Amount paid updated." })
  }

  const handleMarkAsPaid = async () => {
    if (!invoice) return
    const total = calculateTotal(invoice)
    const updated = {
      ...invoice,
      paymentStatus: "paid" as PaymentStatus,
      amountPaid: total,
      updatedAt: new Date().toISOString(),
    }
    await saveInvoice(updated)
    setInvoice(updated)
    toast({ title: "Updated", description: "Invoice marked as paid." })
  }

  const calculateTotal = (inv: Invoice) => {
    const items = inv.items || []
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const tax = inv.taxEnabled ? subtotal * (inv.taxRate / 100) : 0
    const discount = inv.discountAmount || 0
    return subtotal + tax - discount
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:ml-64 p-4 lg:p-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Invoice not found.</p>
            <Link href="/invoices">
              <Button>Back to Invoices</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const total = calculateTotal(invoice)
  const symbol = CURRENCY_SYMBOLS[invoice.currency] || "$"
  const amountPaid = invoice.amountPaid ?? 0
  const remaining = total - amountPaid

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-64 p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-12 lg:pt-0">
          <div className="flex items-center gap-4">
            <Link href="/invoices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">{invoice.invoiceNumber}</h1>
              <p className="text-muted-foreground">{invoice.clientName}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Tracking */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Payment Status</Label>
                  <Select
                    value={invoice.paymentStatus}
                    onValueChange={(v: PaymentStatus) => handleUpdatePaymentStatus(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount Paid ({symbol})</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountPaid}
                    onChange={(e) => handleUpdateAmountPaid(Number(e.target.value))}
                  />
                </div>
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Amount</span>
                    <span className="font-semibold">
                      {symbol}
                      {total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Amount Paid</span>
                    <span className="font-semibold text-success">
                      {symbol}
                      {amountPaid.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Remaining</span>
                    <span className={remaining > 0 ? "text-warning" : "text-success"}>
                      {symbol}
                      {remaining.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {invoice.paymentStatus !== "paid" && (
                  <Button onClick={handleMarkAsPaid} className="w-full gap-2" variant="default">
                    <CheckCircle className="h-4 w-4" /> Mark as Paid
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project No</span>
                  <span>{invoice.projectNumber}</span>
                </div>
                {invoice.poNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PO Number</span>
                    <span>{invoice.poNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{new Date(invoice.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span>{invoice.currency}</span>
                </div>
                {invoice.isRecurring && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recurring</span>
                    <span className="capitalize">{invoice.recurringInterval}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoice Preview */}
          <div className="lg:col-span-2">
            <InvoicePreviewFull invoice={invoice} />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
