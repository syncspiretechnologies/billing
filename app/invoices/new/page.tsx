"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import InvoiceForm from "@/components/invoice-form"
import InvoicePreviewFull from "@/components/invoice-preview-full"
import SignaturePad from "@/components/signature-pad"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Invoice, CompanySettings } from "@/lib/types"
import {
  generateInvoiceNumber,
  generateProjectNumber,
  incrementInvoiceNumber,
  incrementProjectNumber,
  saveInvoice,
  saveCustomer,
  getSettings,
} from "@/lib/db"
import { generateUUID } from "@/lib/utils"
import { Save, Eye, FileText, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function NewInvoicePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("edit")
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<CompanySettings | null>(null)

  const [invoice, setInvoice] = useState<Invoice>({
    id: "",
    invoiceNumber: "",
    projectNumber: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    items: [],
    currency: "USD",
    taxEnabled: false,
    taxRate: 18,
    discountCode: "",
    discountAmount: 0,
    notes: "",
    poNumber: "",
    bankDetails: "",
    paymentStatus: "pending",
    amountPaid: 0,
    isRecurring: false,
    signature: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  useEffect(() => {
    setMounted(true)
    const init = async () => {
      const loadedSettings = await getSettings()
      setSettings(loadedSettings)
      const invNum = await generateInvoiceNumber()
      const prjNum = await generateProjectNumber()
      
      setInvoice((prev) => ({
        ...prev,
        id: generateUUID(),
        invoiceNumber: invNum,
        projectNumber: prjNum,
        currency: loadedSettings.defaultCurrency,
        taxEnabled: loadedSettings.defaultTaxRate > 0,
        taxRate: loadedSettings.defaultTaxRate,
        bankDetails: loadedSettings.bankDetails,
        signature: loadedSettings.signature || "",
      }))
    }
    init()
  }, [])

  const handleSaveInvoice = async () => {
    // Validation
    if (!invoice.clientName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a client name.",
        variant: "destructive",
      })
      return
    }

    if ((invoice.items || []).length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add at least one item.",
        variant: "destructive",
      })
      return
    }

    // Check for invalid items
    const invalidItems = (invoice.items || []).filter(
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

    const updatedInvoice = {
      ...invoice,
      updatedAt: new Date().toISOString(),
    }
    await saveInvoice(updatedInvoice)
    await incrementInvoiceNumber()
    await incrementProjectNumber()
    toast({
      title: "Success",
      description: "Invoice saved successfully!",
    })
    router.push("/invoices")
  }

  const handleSaveCustomer = async () => {
    if (!invoice.clientName || !invoice.clientEmail) {
      toast({
        title: "Error",
        description: "Please enter client name and email to save as customer.",
        variant: "destructive",
      })
      return
    }

    await saveCustomer({
      id: generateUUID(),
      name: invoice.clientName,
      email: invoice.clientEmail,
      phone: invoice.clientPhone,
      address: invoice.clientAddress,
      createdAt: new Date().toISOString(),
    })
    toast({
      title: "Success",
      description: "Customer saved successfully!",
    })
  }

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
      <main className="lg:ml-64 p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pt-12 lg:pt-0">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">New Invoice</h1>
            <p className="text-sm text-muted-foreground">Create a professional invoice</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveCustomer} className="gap-2 bg-transparent" size="sm">
              <UserPlus className="h-4 w-4" /> Save Customer
            </Button>
            <Button onClick={handleSaveInvoice} className="gap-2" size="sm">
              <Save className="h-4 w-4" /> Save Invoice
            </Button>
          </div>
        </div>

        {/* Tabs for Mobile */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="lg:hidden">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="edit" className="gap-2 text-sm">
              <FileText className="h-4 w-4" /> Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2 text-sm">
              <Eye className="h-4 w-4" /> Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="space-y-4">
            <InvoiceForm invoice={invoice} onInvoiceUpdate={setInvoice} />
            <SignaturePad
              initialSignature={invoice.signature}
              onSignatureChange={(sig) => setInvoice({ ...invoice, signature: sig })}
            />
          </TabsContent>
          <TabsContent value="preview">
            <InvoicePreviewFull invoice={invoice} settings={settings} />
          </TabsContent>
        </Tabs>

        {/* Desktop Split View */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6">
          <div className="space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
            <InvoiceForm invoice={invoice} onInvoiceUpdate={setInvoice} />
            <SignaturePad
              initialSignature={invoice.signature}
              onSignatureChange={(sig) => setInvoice({ ...invoice, signature: sig })}
            />
          </div>
          <div className="sticky top-4 max-h-[calc(100vh-120px)] overflow-y-auto">
            <InvoicePreviewFull invoice={invoice} settings={settings} />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
