"use client"

import type { InvoiceItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface ItemFormProps {
  item: InvoiceItem
  onUpdate: (item: InvoiceItem) => void
  onRemove: () => void
}

export default function ItemForm({ item, onUpdate, onRemove }: ItemFormProps) {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <label className="text-xs font-medium text-foreground mb-1 block">Description</label>
        <Input
          value={item.description}
          onChange={(e) =>
            onUpdate({
              ...item,
              description: e.target.value,
            })
          }
          placeholder="Item description"
        />
      </div>
      <div className="w-32">
        <label className="text-xs font-medium text-foreground mb-1 block">Type</label>
        <Select
          value={item.type}
          onValueChange={(value: any) =>
            onUpdate({
              ...item,
              type: value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="hourly">Hourly</SelectItem>
            <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-24">
        <label className="text-xs font-medium text-foreground mb-1 block">Qty</label>
        <Input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) =>
            onUpdate({
              ...item,
              quantity: Number.parseInt(e.target.value) || 1,
            })
          }
        />
      </div>
      <div className="w-32">
        <label className="text-xs font-medium text-foreground mb-1 block">Unit Price</label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) =>
            onUpdate({
              ...item,
              unitPrice: Number.parseFloat(e.target.value) || 0,
            })
          }
        />
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} className="text-destructive">
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
