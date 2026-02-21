"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface CopyInviteCodeProps {
  code: string
}

export function CopyInviteCode({ code }: CopyInviteCodeProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success("Codice copiato!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-sm font-mono px-3 py-1">
        {code}
      </Badge>
      <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  )
}
