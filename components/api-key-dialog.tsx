"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Key } from "lucide-react"

interface ApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApiKeyDialog({ open, onOpenChange }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("")
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    // 从 localStorage 加载已保存的 API Key
    const savedKey = localStorage.getItem("openai_api_key")
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [open])

  const handleSave = () => {
    // 保存到 localStorage
    if (apiKey.trim()) {
      localStorage.setItem("openai_api_key", apiKey.trim())
      // 这里需要将 key 同步到服务器端（通过环境变量或其他方式）
      // 由于安全限制，我们只能在客户端存储，实际使用时需要管理员在 Supabase 后台配置
      onOpenChange(false)
    }
  }

  const handleClear = () => {
    localStorage.removeItem("openai_api_key")
    setApiKey("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            OpenAI API Key 配置
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
              重要提示
            </p>
            <p className="text-amber-800 dark:text-amber-200 text-xs">
              为了使用 AI 公式生成功能，需要配置 OpenAI API Key。请在 Supabase 项目设置中添加环境变量 <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">OPENAI_API_KEY</code>。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              获取 API Key: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://platform.openai.com/api-keys</a>
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">配置步骤：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>登录 Supabase 控制台</li>
              <li>进入项目设置 → Edge Functions</li>
              <li>添加环境变量：<code className="bg-muted px-1 rounded">OPENAI_API_KEY</code></li>
              <li>粘贴您的 OpenAI API Key</li>
              <li>保存并重新部署 Edge Function</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleClear} variant="outline" className="flex-1">
              清除
            </Button>
            <Button onClick={handleSave} className="flex-1">
              确认
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
