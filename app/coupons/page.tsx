"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { getCoupons, saveCoupon, deleteCoupon } from "@/lib/db"
import { generateUUID } from "@/lib/utils"
import type { Coupon, DiscountType } from "@/lib/types"
import { Plus, Trash2, Ticket, Percent, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function CouponsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountType: "percentage" as DiscountType,
    discountValue: 10,
    description: "",
  })

  useEffect(() => {
    setMounted(true)
    const loadCoupons = async () => {
      const data = await getCoupons()
      setCoupons(data)
    }
    loadCoupons()
  }, [])

  const handleCreateCoupon = async () => {
    if (!newCoupon.code.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      })
      return
    }

    const existing = coupons.find((c) => c.code.toUpperCase() === newCoupon.code.toUpperCase())
    if (existing) {
      toast({
        title: "Error",
        description: "A coupon with this code already exists",
        variant: "destructive",
      })
      return
    }

    const coupon: Coupon = {
      id: generateUUID(),
      code: newCoupon.code.toUpperCase(),
      discountType: newCoupon.discountType,
      discountValue: newCoupon.discountValue,
      description: newCoupon.description,
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    }

    await saveCoupon(coupon)
    const updatedCoupons = await getCoupons()
    setCoupons(updatedCoupons)
    setDialogOpen(false)
    setNewCoupon({
      code: "",
      discountType: "percentage",
      discountValue: 10,
      description: "",
    })

    toast({
      title: "Success",
      description: "Coupon created successfully!",
    })
  }

  const handleToggleActive = async (coupon: Coupon) => {
    const updated = { ...coupon, isActive: !coupon.isActive }
    await saveCoupon(updated)
    const updatedCoupons = await getCoupons()
    setCoupons(updatedCoupons)
  }

  const handleDelete = async (id: string) => {
    await deleteCoupon(id)
    const updatedCoupons = await getCoupons()
    setCoupons(updatedCoupons)
    toast({
      title: "Deleted",
      description: "Coupon deleted successfully",
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
      <main className="lg:ml-64 p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pt-12 lg:pt-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Coupons</h1>
            <p className="text-muted-foreground">Create and manage discount coupons</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
                <DialogDescription>Create a discount coupon for your customers</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Coupon Code</Label>
                  <Input
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    className="uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Type</Label>
                    <Select
                      value={newCoupon.discountType}
                      onValueChange={(v: DiscountType) => setNewCoupon({ ...newCoupon, discountType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Discount Value {newCoupon.discountType === "percentage" ? "(%)" : "($)"}</Label>
                    <Input
                      type="number"
                      min="0"
                      max={newCoupon.discountType === "percentage" ? 100 : undefined}
                      value={newCoupon.discountValue}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          discountValue: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Input
                    value={newCoupon.description}
                    onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                    placeholder="Summer sale discount"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCoupon}>Create Coupon</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{coupons.length}</p>
                  <p className="text-sm text-muted-foreground">Total Coupons</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Percent className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{coupons.filter((c) => c.isActive).length}</p>
                  <p className="text-sm text-muted-foreground">Active Coupons</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{coupons.reduce((sum, c) => sum + c.usageCount, 0)}</p>
                  <p className="text-sm text-muted-foreground">Times Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coupons Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Coupons</CardTitle>
            <CardDescription>
              Manage your discount coupons. When a coupon is used, it will be automatically removed and a new one
              created with the same discount.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {coupons.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No coupons created yet</p>
                <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setDialogOpen(true)}>
                  Create your first coupon
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                        <TableCell>
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : `$${coupon.discountValue}`}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{coupon.description || "-"}</TableCell>
                        <TableCell>{coupon.usageCount} times</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={coupon.isActive} onCheckedChange={() => handleToggleActive(coupon)} />
                            <Badge variant={coupon.isActive ? "default" : "secondary"}>
                              {coupon.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  )
}
