"use client"

import { useState } from "react"
import { ExcelEditor } from "@/components/excel-editor"
import { QuoterPreview } from "@/components/quoter-preview"
import { ExportPanel } from "@/components/export-panel"
import { ApiKeyDialog } from "@/components/api-key-dialog"
import { HistoryPanel } from "@/components/history-panel"
import { TemplateSelector } from "@/components/template-selector"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PanelLeftClose, PanelLeftOpen, Download, Save, RotateCcw, Smartphone, Key, History } from "lucide-react"
import { useQuoterStore } from "@/lib/quoter-store"

export default function Home() {
  const [showExport, setShowExport] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)
  const [configName, setConfigName] = useState("")
  const [saving, setSaving] = useState(false)
  const { config, resetToDefault } = useQuoterStore()

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Toolbar */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-foreground">报价器工作台</span>
          </div>
          <span className="text-sm text-muted-foreground">|</span>
          <span className="text-sm text-muted-foreground">{config.name}</span>
          <Button
            size="sm"
            onClick={() => setTemplateSelectorOpen(true)}
            className="h-7 bg-blue-600 hover:bg-blue-700 text-white"
          >
            切换模板
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => resetToDefault()}>
            <RotateCcw className="mr-1 h-4 w-4" />
            重置默认
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(true)}>
            <Save className="mr-1 h-4 w-4" />
            保存配置
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <History className="mr-1 h-4 w-4" />
            历史记录
          </Button>
          <Button size="sm" onClick={() => setShowExport(!showExport)}>
            <Download className="mr-1 h-4 w-4" />
            导出
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={() => setApiKeyDialogOpen(true)}>
            <Key className="mr-1 h-4 w-4" />
            API Key
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Excel Editor */}
        <div
          className={`border-r border-border bg-card transition-all duration-300 ${
            leftPanelCollapsed ? "w-0 overflow-hidden" : "w-[480px]"
          }`}
        >
          <ExcelEditor />
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          className="flex h-full w-6 items-center justify-center border-r border-border bg-muted/50 hover:bg-muted transition-colors"
        >
          {leftPanelCollapsed ? (
            <PanelLeftOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Center - Preview */}
        <div className="flex-1 flex flex-col bg-muted/30">
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">实时预览</span>
            </div>
            <Tabs defaultValue="mobile" className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="mobile" className="text-xs px-3">
                  移动端
                </TabsTrigger>
                <TabsTrigger value="desktop" className="text-xs px-3">
                  桌面端
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex-1 flex items-start justify-center overflow-auto p-6">
            <div className="w-[400px] h-[700px] rounded-3xl border-8 border-foreground/10 bg-card shadow-2xl overflow-hidden">
              <QuoterPreview />
            </div>
          </div>
        </div>

        {/* Right Panel - Export / History */}
        {showExport && (
          <div className="w-[400px] border-l border-border">
            <ExportPanel />
          </div>
        )}
        {showHistory && (
          <HistoryPanel onClose={() => setShowHistory(false)} />
        )}
      </div>

      {/* API Key Dialog */}
      <ApiKeyDialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen} />

      {/* Template Selector */}
      <TemplateSelector
        open={templateSelectorOpen}
        onOpenChange={setTemplateSelectorOpen}
        currentTemplateId={config.id}
      />

      {/* Save Config Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存配置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="config-name">配置名称</Label>
              <Input
                id="config-name"
                placeholder="例如：个人意外险 v1.0"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSaveDialogOpen(false)}
                disabled={saving}
              >
                取消
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!configName.trim()) return
                  setSaving(true)
                  try {
                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
                    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

                    if (!supabaseUrl || !supabaseAnonKey) {
                      throw new Error("Supabase 配置缺失")
                    }

                    const response = await fetch(`${supabaseUrl}/rest/v1/quoter_configs`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "apikey": supabaseAnonKey,
                        "Authorization": `Bearer ${supabaseAnonKey}`,
                        "Prefer": "return=minimal",
                      },
                      body: JSON.stringify({
                        name: configName.trim(),
                        config_data: config,
                      }),
                    })

                    if (!response.ok) {
                      throw new Error("保存失败")
                    }

                    setSaveDialogOpen(false)
                    setConfigName("")
                    alert("保存成功！")
                  } catch (error) {
                    console.error("保存配置错误:", error)
                    alert("保存失败，请重试")
                  } finally {
                    setSaving(false)
                  }
                }}
                disabled={!configName.trim() || saving}
              >
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
