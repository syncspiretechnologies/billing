"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import SignaturePad from "@/components/signature-pad"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSettings, saveSettings } from "@/lib/db"
import type { CompanySettings, Currency } from "@/lib/types"
import { Save, Building, CreditCard, FileText, Pen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image"

export default function SettingsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<CompanySettings | null>(null)

  useEffect(() => {
    setMounted(true)
    getSettings().then(setSettings)
  }, [])

  const handleSave = async () => {
    if (settings) {
      await saveSettings(settings)
      toast({
        title: "Success",
        description: "Settings saved successfully!",
      })
    }
  }

  const handleChange = (field: keyof CompanySettings, value: unknown) => {
    if (settings) {
      setSettings({ ...settings, [field]: value })
    }
  }

  if (!mounted || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
            <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your company and invoice settings</p>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" /> Company Information
              </CardTitle>
              <CardDescription>Your company details that appear on invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Image src="/images/syncspire.jpg" alt="Company Logo" width={60} height={60} className="rounded-lg" />
                <div>
                  <p className="font-semibold">{settings.name}</p>
                  <p className="text-sm text-muted-foreground">Company Logo</p>
                </div>
              </div>
              <div>
                <Label>Company Name</Label>
                <Input value={settings.name} onChange={(e) => handleChange("name", e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={settings.email} onChange={(e) => handleChange("email", e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={settings.phone} onChange={(e) => handleChange("phone", e.target.value)} />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea value={settings.address} onChange={(e) => handleChange("address", e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Invoice Settings
              </CardTitle>
              <CardDescription>Configure invoice numbering and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Prefix</Label>
                  <Input
                    value={settings.invoicePrefix}
                    onChange={(e) => handleChange("invoicePrefix", e.target.value)}
                    placeholder="INV"
                  />
                </div>
                <div>
                  <Label>Next Invoice Number</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.nextInvoiceNumber}
                    onChange={(e) => handleChange("nextInvoiceNumber", Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Project Prefix</Label>
                  <Input
                    value={settings.projectPrefix}
                    onChange={(e) => handleChange("projectPrefix", e.target.value)}
                    placeholder="PRJ"
                  />
                </div>
                <div>
                  <Label>Next Project Number</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.nextProjectNumber}
                    onChange={(e) => handleChange("nextProjectNumber", Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Default Currency</Label>
                  <Select
                    value={settings.defaultCurrency}
                    onValueChange={(v: Currency) => handleChange("defaultCurrency", v)}
                  >
                    <SelectTrigger>
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
                  <Label>Default Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.defaultTaxRate}
                    onChange={(e) => handleChange("defaultTaxRate", Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Bank Details
              </CardTitle>
              <CardDescription>Payment information to display on invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>UPI ID</Label>
                <Input
                  value={settings.upiId || ""}
                  onChange={(e) => handleChange("upiId", e.target.value)}
                  placeholder="username@bank"
                  className={settings.upiId && !settings.upiId.includes("@") ? "border-red-500" : ""}
                />
                {settings.upiId && !settings.upiId.includes("@") && (
                  <p className="text-xs text-red-500 mt-1">Invalid UPI ID format. Must contain '@'</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Used to generate payment QR codes on invoices
                </p>
              </div>
              <div>
                <Label>Bank Details</Label>
                <Textarea
                  value={settings.bankDetails}
                  onChange={(e) => handleChange("bankDetails", e.target.value)}
                  placeholder="Bank Name: XXX&#10;Account Number: XXX&#10;IFSC Code: XXX&#10;Account Holder: XXX"
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Default Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pen className="h-5 w-5" /> Default Signature
              </CardTitle>
              <CardDescription>Your signature will appear on all new invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <SignaturePad
                initialSignature={settings.signature}
                onSignatureChange={(sig) => handleChange("signature", sig)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" /> Save All Settings
          </Button>
        </div>
      </main>
      <Toaster />
    </div>
  )
}
