"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, ChevronDown, ChevronUp, Loader2, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import { useQuoterStore } from "@/lib/quoter-store"

type AgentType = "auto" | "gpt4" | "claude" | "custom"

interface GenerationStage {
  id: string
  label: string
  status: "pending" | "running" | "completed" | "error"
  message?: string
}

const PROMPT_TEMPLATES = [
  {
    label: "车险报价器",
    prompt: "帮我设计一个车险报价器，需要车龄、驾龄、出险记录字段，根据职业类别和年龄段设置不同费率系数表，计算年保费"
  },
  {
    label: "健康险报价器",
    prompt: "创建健康险报价器，包含年龄、性别、BMI、吸烟史、既往病史字段，使用健康风险评估系数表计算保费"
  },
  {
    label: "团体意外险",
    prompt: "设计企业团体意外险报价器，支持多人员工列表，每个员工包含姓名、年龄、职业，按职业风险等级计算总保费"
  }
]

export function AIChatPanel() {
  const [isOpen, setIsOpen] = useState(true)
  const [prompt, setPrompt] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<AgentType>("auto")
  const [isGenerating, setIsGenerating] = useState(false)
  const [stages, setStages] = useState<GenerationStage[]>([])
  const [error, setError] = useState<string | null>(null)

  const { setConfig } = useQuoterStore()

  const startGeneration = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)

    const initialStages: GenerationStage[] = [
      { id: "analyze", label: "分析需求", status: "running" },
      { id: "fields", label: "生成字段配置", status: "pending" },
      { id: "tables", label: "创建系数表", status: "pending" },
      { id: "formulas", label: "编写计算公式", status: "pending" },
      { id: "validate", label: "验证配置", status: "pending" }
    ]
    setStages(initialStages)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase 配置缺失")
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-quoter-generator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          agent: selectedAgent,
          context: {}
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "生成失败")
      }

      const result = await response.json()

      setStages(prev => prev.map(s => ({ ...s, status: "completed" })))

      setConfig(result.config)

      setTimeout(() => {
        setIsGenerating(false)
        setPrompt("")
        setStages([])
      }, 1500)

    } catch (err) {
      console.error("AI 生成错误:", err)
      setError(err instanceof Error ? err.message : "生成失败，请重试")
      setStages(prev => prev.map(s =>
        s.status === "running" ? { ...s, status: "error" } : s
      ))
      setIsGenerating(false)
    }
  }

  const updateStageStatus = (stageId: string, status: GenerationStage["status"], message?: string) => {
    setStages(prev => prev.map(s =>
      s.id === stageId ? { ...s, status, message } : s
    ))
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span>AI 智能助手</span>
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="ai-prompt" className="text-sm font-medium">
                描述你的报价器需求
              </Label>
              <Textarea
                id="ai-prompt"
                placeholder="例如：帮我设计一个车险报价器，需要车龄、驾龄、出险记录字段，根据职业类别和年龄段设置不同费率..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">快速模板</Label>
              <div className="flex flex-wrap gap-2">
                {PROMPT_TEMPLATES.map((template) => (
                  <Button
                    key={template.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setPrompt(template.prompt)}
                    disabled={isGenerating}
                    className="text-xs"
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">AI 模型</Label>
              <RadioGroup
                value={selectedAgent}
                onValueChange={(value) => setSelectedAgent(value as AgentType)}
                disabled={isGenerating}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="auto" />
                  <Label htmlFor="auto" className="font-normal cursor-pointer">自动选择</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gpt4" id="gpt4" />
                  <Label htmlFor="gpt4" className="font-normal cursor-pointer">GPT-4</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="claude" id="claude" />
                  <Label htmlFor="claude" className="font-normal cursor-pointer">Claude</Label>
                </div>
              </RadioGroup>
            </div>

            {stages.length > 0 && (
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <Label className="text-sm font-medium">生成进度</Label>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {stages.map((stage) => (
                      <div key={stage.id} className="flex items-start gap-2">
                        {stage.status === "pending" && (
                          <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        {stage.status === "running" && (
                          <Loader2 className="h-4 w-4 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
                        )}
                        {stage.status === "completed" && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        )}
                        {stage.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{stage.label}</p>
                          {stage.message && (
                            <p className="text-xs text-muted-foreground">{stage.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={startGeneration}
                disabled={!prompt.trim() || isGenerating}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成报价器
                  </>
                )}
              </Button>
              {isGenerating && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsGenerating(false)
                    setStages([])
                    setError(null)
                  }}
                >
                  取消
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
