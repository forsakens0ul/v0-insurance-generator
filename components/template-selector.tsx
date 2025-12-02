"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Layout, Check } from "lucide-react"
import { templates, type TemplateOption } from "@/lib/templates"
import { useQuoterStore } from "@/lib/quoter-store"

interface TemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTemplateId?: string
}

export function TemplateSelector({ open, onOpenChange, currentTemplateId }: TemplateSelectorProps) {
  const { setConfig } = useQuoterStore()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const handleSelectTemplate = (template: TemplateOption) => {
    setSelectedTemplate(template.id)
    setConfig(template.config)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-primary" />
            选择报价器模板
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[500px] pr-4">
          <div className="grid gap-4 pt-4">
            {templates.map((template) => {
              const isSelected = template.id === currentTemplateId
              const isCurrent = selectedTemplate === template.id

              return (
                <Card
                  key={template.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{template.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{template.name}</h3>
                        {isSelected && (
                          <Badge variant="default" className="text-xs">
                            当前使用
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>📋 {template.config.fields.length} 个字段</span>
                        <span>📊 {template.config.coefficientTables.length} 个系数表</span>
                        <span>🔢 {template.config.formulas.length} 个公式</span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground mt-2">
          <p className="font-medium text-foreground mb-1">💡 提示</p>
          <p>选择模板后会自动切换到对应的配置，包括字段、系数表和计算公式。</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
