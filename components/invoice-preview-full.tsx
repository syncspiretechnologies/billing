"use client"

import { useRef, useState, useEffect } from "react"
import type { Invoice } from "@/lib/types"
import { CURRENCY_SYMBOLS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Download, Mail, Printer } from "lucide-react"
import Image from "next/image"
import { getSettings } from "@/lib/db"
import type { CompanySettings } from "@/lib/types"
import { QRCodeSVG } from "qrcode.react"

interface InvoicePreviewFullProps {
  invoice: Invoice
  settings?: CompanySettings | null
}

export default function InvoicePreviewFull({ invoice, settings: propSettings }: InvoicePreviewFullProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)
  const [localSettings, setLocalSettings] = useState<CompanySettings | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!propSettings) {
      getSettings().then(setLocalSettings)
    }
  }, [propSettings])

  const settings = propSettings || localSettings
  const symbol = CURRENCY_SYMBOLS[invoice.currency] || "$"

  const items = invoice.items || []
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice) + ((item.extraHours || 0) * item.unitPrice), 0)
  const tax = invoice.taxEnabled ? subtotal * (invoice.taxRate / 100) : 0
  // Discount is already calculated based on total with tax in invoice-form
  const total = subtotal + tax - (invoice.discountAmount || 0)
  const hasExtraHours = items.some(item => (item.extraHours || 0) > 0)

  // Generate UPI QR code if UPI ID is available, otherwise fallback to text info
  let paymentInfo = ""
  const upiId = settings?.upiId?.trim()
  
  if (upiId && upiId.includes("@")) {
    // Remove any accidental spaces from UPI ID
    const cleanUpiId = upiId.replace(/\s/g, "")
    const rawName = (settings?.name || "SyncSpire Technologies").trim()
    // Ensure name doesn't have characters that break UPI apps
    const payeeName = encodeURIComponent(rawName)
    const amount = total.toFixed(2)
    const currency = invoice.currency || "INR"
    
    // Simplified UPI URL to maximize compatibility
    // We manually construct the string to ensure the '@' in the UPI ID is NOT percent-encoded.
    // While standard URL encoding requires %40, some UPI apps fail to parse it correctly.
    const encodedName = encodeURIComponent(rawName);
    // Add transaction note (tn) to help identify the payment in bank statement
    const note = encodeURIComponent(`Invoice ${invoice.invoiceNumber}`);
    paymentInfo = `upi://pay?pa=${cleanUpiId}&pn=${encodedName}&am=${amount}&cu=INR&tn=${note}`;
  } else {
    paymentInfo = `Payment for Invoice ${invoice.invoiceNumber || "N/A"}\nAmount: ${symbol}${total.toFixed(2)}\nCompany: ${settings?.name || "SyncSpire Technologies"}\nEmail: ${settings?.email || "syncspiretechnologies@gmail.com"}`
    if (settings?.bankDetails) {
      paymentInfo += `\n\nBank Details:\n${settings.bankDetails}`
    }
  }

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return

    try {
      const html2pdf = (await import("html2pdf.js")).default
      const opt = {
        margin: 0,
        filename: `${invoice.invoiceNumber || "invoice"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      }
      html2pdf().set(opt).from(invoiceRef.current).save()
    } catch (error) {
      console.error("Error generating PDF:", error)
      window.print()
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSendEmail = () => {
    const companyName = settings?.name || "SyncSpire Technologies"
    const companyEmail = settings?.email || "syncspiretechnologies@gmail.com"
    const companyPhone = settings?.phone || "8089921762"
    
    const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ${companyName}`)
    const body = encodeURIComponent(
      `Dear ${invoice.clientName || "Client"},\n\nPlease find attached the invoice ${invoice.invoiceNumber} for the amount of ${symbol}${total.toFixed(2)}.\n\nDue Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Not specified"}\n\nThank you for your business!\n\nBest regards,\n${companyName}\nPhone: ${companyPhone}\nEmail: ${companyEmail}`,
    )
    window.location.href = `mailto:${invoice.clientEmail}?subject=${subject}&body=${body}`
  }

  if (!mounted) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sticky top-4 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-lg no-print">
        <Button onClick={handleDownloadPDF} className="gap-2" size="sm">
          <Download className="h-4 w-4" /> PDF
        </Button>
        <Button variant="outline" onClick={handlePrint} className="gap-2 bg-transparent" size="sm">
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button variant="outline" onClick={handleSendEmail} className="gap-2 bg-transparent" size="sm">
          <Mail className="h-4 w-4" /> Email
        </Button>
      </div>

      {/* Invoice Preview - A4 Container */}
      <div
        ref={invoiceRef}
        className="bg-white mx-auto overflow-hidden relative flex flex-col"
        style={{
          width: "210mm",
          minHeight: "297mm",
          color: "#1f2937", // gray-800
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Header */}
        <div className="p-8 pb-6 flex justify-between items-start border-b border-gray-100">
          <div className="flex flex-col gap-4">
             {/* Logo - Original Colors */}
             <div className="relative h-24 w-56">
                <Image
                  src="/images/syncspire.jpg"
                  alt="SyncSpire"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">{settings?.name || "SyncSpire Technologies"}</h1>
                <p className="text-gray-500 text-sm mt-1">Professional Solutions</p>
              </div>
          </div>
          <div className="text-right">
            <h2 className="text-5xl font-light tracking-tight text-slate-800">INVOICE</h2>
            <p className="text-slate-500 font-medium mt-2 text-lg">#{invoice.invoiceNumber}</p>
            <div className="mt-4 space-y-1 text-sm text-gray-500">
              <p>Date: <span className="font-semibold text-gray-900">{invoice.date ? new Date(invoice.date).toLocaleDateString() : "—"}</span></p>
              <p>Due Date: <span className="font-semibold text-gray-900">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}</span></p>
            </div>
          </div>
        </div>

        {/* Addresses & Info */}
        <div className="p-8 grid grid-cols-2 gap-12">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-gray-100 pb-2 w-fit">Bill To</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p className="font-bold text-lg text-gray-900">{invoice.clientName || "Client Name"}</p>
              <p>{invoice.clientEmail}</p>
              <p>{invoice.clientPhone}</p>
              <p className="whitespace-pre-line mt-2">{invoice.clientAddress}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex flex-col items-end">
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-gray-100 pb-2 w-fit">Pay To</h3>
               <div className="space-y-1 text-sm text-gray-600">
                  <p className="font-bold text-lg text-gray-900">{settings?.name || "SyncSpire Technologies"}</p>
                  <p>syncspiretechnologies@gmail.com</p>
                  <p>+91 8089921762</p>
                  <p className="whitespace-pre-line mt-2">{settings?.address}</p>
               </div>
            </div>
            
            {(invoice.poNumber || invoice.projectNumber) && (
               <div className="mt-8 flex flex-col items-end gap-1 text-sm">
                  {invoice.poNumber && <p><span className="text-gray-400">PO #:</span> <span className="font-medium text-gray-900">{invoice.poNumber}</span></p>}
                  {invoice.projectNumber && <p><span className="text-gray-400">Project ID:</span> <span className="font-medium text-gray-900">{invoice.projectNumber}</span></p>}
               </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="px-8 mb-8 flex-grow">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-800">
                <th className="text-left py-3 font-bold text-slate-800 uppercase tracking-wider text-xs">Description</th>
                <th className="text-center py-3 font-bold text-slate-800 uppercase tracking-wider text-xs">Type</th>
                <th className="text-right py-3 font-bold text-slate-800 uppercase tracking-wider text-xs">Qty</th>
                {hasExtraHours && <th className="text-right py-3 font-bold text-slate-800 uppercase tracking-wider text-xs">Extra Hrs</th>}
                <th className="text-right py-3 font-bold text-slate-800 uppercase tracking-wider text-xs">Price</th>
                <th className="text-right py-3 font-bold text-slate-800 uppercase tracking-wider text-xs">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 pr-4 text-gray-700 font-medium">{item.description || "—"}</td>
                    <td className="py-4 px-2 text-center text-gray-500 text-xs uppercase">{item.type}</td>
                    <td className="text-right py-4 px-2 text-gray-600">{item.quantity}</td>
                    {hasExtraHours && <td className="text-right py-4 px-2 text-gray-600">{item.extraHours || "—"}</td>}
                    <td className="text-right py-4 px-2 text-gray-600">{symbol}{item.unitPrice.toFixed(2)}</td>
                    <td className="text-right py-4 pl-4 font-bold text-gray-900">
                      {symbol}{((item.quantity * item.unitPrice) + ((item.extraHours || 0) * item.unitPrice)).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hasExtraHours ? 6 : 5} className="py-12 text-center text-gray-400 italic">No items added yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Area */}
        <div className="bg-slate-50 p-8 border-t border-gray-200 mt-auto">
          <div className="flex justify-between items-start gap-12">
            {/* Left: QR & Notes */}
            <div className="flex gap-8">
               <div className="flex flex-col gap-1">
                 <div className="bg-white p-2 rounded-lg border border-gray-200 h-fit">
                    <QRCodeSVG value={paymentInfo} size={90} level="M" />
                 </div>
                 {upiId && upiId.includes("@") && (
                     <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Paying to</p>
                        <p className="text-[10px] text-gray-600 font-mono break-all max-w-[100px] leading-tight">{upiId}</p>
                     </div>
                 )}
               </div>
               <div className="max-w-xs space-y-6">
                  {(settings?.bankDetails || invoice.bankDetails) && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bank Details</p>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{invoice.bankDetails || settings?.bankDetails}</p>
                    </div>
                  )}
                  {invoice.notes && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Right: Totals */}
            <div className="w-80">
               <div className="space-y-3 pb-6 border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="font-bold text-gray-900">{symbol}{subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.taxEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Tax ({invoice.taxRate}%)</span>
                      <span className="font-bold text-gray-900">{symbol}{tax.toFixed(2)}</span>
                    </div>
                  )}
                  {(invoice.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span className="font-medium">Discount</span>
                      <span className="font-bold">-{symbol}{(invoice.discountAmount || 0).toFixed(2)}</span>
                    </div>
                  )}
               </div>
               <div className="pt-4 flex justify-between items-end">
                  <span className="text-gray-900 font-bold text-lg">Total Due</span>
                  <span className="text-slate-800 font-extrabold text-4xl">{symbol}{total.toFixed(2)}</span>
               </div>
            </div>
          </div>
          
          {/* Bottom Copyright */}
          <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center text-xs text-gray-400">
             <p>Thank you for your business!</p>
             <p>Generated by SyncSpire Technologies</p>
          </div>
        </div>
      </div>
    </div>
  )
}
