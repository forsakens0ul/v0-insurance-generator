"use client"

import { useState } from "react"
import { FormField } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { useQuoterStore } from "@/lib/quoter-store"
import { cn } from "@/lib/utils"

interface ArrayFieldEditorProps {
  field: FormField
  value: any[]
  onChange: (value: any[]) => void
}

// 六种不同的背景颜色主题
const colorThemes = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", label: "bg-blue-100" },
  { bg: "bg-green-50", border: "border-green-200", text: "text-green-900", label: "bg-green-100" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-900", label: "bg-purple-100" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-900", label: "bg-orange-100" },
  { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-900", label: "bg-pink-100" },
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-900", label: "bg-teal-100" },
]

export function ArrayFieldEditor({ field, value = [], onChange }: ArrayFieldEditorProps) {
  const { arrayConfig } = field
  const { calculatedValues, config } = useQuoterStore()
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({})

  if (!arrayConfig) {
    return <div className="text-red-500">Array配置缺失</div>
  }

  const { minItems, maxItems, itemFields } = arrayConfig

  // 将字段分组
  const basicFields = itemFields.filter(f =>
    ['occupation', 'peopleCount', 'accidentAmount', 'medicalAmount', 'hospitalAllowance'].includes(f.id)
  )
  const additionalFields = itemFields.filter(f =>
    ['drivingAmount', 'busAmount', 'railAmount', 'shipAmount', 'flightAmount', 'ambulanceFee'].includes(f.id)
  )

  // 获取显示在结果中的数组公式
  const resultFormulas = config.formulas.filter(f => f.showInResult && f.arrayFormula)

  const addItem = () => {
    if (value.length >= maxItems) return

    const newItem: any = {}
    itemFields.forEach((itemField) => {
      newItem[itemField.id] = itemField.defaultValue ?? ""
    })
    onChange([...value, newItem])
  }

  const removeItem = (index: number) => {
    if (value.length <= minItems) return
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }

  const updateItem = (index: number, fieldId: string, fieldValue: any) => {
    const newValue = [...value]
    newValue[index] = { ...newValue[index], [fieldId]: fieldValue }
    onChange(newValue)
  }

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const renderField = (itemField: FormField, itemValue: any, index: number) => {
    const fieldValue = itemValue[itemField.id] ?? itemField.defaultValue ?? ""

    switch (itemField.type) {
      case "text":
        return (
          <Input
            type="text"
            value={fieldValue}
            onChange={(e) => updateItem(index, itemField.id, e.target.value)}
            placeholder={itemField.label}
          />
        )

      case "number":
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={fieldValue}
              onChange={(e) => updateItem(index, itemField.id, parseFloat(e.target.value) || 0)}
              min={itemField.min}
              max={itemField.max}
              placeholder={itemField.label}
              className="flex-1"
            />
            {itemField.suffix && <span className="text-sm text-muted-foreground">{itemField.suffix}</span>}
          </div>
        )

      case "select":
        return (
          <Select
            value={String(fieldValue)}
            onValueChange={(val) => {
              const option = itemField.options?.find((o) => String(o.value) === val)
              updateItem(index, itemField.id, option?.value ?? val)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={`选择${itemField.label}`} />
            </SelectTrigger>
            <SelectContent>
              {itemField.options?.map((option) => (
                <SelectItem key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "radio":
        return (
          <RadioGroup
            value={String(fieldValue)}
            onValueChange={(val) => {
              const option = itemField.options?.find((o) => String(o.value) === val)
              updateItem(index, itemField.id, option?.value ?? val)
            }}
          >
            <div className="flex gap-4">
              {itemField.options?.map((option) => (
                <div key={String(option.value)} className="flex items-center space-x-2">
                  <RadioGroupItem value={String(option.value)} id={`${itemField.id}-${index}-${option.value}`} />
                  <Label htmlFor={`${itemField.id}-${index}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )

      default:
        return <div className="text-sm text-muted-foreground">不支持的字段类型</div>
    }
  }

  // 获取职业类别的标签
  const getOccupationLabel = (item: any) => {
    const occupationField = itemFields.find(f => f.id === 'occupation')
    const option = occupationField?.options?.find(o => o.value === item.occupation)
    return option?.label || '未选择'
  }

  return (
    <div className="space-y-3">
      {value.map((item, index) => {
        const theme = colorThemes[index % colorThemes.length]
        const isOpen = openItems[index] !== false // 默认展开
        const occupationLabel = getOccupationLabel(item)

        return (
          <Card key={index} className={cn("border-2 overflow-hidden", theme.border)}>
            {/* 顶部标题栏 */}
            <CardHeader className={cn("py-3 px-4 cursor-pointer", theme.bg)} onClick={() => toggleItem(index)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  <CardTitle className="text-base font-semibold">
                    职业类别 #{index + 1} - {occupationLabel}
                  </CardTitle>
                  <span className={cn("text-xs px-2 py-1 rounded font-medium", theme.label)}>
                    {item.peopleCount || 0}人
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {value.length > minItems && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(index)
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {/* 内容区 */}
            {isOpen && (
              <CardContent className="p-0">
                <div className="space-y-0">
                  {/* 基础保额信息 */}
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 hover:bg-muted transition-colors">
                        <span className="text-sm font-medium">基础保额信息</span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        {basicFields.map((itemField) => (
                          <div key={itemField.id} className="space-y-1.5">
                            <Label className="text-xs font-medium">
                              {itemField.label}
                              {itemField.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {renderField(itemField, item, index)}
                            {itemField.tooltip && (
                              <p className="text-xs text-muted-foreground">{itemField.tooltip}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* 附加保额信息 */}
                  <Collapsible>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors border-t">
                        <span className="text-sm font-medium">附加保额信息</span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        {additionalFields.map((itemField) => (
                          <div key={itemField.id} className="space-y-1.5">
                            <Label className="text-xs font-medium">
                              {itemField.label}
                              {itemField.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {renderField(itemField, item, index)}
                            {itemField.tooltip && (
                              <p className="text-xs text-muted-foreground">{itemField.tooltip}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* 类别计算结果 */}
                  <Collapsible defaultOpen>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 hover:bg-muted transition-colors border-t">
                        <span className="text-sm font-medium">类别计算结果</span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 space-y-2">
                        {resultFormulas.map((formula) => {
                          const results = calculatedValues[formula.id]
                          const result = Array.isArray(results) ? results[index] : 0

                          return (
                            <div key={formula.id} className="flex justify-between items-center py-1">
                              <span className="text-sm text-muted-foreground">{formula.name}</span>
                              <span className="text-sm font-semibold text-primary">
                                {typeof result === 'number' ? result.toFixed(2) : '0.00'} {formula.unit}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}

      {value.length < maxItems && (
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          className="w-full border-dashed border-2 h-12 hover:bg-muted"
        >
          <Plus className="mr-2 h-4 w-4" />
          添加其他职业类别（{value.length}/{maxItems}）
        </Button>
      )}

      {value.length < minItems && (
        <p className="text-xs text-amber-600">
          至少需要 {minItems} 项配置
        </p>
      )}
    </div>
  )
}
