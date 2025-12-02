"use client"

import { FormField } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Trash2 } from "lucide-react"

interface ArrayFieldEditorProps {
  field: FormField
  value: any[]
  onChange: (value: any[]) => void
}

export function ArrayFieldEditor({ field, value = [], onChange }: ArrayFieldEditorProps) {
  const { arrayConfig } = field

  if (!arrayConfig) {
    return <div className="text-red-500">Array配置缺失</div>
  }

  const { minItems, maxItems, itemFields } = arrayConfig

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

  return (
    <div className="space-y-3">
      {value.map((item, index) => (
        <Card key={index} className="p-4 relative">
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
              #{index + 1}
            </span>
            {value.length > minItems && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 pr-20">
            {itemFields.map((itemField) => (
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
        </Card>
      ))}

      {value.length < maxItems && (
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          className="w-full border-dashed"
        >
          <Plus className="mr-2 h-4 w-4" />
          添加{field.name}（{value.length}/{maxItems}）
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
