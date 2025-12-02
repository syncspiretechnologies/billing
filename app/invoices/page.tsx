"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  getInvoices,
  deleteInvoice,
  saveInvoice,
  getSettings,
  generateInvoiceNumber as dbGenerateInvoiceNumber,
  generateProjectNumber as dbGenerateProjectNumber,
} from "@/lib/db"
import { generateUUID } from "@/lib/utils"
import { CURRENCY_SYMBOLS, type Invoice, type PaymentStatus, type CompanySettings } from "@/lib/types"
import { Plus, Search, Eye, Trash2, RefreshCw, Filter, X, Save, FileText } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import InvoiceForm from "@/components/invoice-form"
import InvoicePreviewFull from "@/components/invoice-preview-full"
import SignaturePad from "@/components/signature-pad"

const statusColors: Record<PaymentStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  paid: "bg-success/10 text-success border-success/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  partial: "bg-primary/10 text-primary border-primary/20",
}



export default function InvoicesPage() {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<CompanySettings | null>(null)

  const [showNewInvoice, setShowNewInvoice] = useState(false)
  const [newInvoice, setNewInvoice] = useState<Invoice | null>(null)
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form")

  useEffect(() => {
    setMounted(true)
    const loadData = async () => {
      setInvoices(await getInvoices())
      setSettings(await getSettings())
    }
    loadData()
  }, [])

  const handleNewInvoice = async () => {
    const invNum = await dbGenerateInvoiceNumber()
    const prjNum = await dbGenerateProjectNumber()

    const defaultInvoice: Invoice = {
      id: generateUUID(),
      invoiceNumber: invNum,
      projectNumber: prjNum,
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      items: [],
      currency: settings?.defaultCurrency || "USD",
      taxEnabled: (settings?.defaultTaxRate || 0) > 0,
      taxRate: settings?.defaultTaxRate || 0,
      discountCode: "",
      discountAmount: 0,
      notes: "",
      bankDetails: settings?.bankDetails || "",
      signature: settings?.signature || "",
      paymentStatus: "pending",
      isRecurring: false,
      poNumber: "",
      amountPaid: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setNewInvoice(defaultInvoice)
    setShowNewInvoice(true)
    setActiveTab("form")
  }

  const handleSaveInvoice = async () => {
    if (!newInvoice) return

    if (!newInvoice.clientName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a client name.",
        variant: "destructive",
      })
      return
    }

    if ((newInvoice.items || []).length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one item.",
        variant: "destructive",
      })
      return
    }

    await saveInvoice(newInvoice)
    setInvoices(await getInvoices())
    setShowNewInvoice(false)
    setNewInvoice(null)
    toast({
      title: "Invoice Created",
      description: `Invoice ${newInvoice.invoiceNumber} has been created successfully.`,
    })
  }

  const handleCancelNewInvoice = () => {
    setShowNewInvoice(false)
    setNewInvoice(null)
  }

  const calculateTotal = (inv: Invoice) => {
    const items = inv.items || []
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const tax = inv.taxEnabled ? subtotal * (inv.taxRate / 100) : 0
    return subtotal + tax - (inv.discountAmount || 0)
  }

  const filteredInvoices = invoices.filter((inv) => {
    const invoiceNumber = inv.invoiceNumber || ""
    const clientName = inv.clientName || ""
    const projectNumber = inv.projectNumber || ""

    const matchesSearch =
      invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || inv.paymentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDeleteInvoice = async (id: string) => {
    await deleteInvoice(id)
    setInvoices(await getInvoices())
    toast({
      title: "Deleted",
      description: "Invoice has been deleted.",
    })
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (showNewInvoice && newInvoice && settings) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:ml-64 p-4 lg:p-6">
          {/* Header with actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pt-12 lg:pt-0">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">Create New Invoice</h1>
              <p className="text-sm text-muted-foreground">Fill in the details below</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelNewInvoice} className="gap-2 bg-transparent">
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSaveInvoice} className="gap-2">
                <Save className="h-4 w-4" /> Save Invoice
              </Button>
            </div>
          </div>

          {/* Tab toggle for mobile */}
          <div className="flex gap-2 mb-4 lg:hidden">
            <Button
              variant={activeTab === "form" ? "default" : "outline"}
              onClick={() => setActiveTab("form")}
              className="flex-1"
            >
              Form
            </Button>
            <Button
              variant={activeTab === "preview" ? "default" : "outline"}
              onClick={() => setActiveTab("preview")}
              className="flex-1"
            >
              Preview
            </Button>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Form Column */}
            <div className={`space-y-4 ${activeTab === "preview" ? "hidden lg:block" : ""}`}>
              <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-2 space-y-4">
                <InvoiceForm invoice={newInvoice} onInvoiceUpdate={setNewInvoice} />

                {/* Signature Section */}
                <Card>
                  <CardContent className="pt-4">
                    <SignaturePad
                      initialSignature={newInvoice.signature}
                      onSignatureChange={(sig) => setNewInvoice({ ...newInvoice, signature: sig })}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Preview Column */}
            <div className={`${activeTab === "form" ? "hidden lg:block" : ""}`}>
              <div className="sticky top-4">
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
                      <InvoicePreviewFull invoice={newInvoice} settings={settings} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <Toaster />
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
            <h1 className="text-2xl lg:text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage all your invoices ({invoices.length} total)</p>
          </div>
          <Button className="gap-2" onClick={handleNewInvoice}>
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, client, or project..."
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoice List */}
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" ? "No invoices found." : "No invoices yet."}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={handleNewInvoice}>Create Your First Invoice</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => {
              const total = calculateTotal(invoice)
              const symbol = CURRENCY_SYMBOLS[invoice.currency]
              return (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-bold text-lg">{invoice.invoiceNumber}</span>
                          <Badge variant="outline" className={statusColors[invoice.paymentStatus]}>
                            {invoice.paymentStatus}
                          </Badge>
                          {invoice.isRecurring && (
                            <Badge variant="secondary" className="gap-1">
                              <RefreshCw className="h-3 w-3" />
                              Recurring
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            <span className="font-medium">Client:</span> {invoice.clientName}
                          </p>
                          <p>
                            <span className="font-medium">Project:</span> {invoice.projectNumber}
                          </p>
                          <p>
                            <span className="font-medium">Date:</span> {new Date(invoice.date).toLocaleDateString()}
                            {invoice.dueDate && (
                              <>
                                {" "}
                                | <span className="font-medium">Due:</span>{" "}
                                {new Date(invoice.dueDate).toLocaleDateString()}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {symbol}
                            {total.toFixed(2)}
                          </p>
                          {invoice.paymentStatus === "partial" && (
                            <p className="text-sm text-muted-foreground">
                              Paid: {symbol}
                              {(invoice.amountPaid || 0).toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="outline" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete invoice {invoice.invoiceNumber}. This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteInvoice(invoice.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
      <Toaster />
    </div>
  )
}
