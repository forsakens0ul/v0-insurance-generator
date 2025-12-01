"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { useQuoterStore } from "@/lib/quoter-store"

export function QuoterPreview() {
  const { config, formValues, calculatedValues, setFormValue, calculate } = useQuoterStore()

  useEffect(() => {
    calculate()
  }, [formValues, calculate])

  const renderField = (field: (typeof config.fields)[0]) => {
    const value = formValues[field.id]

    switch (field.type) {
      case "radio":
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {field.required && <span className="text-red-500 mr-1">*</span>}
              {field.label}
            </Label>
            <RadioGroup value={String(value)} onValueChange={(v) => setFormValue(field.id, v)} className="flex gap-4">
              {field.options?.map((option) => (
                <div key={String(option.value)} className="flex items-center gap-2">
                  <RadioGroupItem value={String(option.value)} id={`${field.id}-${option.value}`} />
                  <Label htmlFor={`${field.id}-${option.value}`} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case "select":
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {field.required && <span className="text-red-500 mr-1">*</span>}
              {field.label}
            </Label>
            <Select
              value={String(value)}
              onValueChange={(v) =>
                setFormValue(field.id, field.options?.find((o) => String(o.value) === v)?.value ?? v)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "number":
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {field.required && <span className="text-red-500 mr-1">*</span>}
              {field.label}
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={value ?? ""}
                min={field.min}
                max={field.max}
                onChange={(e) => setFormValue(field.id, Number(e.target.value))}
                className="pr-12"
              />
              {field.suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {field.suffix}
                </span>
              )}
            </div>
          </div>
        )

      case "text":
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {field.required && <span className="text-red-500 mr-1">*</span>}
              {field.label}
            </Label>
            <Input value={String(value ?? "")} onChange={(e) => setFormValue(field.id, e.target.value)} />
          </div>
        )

      default:
        return null
    }
  }

  const resultFormulas = config.formulas.filter((f) => f.showInResult)
  const totalFormula = config.formulas.find((f) => f.id === "totalPremium")

  return (
    <div className="flex h-full flex-col bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-6 text-white">
        <h1 className="text-lg font-bold text-center">{config.title}</h1>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-4 pb-24">
        <div className="space-y-4">
          {config.sections.map((section) => (
            <Collapsible key={section.id} defaultOpen>
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {section.fieldIds.map((fieldId) => {
                      const field = config.fields.find((f) => f.id === fieldId)
                      return field ? <div key={fieldId}>{renderField(field)}</div> : null
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}

          {/* Results Section - 动态显示 */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">计算结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resultFormulas
                .filter((f) => f.id !== "totalPremium")
                .map((formula) => (
                  <div key={formula.id} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{formula.name}</span>
                    <span className="text-sm font-medium text-primary">
                      {calculatedValues[formula.id]?.toFixed(2) ?? "0.00"} {formula.unit}
                    </span>
                  </div>
                ))}
              {totalFormula && (
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{totalFormula.name}</span>
                    <span className="text-lg font-bold text-orange-500">
                      {calculatedValues[totalFormula.id]?.toFixed(2) ?? "0.00"} {totalFormula.unit}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card flex items-center">
        <div className="flex-1 px-4 py-3">
          <span className="text-sm text-muted-foreground">总保费</span>
          <span className="ml-2 text-xl font-bold text-red-500">
            {calculatedValues.totalPremium?.toFixed(2) ?? "0.00"}
          </span>
          <span className="ml-1 text-sm text-muted-foreground">元</span>
        </div>
        <button className="h-full bg-primary px-6 py-3 text-primary-foreground font-medium">报价预览</button>
      </div>
    </div>
  )
}
