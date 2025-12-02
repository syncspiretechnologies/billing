"use client"

import type { Invoice } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useRef, useState, useEffect } from "react"

interface InvoicePreviewProps {
  invoice: Invoice
}

export default function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  }

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.18 // 18% tax
  }

  const subtotal = calculateSubtotal()
  const tax = calculateTax(subtotal)
  const total = subtotal + tax

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return

    try {
      const html2pdf = (await import("html2pdf.js")).default

      const element = invoiceRef.current
      const opt = {
        margin: 10,
        filename: `${invoice.invoiceNumber}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      }

      html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error("Error generating PDF:", error)
      // Fallback: use browser's print functionality
      window.print()
    }
  }

  if (!isReady) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center sticky top-4 z-10">
        <h2 className="text-2xl font-bold text-foreground">Invoice Preview</h2>
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>

      <div ref={invoiceRef} className="bg-white p-12 rounded-lg shadow-lg">
        {/* Header with Company Logo and Name */}
        <div className="mb-8 pb-6 border-b-2 border-primary">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">ST</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">Syncspire Technologies</h1>
              <p className="text-sm text-muted-foreground">Professional Solutions</p>
            </div>
          </div>
        </div>

        {/* Invoice Title and Number */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-4">INVOICE</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Invoice No:</span> {invoice.invoiceNumber}
              </p>
              <p>
                <span className="font-semibold">Date:</span> {new Date(invoice.date).toLocaleDateString()}
              </p>
              <p>
                <span className="font-semibold">Due Date:</span>{" "}
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Not specified"}
              </p>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-8 p-4 bg-secondary rounded">
          <h3 className="font-semibold text-foreground mb-2">Bill To</h3>
          <p className="font-bold text-foreground">{invoice.clientName || "Client Name"}</p>
          <p className="text-sm text-muted-foreground">{invoice.clientEmail}</p>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left py-3 px-2 font-semibold text-foreground">Description</th>
                <th className="text-right py-3 px-2 font-semibold text-foreground w-24">Quantity</th>
                <th className="text-right py-3 px-2 font-semibold text-foreground w-28">Unit Price</th>
                <th className="text-right py-3 px-2 font-semibold text-foreground w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-border hover:bg-secondary">
                    <td className="py-3 px-2 text-foreground">{item.description}</td>
                    <td className="text-right py-3 px-2 text-foreground">{item.quantity}</td>
                    <td className="text-right py-3 px-2 text-foreground">₹{item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-3 px-2 font-semibold text-foreground">
                      ₹{(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No items added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80 space-y-3 p-6 bg-secondary rounded-lg border border-border">
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Subtotal</span>
              <span className="text-foreground">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Tax (18%)</span>
              <span className="text-foreground">₹{tax.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-border pt-3 flex justify-between">
              <span className="font-bold text-lg text-primary">Total Amount</span>
              <span className="font-bold text-lg text-primary">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-primary pt-6 text-center text-xs text-muted-foreground">
          <p className="mb-2">Thank you for your business!</p>
          <p>Syncspire Technologies © {new Date().getFullYear()}</p>
          <p className="text-xs mt-2">This is an automatically generated invoice</p>
        </div>
      </div>
    </div>
  )
}
