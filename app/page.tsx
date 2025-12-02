"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import DashboardStats from "@/components/dashboard-stats"
import RecentInvoices from "@/components/recent-invoices"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getInvoices, getSettings, saveInvoice } from "@/lib/db"
import type { Invoice, CompanySettings } from "@/lib/types"
import { Plus, FileText, Users, X, Save } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import InvoiceForm from "@/components/invoice-form"
import InvoicePreviewFull from "@/components/invoice-preview-full"
import SignaturePad from "@/components/signature-pad"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { generateUUID } from "@/lib/utils"

function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `INV-${year}${month}-${random}`
}

function generateProjectNumber(): string {
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `PRJ-${random}`
}

export default function Dashboard() {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [mounted, setMounted] = useState(false)

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

  const handleNewInvoice = () => {
    const defaultInvoice: Invoice = {
      id: generateUUID(),
      invoiceNumber: generateInvoiceNumber(),
      projectNumber: generateProjectNumber(),
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

    // Check for invalid items
    const invalidItems = (newInvoice.items || []).filter(
      (item) => !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0
    )

    if (invalidItems.length > 0) {
      toast({
        title: "Invalid Items",
        description: "Please ensure all items have a description, quantity > 0, and price >= 0.",
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

  if (!mounted || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (showNewInvoice && newInvoice) {
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-12 lg:pt-0">
          <div className="flex items-center gap-4">
            <Image
              src="/images/syncspire.jpg"
              alt="SyncSpire Technologies"
              width={48}
              height={48}
              className="rounded-lg lg:hidden"
            />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back to SyncSpire Billing</p>
            </div>
          </div>
          <Button className="gap-2" onClick={handleNewInvoice}>
            <Plus className="h-4 w-4" /> New Invoice
          </Button>
        </div>

        {/* Stats */}
        <DashboardStats invoices={invoices} currency={settings.defaultCurrency} />

        {/* Quick Actions & Recent Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <RecentInvoices invoices={invoices} />
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 bg-transparent"
                  onClick={handleNewInvoice}
                >
                  <Plus className="h-4 w-4" /> Create Invoice
                </Button>
                <Link href="/customers" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 bg-transparent">
                    <Users className="h-4 w-4" /> Manage Customers
                  </Button>
                </Link>
                <Link href="/invoices" className="block">
                  <Button variant="outline" className="w-full justify-start gap-3 bg-transparent">
                    <FileText className="h-4 w-4" /> View All Invoices
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">{settings.name}</p>
                <p className="text-muted-foreground break-all">{settings.email}</p>
                <p className="text-muted-foreground">{settings.phone}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
