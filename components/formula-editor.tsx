"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Info, ChevronDown, ChevronRight, Sparkles, Loader2 } from "lucide-react"
import { useQuoterStore } from "@/lib/quoter-store"
import type { Formula } from "@/lib/types"

export function FormulaEditor() {
  const { config, calculatedValues, updateFormula, addFormula, removeFormula } = useQuoterStore()
  const [expandedFormula, setExpandedFormula] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiDescription, setAiDescription] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")
  const [currentEditingFormulaId, setCurrentEditingFormulaId] = useState<string | null>(null)
  const [newFormula, setNewFormula] = useState<Partial<Formula>>({
    id: "",
    name: "",
    description: "",
    expression: "",
    dependencies: [],
    showInResult: true,
    unit: "元",
    arrayFormula: false,
  })

  const handleAddFormula = () => {
    if (newFormula.id && newFormula.name && newFormula.expression) {
      addFormula({
        id: newFormula.id,
        name: newFormula.name,
        description: newFormula.description || "",
        expression: newFormula.expression,
        dependencies: extractDependencies(newFormula.expression),
        showInResult: newFormula.showInResult ?? true,
        unit: newFormula.unit,
        arrayFormula: newFormula.arrayFormula,
      })
      setNewFormula({
        id: "",
        name: "",
        description: "",
        expression: "",
        dependencies: [],
        showInResult: true,
        unit: "元",
        arrayFormula: false,
      })
      setAddDialogOpen(false)
    }
  }

  // 从表达式中提取依赖
  const extractDependencies = (expression: string): string[] => {
    const deps: string[] = []
    // 提取字段依赖 ($fieldId)
    const fieldMatches = expression.match(/\$(\w+)/g)
    if (fieldMatches) {
      deps.push(...fieldMatches.map((m) => m.slice(1)))
    }
    // 提取公式依赖 (@formulaId)
    const formulaMatches = expression.match(/@(\w+)/g)
    if (formulaMatches) {
      deps.push(...formulaMatches.map((m) => m.slice(1)))
    }
    return [...new Set(deps)]
  }

  const handleExpressionChange = (formulaId: string, expression: string) => {
    updateFormula(formulaId, {
      expression,
      dependencies: extractDependencies(expression),
    })
  }

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) {
      setAiError("请输入计算逻辑描述")
      return
    }

    setAiLoading(true)
    setAiError("")

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase 配置缺失")
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-formula-generator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          description: aiDescription,
          availableFields: config.fields.map(f => ({
            id: f.id,
            label: f.label,
            type: f.type,
          })),
          availableTables: config.coefficientTables.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
          })),
          availableFormulas: config.formulas.map(f => ({
            id: f.id,
            name: f.name,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "AI 生成失败")
      }

      const result = await response.json()

      if (currentEditingFormulaId) {
        // 如果是编辑现有公式
        handleExpressionChange(currentEditingFormulaId, result.formula)
        const formula = config.formulas.find(f => f.id === currentEditingFormulaId)
        if (formula && result.explanation) {
          updateFormula(currentEditingFormulaId, { description: result.explanation })
        }
      } else {
        // 如果是添加新公式
        setNewFormula({
          ...newFormula,
          expression: result.formula,
          description: result.explanation || "",
        })
      }

      setAiDialogOpen(false)
      setAiDescription("")
    } catch (error) {
      console.error("AI 生成错误:", error)
      setAiError(error instanceof Error ? error.message : "生成失败，请重试")
    } finally {
      setAiLoading(false)
    }
  }

  const openAiDialog = (formulaId?: string) => {
    setCurrentEditingFormulaId(formulaId || null)
    setAiDescription("")
    setAiError("")
    setAiDialogOpen(true)
  }

  return (
    <div className="space-y-3">
      {/* 公式语法说明 */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>公式语法说明:</strong>
              </p>
              <p>
                <code className="bg-muted px-1 rounded">$fieldId</code> - 引用表单字段值，如{" "}
                <code className="bg-muted px-1 rounded">$age</code>
              </p>
              <p>
                <code className="bg-muted px-1 rounded">@formulaId</code> - 引用其他公式结果，如{" "}
                <code className="bg-muted px-1 rounded">@mainPremium</code>
              </p>
              <p>
                <code className="bg-muted px-1 rounded">LOOKUP(tableId, rowKey, colKey)</code> - 查询系数表
              </p>
              <p>
                <code className="bg-muted px-1 rounded">ROUND(value, decimals)</code> - 四舍五入
              </p>
              <p>
                <code className="bg-muted px-1 rounded">IF(condition, trueVal, falseVal)</code> - 条件判断
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 公式列表 */}
      {config.formulas.map((formula) => {
        const isExpanded = expandedFormula === formula.id
        const calculatedValue = calculatedValues[formula.id]

        return (
          <Card key={formula.id} className="border">
            <CardHeader
              className="py-2 px-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedFormula(isExpanded ? null : formula.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium text-sm">{formula.name}</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {formula.id}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {calculatedValue !== undefined && (
                    <span className="text-sm font-medium text-primary">
                      = {Array.isArray(calculatedValue)
                          ? `[${calculatedValue.length}项]`
                          : `${calculatedValue.toFixed(2)} ${formula.unit}`}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFormula(formula.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="border-t pt-3 pb-3 px-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">公式ID</Label>
                    <Input
                      value={formula.id}
                      className="h-8 text-sm font-mono"
                      onChange={(e) => updateFormula(formula.id, { id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">公式名称</Label>
                    <Input
                      value={formula.name}
                      className="h-8 text-sm"
                      onChange={(e) => updateFormula(formula.id, { name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">说明</Label>
                  <Input
                    value={formula.description}
                    className="h-8 text-sm"
                    onChange={(e) => updateFormula(formula.id, { description: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">计算表达式</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs gap-1"
                      onClick={() => openAiDialog(formula.id)}
                    >
                      <Sparkles className="h-3 w-3" />
                      AI生成
                    </Button>
                  </div>
                  <Textarea
                    className="text-sm font-mono min-h-[60px]"
                    value={formula.expression}
                    onChange={(e) => handleExpressionChange(formula.id, e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-xs text-muted-foreground mr-1">依赖:</span>
                  {formula.dependencies.map((dep) => (
                    <Badge key={dep} variant="secondary" className="text-xs">
                      {config.fields.find((f) => f.id === dep)?.label ||
                        config.formulas.find((f) => f.id === dep)?.name ||
                        dep}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formula.showInResult}
                        onCheckedChange={(checked) => updateFormula(formula.id, { showInResult: checked })}
                      />
                      <Label className="text-xs">显示在结果区域</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">单位:</Label>
                      <Input
                        value={formula.unit || ""}
                        className="h-7 w-16 text-xs"
                        onChange={(e) => updateFormula(formula.id, { unit: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formula.arrayFormula || false}
                      onCheckedChange={(checked) => updateFormula(formula.id, { arrayFormula: checked })}
                    />
                    <Label className="text-xs">数组公式（对每个数组项执行）</Label>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      {/* 添加公式按钮 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full h-9 border-dashed bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            添加计算公式
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新公式</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">公式ID</Label>
                <Input
                  value={newFormula.id}
                  className="h-8 text-sm font-mono"
                  placeholder="如: customPremium"
                  onChange={(e) => setNewFormula({ ...newFormula, id: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">公式名称</Label>
                <Input
                  value={newFormula.name}
                  className="h-8 text-sm"
                  placeholder="如: 自定义保费"
                  onChange={(e) => setNewFormula({ ...newFormula, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">说明</Label>
              <Input
                value={newFormula.description}
                className="h-8 text-sm"
                placeholder="计算逻辑说明"
                onChange={(e) => setNewFormula({ ...newFormula, description: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">计算表达式</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs gap-1"
                  onClick={() => openAiDialog()}
                >
                  <Sparkles className="h-3 w-3" />
                  AI生成
                </Button>
              </div>
              <Textarea
                className="text-sm font-mono"
                rows={3}
                placeholder="如: ROUND($amount * LOOKUP(rateTable, $type, $age), 2)"
                value={newFormula.expression}
                onChange={(e) => setNewFormula({ ...newFormula, expression: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={newFormula.showInResult}
                    onCheckedChange={(checked) => setNewFormula({ ...newFormula, showInResult: checked })}
                  />
                  <Label className="text-xs">显示在结果区域</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">单位:</Label>
                  <Input
                    value={newFormula.unit || ""}
                    className="h-7 w-20 text-xs"
                    onChange={(e) => setNewFormula({ ...newFormula, unit: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newFormula.arrayFormula || false}
                  onCheckedChange={(checked) => setNewFormula({ ...newFormula, arrayFormula: checked })}
                />
                <Label className="text-xs">数组公式（对每个数组项执行）</Label>
              </div>
            </div>

            <Button onClick={handleAddFormula} className="w-full">
              添加公式
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI 公式生成对话框 */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 智能公式生成器
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <p className="mb-2 font-medium text-foreground">💡 使用示例：</p>
              <ul className="space-y-1 text-xs">
                <li>• "30岁以下按年龄乘以100，30岁以上打9折"</li>
                <li>• "查询年龄系数表，用年龄乘以系数再乘以保额"</li>
                <li>• "主险保费加上医疗保费，结果四舍五入保留2位小数"</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">描述您的计算逻辑</Label>
              <Textarea
                className="min-h-[100px] text-sm"
                placeholder="请用自然语言描述您想要的计算逻辑..."
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                disabled={aiLoading}
              />
            </div>

            {aiError && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                {aiError}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setAiDialogOpen(false)}
                variant="outline"
                className="flex-1"
                disabled={aiLoading}
              >
                取消
              </Button>
              <Button
                onClick={handleAiGenerate}
                className="flex-1 gap-2"
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    生成公式
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
