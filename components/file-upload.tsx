"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Upload, FileText, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileUploadProps {
  attachments: string[]
  onUpdate: (attachments: string[]) => void
}

export default function FileUpload({ attachments = [], onUpdate }: FileUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newAttachments: string[] = []
    const maxFileSize = 2 * 1024 * 1024 // 2MB limit per file to avoid localStorage issues

    Array.from(files).forEach((file) => {
      if (file.size > maxFileSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 2MB limit.`,
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          newAttachments.push(event.target.result as string)
          if (newAttachments.length === files.length) {
            onUpdate([...attachments, ...newAttachments])
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
          }
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments]
    newAttachments.splice(index, 1)
    onUpdate(newAttachments)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload Bills/Receipts"}
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <span className="text-xs text-muted-foreground">
          Max 2MB per file. Images & PDFs supported.
        </span>
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
          {attachments.map((attachment, index) => {
            const isPdf = attachment.startsWith("data:application/pdf")
            return (
              <div key={index} className="relative group border rounded-lg p-2 bg-background">
                <div className="aspect-square flex items-center justify-center overflow-hidden rounded bg-muted">
                  {isPdf ? (
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  ) : (
                    <img
                      src={attachment}
                      alt={`Attachment ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <p className="text-xs text-center mt-1 truncate">
                  {isPdf ? "PDF Document" : `Image ${index + 1}`}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
