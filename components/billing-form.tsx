"use client"
import type { Invoice, InvoiceItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ItemForm from "./item-form"

interface BillingFormProps {
  invoice: Invoice
  onInvoiceUpdate: (invoice: Invoice) => void
}

export default function BillingForm({ invoice, onInvoiceUpdate }: BillingFormProps) {
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
    }
    onInvoiceUpdate({
      ...invoice,
      items: [...invoice.items, newItem],
    })
  }

  const handleRemoveItem = (id: string) => {
    onInvoiceUpdate({
      ...invoice,
      items: invoice.items.filter((item) => item.id !== id),
    })
  }

  const handleUpdateItem = (id: string, updatedItem: InvoiceItem) => {
    onInvoiceUpdate({
      ...invoice,
      items: invoice.items.map((item) => (item.id === id ? updatedItem : item)),
    })
  }

  const handleBasicInfoChange = (field: string, value: string) => {
    onInvoiceUpdate({
      ...invoice,
      [field]: value,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Invoice Number</label>
              <Input
                value={invoice.invoiceNumber}
                onChange={(e) => handleBasicInfoChange("invoiceNumber", e.target.value)}
                placeholder="INV-001"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Invoice Date</label>
              <Input type="date" value={invoice.date} onChange={(e) => handleBasicInfoChange("date", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Due Date</label>
            <Input
              type="date"
              value={invoice.dueDate}
              onChange={(e) => handleBasicInfoChange("dueDate", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Client Name</label>
            <Input
              value={invoice.clientName}
              onChange={(e) => handleBasicInfoChange("clientName", e.target.value)}
              placeholder="Client Name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Client Email</label>
            <Input
              value={invoice.clientEmail}
              onChange={(e) => handleBasicInfoChange("clientEmail", e.target.value)}
              placeholder="client@example.com"
              type="email"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoice.items.map((item) => (
            <ItemForm
              key={item.id}
              item={item}
              onUpdate={(updated) => handleUpdateItem(item.id, updated)}
              onRemove={() => handleRemoveItem(item.id)}
            />
          ))}
          <Button onClick={handleAddItem} variant="outline" className="w-full bg-transparent">
            + Add Item
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
