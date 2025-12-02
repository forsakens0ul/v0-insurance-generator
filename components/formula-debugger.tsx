"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Bug, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Play } from "lucide-react"
import { useQuoterStore } from "@/lib/quoter-store"
import { calculateFormula } from "@/lib/formula-engine"

interface DebugStep {
  formula: {
    id: string
    name: string
    expression: string
  }
  status: "success" | "error" | "pending"
  result?: number
  error?: string
  dependencies: {
    fieldId: string
    value: any
    resolved: boolean
  }[]
  steps: {
    original: string
    substituted: string
    evaluated: string
  }
}

export function FormulaDebugger() {
  const { config, formValues, calculatedValues } = useQuoterStore()
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([])
  const [expandedFormulas, setExpandedFormulas] = useState<Set<string>>(new Set())

  const toggleFormula = (formulaId: string) => {
    const newExpanded = new Set(expandedFormulas)
    if (newExpanded.has(formulaId)) {
      newExpanded.delete(formulaId)
    } else {
      newExpanded.add(formulaId)
    }
    setExpandedFormulas(newExpanded)
  }

  const runDebugger = () => {
    setIsDebugging(true)
    const steps: DebugStep[] = []

    const results: Record<string, number> = {}
    const processed = new Set<string>()

    const processFormula = (formula: any): DebugStep => {
      const dependencies: DebugStep["dependencies"] = []

      formula.dependencies.forEach((depId: string) => {
        if (depId.startsWith("$")) {
          return
        }

        const fieldId = depId.replace(/^[@$]/, "")
        const field = config.fields.find((f) => f.id === fieldId)

        if (field) {
          dependencies.push({
            fieldId: field.label,
            value: formValues[fieldId],
            resolved: formValues[fieldId] !== undefined,
          })
        }

        const depFormula = config.formulas.find((f) => f.id === fieldId)
        if (depFormula && !processed.has(fieldId)) {
          const depStep = processFormula(depFormula)
          steps.push(depStep)
          processed.add(fieldId)
          if (depStep.status === "success" && depStep.result !== undefined) {
            results[fieldId] = depStep.result
          }
        }
      })

      try {
        let substituted = formula.expression

        substituted = substituted.replace(/\$(\w+)/g, (_: string, fieldId: string) => {
          const value = formValues[fieldId]
          return typeof value === "string" ? `"${value}"` : String(value ?? 0)
        })

        substituted = substituted.replace(/@(\w+)/g, (_: string, formulaId: string) => {
          return String(results[formulaId] ?? calculatedValues[formulaId] ?? 0)
        })

        substituted = substituted.replace(
          /LOOKUP\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi,
          (_, tableId, rowKey, colKey) => {
            const table = config.coefficientTables.find((t) => t.id === tableId)
            if (!table) return "0"

            try {
              const rowKeyEval = eval(rowKey.trim())
              const colKeyEval = eval(colKey.trim())

              const rowData = table.data[String(rowKeyEval)]
              if (!rowData) return "0"

              if (String(colKeyEval) in rowData) {
                return String(rowData[String(colKeyEval)])
              }

              const numColKey = Number(colKeyEval)
              if (!isNaN(numColKey)) {
                const numericKeys = Object.keys(rowData)
                  .map(Number)
                  .filter((k) => !isNaN(k))
                  .sort((a, b) => a - b)

                let closestKey: number | undefined
                for (const key of numericKeys) {
                  if (key <= numColKey) {
                    closestKey = key
                  }
                }

                if (closestKey !== undefined) {
                  return String(rowData[String(closestKey)])
                }
              }

              return "0"
            } catch {
              return "0"
            }
          }
        )

        const jsExpr = substituted
          .replace(/ROUND\s*\(/gi, "Math.round((")
          .replace(/FLOOR\s*\(/gi, "Math.floor(")
          .replace(/CEIL\s*\(/gi, "Math.ceil(")
          .replace(/ABS\s*\(/gi, "Math.abs(")
          .replace(/MIN\s*\(/gi, "Math.min(")
          .replace(/MAX\s*\(/gi, "Math.max(")
          .replace(/IF\s*\(/gi, "(")
          .replace(/===/g, "===")
          .replace(/==/g, "===")
          .replace(/!=/g, "!==")

        const correctedExpr = jsExpr.replace(/Math\.round\(\(([^)]+)\),\s*(\d+)\)/g, (_, expr, decimals) => {
          return `(Math.round((${expr}) * Math.pow(10, ${decimals})) / Math.pow(10, ${decimals}))`
        })

        const result = eval(correctedExpr)
        results[formula.id] = result

        return {
          formula: {
            id: formula.id,
            name: formula.name,
            expression: formula.expression,
          },
          status: "success",
          result,
          dependencies,
          steps: {
            original: formula.expression,
            substituted: substituted,
            evaluated: correctedExpr,
          },
        }
      } catch (error) {
        return {
          formula: {
            id: formula.id,
            name: formula.name,
            expression: formula.expression,
          },
          status: "error",
          error: error instanceof Error ? error.message : "计算错误",
          dependencies,
          steps: {
            original: formula.expression,
            substituted: "替换失败",
            evaluated: "无法求值",
          },
        }
      }
    }

    config.formulas.forEach((formula) => {
      if (!processed.has(formula.id)) {
        const step = processFormula(formula)
        steps.push(step)
        processed.add(formula.id)
      }
    })

    setDebugSteps(steps)
    setExpandedFormulas(new Set(steps.map((s) => s.formula.id)))
    setTimeout(() => setIsDebugging(false), 500)
  }

  return (
    <Card className="w-[450px] border-l border-border bg-card flex flex-col h-full">
      <CardHeader className="border-b border-border px-4 py-3 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-base font-semibold">公式调试器</CardTitle>
        </div>
        <Button size="sm" onClick={runDebugger} disabled={isDebugging}>
          {isDebugging ? (
            <>正在调试...</>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1" />
              运行
            </>
          )}
        </Button>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-4 space-y-2">
          {debugSteps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bug className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">点击"运行"开始调试公式</p>
              <p className="text-xs mt-1">查看每个公式的计算过程和结果</p>
            </div>
          ) : (
            debugSteps.map((step, index) => (
              <Collapsible
                key={step.formula.id}
                open={expandedFormulas.has(step.formula.id)}
                onOpenChange={() => toggleFormula(step.formula.id)}
              >
                <CollapsibleTrigger asChild>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {expandedFormulas.has(step.formula.id) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">#{index + 1}</span>
                              <h4 className="font-medium text-sm truncate">{step.formula.name}</h4>
                            </div>
                            {step.status === "success" && step.result !== undefined && (
                              <p className="text-sm font-mono text-primary">
                                结果: {step.result.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        {step.status === "success" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-2 ml-6 space-y-3 p-3 bg-muted/30 rounded-lg border">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">1. 原始公式</p>
                      <code className="text-xs font-mono bg-card p-2 rounded block break-all">
                        {step.steps.original}
                      </code>
                    </div>

                    {step.dependencies.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">2. 依赖值</p>
                        <div className="space-y-1">
                          {step.dependencies.map((dep, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center text-xs bg-card p-2 rounded"
                            >
                              <span className="text-muted-foreground">{dep.fieldId}:</span>
                              <Badge variant={dep.resolved ? "default" : "destructive"} className="text-xs">
                                {String(dep.value)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">3. 替换后</p>
                      <code className="text-xs font-mono bg-card p-2 rounded block break-all">
                        {step.steps.substituted}
                      </code>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">4. JavaScript 表达式</p>
                      <code className="text-xs font-mono bg-card p-2 rounded block break-all">
                        {step.steps.evaluated}
                      </code>
                    </div>

                    {step.error && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-xs text-red-700 font-medium">错误：{step.error}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  )
}
