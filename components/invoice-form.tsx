"use client"

import { useState, useEffect } from "react"
import type { Invoice, InvoiceItem, Customer, Currency, ItemType } from "@/lib/types"
import { CURRENCY_SYMBOLS } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Trash2, Plus, User, CheckCircle, XCircle, Ticket } from "lucide-react"
import { getCustomers, getSettings, redeemCoupon, getCouponByCode } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { getExchangeRate } from "@/lib/currency"
import FileUpload from "@/components/file-upload"

interface InvoiceFormProps {
  invoice: Invoice
  onInvoiceUpdate: (invoice: Invoice) => void
}

export default function InvoiceForm({ invoice, onInvoiceUpdate }: InvoiceFormProps) {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [couponCode, setCouponCode] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState("")

  useEffect(() => {
    const loadData = async () => {
      setCustomers(await getCustomers())
      setSettings(await getSettings())
    }
    loadData()
  }, [])

  const handleFieldChange = (field: keyof Invoice, value: unknown) => {
    onInvoiceUpdate({ ...invoice, [field]: value })
  }

  const handleCurrencyChange = async (newCurrency: Currency) => {
    const oldCurrency = invoice.currency
    if (oldCurrency === newCurrency) return

    try {
      const rate = await getExchangeRate(oldCurrency, newCurrency)
      
      const updatedItems = (invoice.items || []).map(item => ({
        ...item,
        unitPrice: Number((item.unitPrice * rate).toFixed(2))
      }))

      const updatedInvoice = {
        ...invoice,
        currency: newCurrency,
        items: updatedItems,
        discountAmount: invoice.discountAmount ? Number((invoice.discountAmount * rate).toFixed(2)) : 0
      }
      
      onInvoiceUpdate(updatedInvoice)
      
      toast({
        title: "Currency Updated",
        description: `Converted from ${oldCurrency} to ${newCurrency} at rate ${rate}`,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: "Conversion Failed",
        description: "Could not fetch exchange rates. Currency symbol updated only.",
        variant: "destructive"
      })
      // Fallback: just update the symbol
      onInvoiceUpdate({ ...invoice, currency: newCurrency })
    }
  }

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      type: "service",
      quantity: 1,
      unitPrice: 0,
      extraHours: 0,
    }
    onInvoiceUpdate({ ...invoice, items: [...(invoice.items || []), newItem] })
  }

  const handleRemoveItem = (id: string) => {
    onInvoiceUpdate({
      ...invoice,
      items: (invoice.items || []).filter((item) => item.id !== id),
    })
  }

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: unknown) => {
    onInvoiceUpdate({
      ...invoice,
      items: (invoice.items || []).map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    })
  }

  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId)
    if (customer) {
      onInvoiceUpdate({
        ...invoice,
        clientName: customer.name,
        clientEmail: customer.email,
        clientPhone: customer.phone,
        clientAddress: customer.address,
      })
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code")
      return
    }

    const existingCoupon = await getCouponByCode(couponCode)
    if (!existingCoupon || !existingCoupon.isActive) {
      setCouponError("Invalid or expired coupon code")
      setCouponApplied(false)
      return
    }

    const subtotal = (invoice.items || []).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const tax = invoice.taxEnabled ? subtotal * (invoice.taxRate / 100) : 0
    const totalWithTax = subtotal + tax
    
    let discountAmount = 0
    if (existingCoupon.discountType === "percentage") {
      discountAmount = (totalWithTax * existingCoupon.discountValue) / 100
    } else {
      discountAmount = existingCoupon.discountValue
    }

    onInvoiceUpdate({
      ...invoice,
      discountCode: couponCode.toUpperCase(),
      discountAmount: discountAmount,
    })

    setCouponApplied(true)
    setCouponError("")
    toast({
      title: "Coupon Applied!",
      description: `Discount of ${existingCoupon.discountType === "percentage" ? `${existingCoupon.discountValue}%` : `$${existingCoupon.discountValue}`} applied.`,
    })
  }

  const handleRemoveCoupon = () => {
    setCouponCode("")
    setCouponApplied(false)
    setCouponError("")
    onInvoiceUpdate({
      ...invoice,
      discountCode: "",
      discountAmount: 0,
    })
  }

  const symbol = CURRENCY_SYMBOLS[invoice.currency] || "$"
  const items = invoice.items || []

  return (
    <div className="space-y-4">
      {/* Invoice & Project Numbers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Invoice Number</Label>
              <Input
                value={invoice.invoiceNumber}
                onChange={(e) => handleFieldChange("invoiceNumber", e.target.value)}
                placeholder="INV-0001"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Project Number</Label>
              <Input
                value={invoice.projectNumber}
                onChange={(e) => handleFieldChange("projectNumber", e.target.value)}
                placeholder="PRJ-0001"
                className="h-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Invoice Date</Label>
              <Input
                type="date"
                value={invoice.date}
                onChange={(e) => handleFieldChange("date", e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Due Date</Label>
              <Input
                type="date"
                value={invoice.dueDate}
                onChange={(e) => handleFieldChange("dueDate", e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Currency</Label>
              <Select
                value={invoice.currency}
                onValueChange={(value: Currency) => handleCurrencyChange(value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">PO Number</Label>
              <Input
                value={invoice.poNumber}
                onChange={(e) => handleFieldChange("poNumber", e.target.value)}
                placeholder="PO-12345"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
            <span>Client Information</span>
            {customers.length > 0 && (
              <Select onValueChange={handleSelectCustomer}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <User className="h-3 w-3 mr-1" />
                  <SelectValue placeholder="Load" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Client Name</Label>
              <Input
                value={invoice.clientName}
                onChange={(e) => handleFieldChange("clientName", e.target.value)}
                placeholder="Client Name"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Client Email</Label>
              <Input
                type="email"
                value={invoice.clientEmail}
                onChange={(e) => handleFieldChange("clientEmail", e.target.value)}
                placeholder="email@example.com"
                className="h-9"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Client Phone</Label>
              <Input
                value={invoice.clientPhone}
                onChange={(e) => handleFieldChange("clientPhone", e.target.value)}
                placeholder="+1 234 567 8900"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Client Address</Label>
              <Input
                value={invoice.clientAddress}
                onChange={(e) => handleFieldChange("clientAddress", e.target.value)}
                placeholder="123 Main St, City"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <CardTitle className="text-base font-semibold text-slate-800">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {items.map((item) => (
            <div key={item.id} className="p-4 border border-slate-200 rounded-xl space-y-4 bg-white hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1.5 block">Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                      placeholder="Item description"
                      className="h-10 border-slate-200 focus:border-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Type</Label>
                      <Select
                        value={item.type}
                        onValueChange={(value: ItemType) => handleUpdateItem(item.id, "type", value)}
                      >
                        <SelectTrigger className="h-10 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, "quantity", Number(e.target.value))}
                        placeholder="Qty"
                        className="h-10 border-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Extra Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={item.extraHours || 0}
                        onChange={(e) => handleUpdateItem(item.id, "extraHours", Number(e.target.value))}
                        placeholder="Hrs"
                        className="h-10 border-slate-200"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1.5 block">Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(item.id, "unitPrice", Number(e.target.value))}
                        placeholder="Price"
                        className="h-10 border-slate-200"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50 mt-7"
                  onClick={() => handleRemoveItem(item.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">Line Total:</span>
                <span className="text-sm font-bold text-slate-900">
                  {symbol}
                  {((item.quantity * item.unitPrice) + ((item.extraHours || 0) * item.unitPrice)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          <Button onClick={handleAddItem} variant="outline" className="w-full gap-2 border-dashed border-slate-300 text-slate-600 hover:border-primary hover:text-primary h-12">
            <Plus className="h-4 w-4" /> Add New Item
          </Button>
        </CardContent>
      </Card>

      {/* Tax & Discount */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tax & Discount</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Enable Tax</Label>
              <p className="text-xs text-muted-foreground">Add tax to invoice</p>
            </div>
            <Switch
              checked={invoice.taxEnabled}
              onCheckedChange={(checked) => handleFieldChange("taxEnabled", checked)}
            />
          </div>
          {invoice.taxEnabled && (
            <div>
              <Label className="text-xs">Tax Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={invoice.taxRate}
                onChange={(e) => handleFieldChange("taxRate", Number(e.target.value))}
                className="h-9"
              />
            </div>
          )}

          <div className="border-t pt-3">
            <Label className="flex items-center gap-2 mb-2 text-sm">
              <Ticket className="h-4 w-4" /> Apply Coupon
            </Label>
            {couponApplied ? (
              <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-700 dark:text-green-400 text-sm truncate">
                    "{invoice.discountCode}" applied!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    -{symbol}
                    {(invoice.discountAmount || 0).toFixed(2)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="h-8 w-8 p-0">
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase())
                      setCouponError("")
                    }}
                    placeholder="Enter code"
                    className="uppercase h-9"
                  />
                  <Button onClick={handleApplyCoupon} variant="secondary" className="h-9">
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> {couponError}
                  </p>
                )}
              </div>
            )}
          </div>

          {!couponApplied && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Manual Discount Code</Label>
                <Input
                  value={invoice.discountCode || ""}
                  onChange={(e) => handleFieldChange("discountCode", e.target.value)}
                  placeholder="DISCOUNT10"
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Discount Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoice.discountAmount}
                  onChange={(e) => handleFieldChange("discountAmount", Number(e.target.value))}
                  className="h-9"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recurring Invoice */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recurring Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Mark as Recurring</Label>
              <p className="text-xs text-muted-foreground">For maintenance projects</p>
            </div>
            <Switch
              checked={invoice.isRecurring}
              onCheckedChange={(checked) => handleFieldChange("isRecurring", checked)}
            />
          </div>
          {invoice.isRecurring && (
            <div>
              <Label className="text-xs">Interval</Label>
              <Select
                value={invoice.recurringInterval || "monthly"}
                onValueChange={(value) => handleFieldChange("recurringInterval", value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Additional Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={invoice.notes}
              onChange={(e) => handleFieldChange("notes", e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
          <div>
            <Label className="text-xs">Bank Details</Label>
            <Textarea
              value={invoice.bankDetails}
              onChange={(e) => handleFieldChange("bankDetails", e.target.value)}
              placeholder="Bank: XXX | Account: XXX | IFSC: XXX"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attachments</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            attachments={invoice.attachments || []}
            onUpdate={(attachments) => handleFieldChange("attachments", attachments)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
