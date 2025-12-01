"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, GripVertical, Settings2 } from "lucide-react"
import { useQuoterStore } from "@/lib/quoter-store"
import { CoefficientTableEditor } from "./coefficient-table-editor"
import { FormulaEditor } from "./formula-editor"
import type { FormField, FieldType, CoefficientTable } from "@/lib/types"

export function ExcelEditor() {
  const { config, updateField, addField, removeField, addCoefficientTable, removeCoefficientTable } = useQuoterStore()
  const [activeTab, setActiveTab] = useState("fields")
  const [editingField, setEditingField] = useState<string | null>(null)
  const [addTableOpen, setAddTableOpen] = useState(false)
  const [newTable, setNewTable] = useState<Partial<CoefficientTable>>({
    id: "",
    name: "",
    description: "",
    rowKeyName: "行键",
    colKeyName: "列键",
    data: {},
  })

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: "radio", label: "单选按钮" },
    { value: "select", label: "下拉选择" },
    { value: "number", label: "数字输入" },
    { value: "text", label: "文本输入" },
  ]

  const handleAddField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      name: "新字段",
      label: "新字段",
      type: "text",
      required: false,
      defaultValue: "",
    }
    addField(newField)
  }

  const handleAddTable = () => {
    if (newTable.id && newTable.name) {
      addCoefficientTable({
        id: newTable.id,
        name: newTable.name,
        description: newTable.description || "",
        rowKeyName: newTable.rowKeyName || "行键",
        colKeyName: newTable.colKeyName || "列键",
        data: { default: { default: 0 } },
      })
      setNewTable({
        id: "",
        name: "",
        description: "",
        rowKeyName: "行键",
        colKeyName: "列键",
        data: {},
      })
      setAddTableOpen(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex-shrink-0 flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-foreground">配置编辑器</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col min-h-0">
        <TabsList className="flex-shrink-0 mx-4 mt-3 grid w-[calc(100%-2rem)] grid-cols-3">
          <TabsTrigger value="fields">表单字段</TabsTrigger>
          <TabsTrigger value="coefficients">系数表</TabsTrigger>
          <TabsTrigger value="formulas">计算公式</TabsTrigger>
        </TabsList>

        {/* 表单字段标签页 */}
        <TabsContent value="fields" className="flex-1 min-h-0 overflow-y-auto px-4 py-4 mt-0">
          <div className="space-y-2">
            <div className="flex justify-end mb-2">
              <Button size="sm" variant="outline" onClick={handleAddField}>
                <Plus className="mr-1 h-4 w-4" />
                添加字段
              </Button>
            </div>
            {config.fields.map((field) => (
              <Card key={field.id} className="border border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="font-medium text-sm">{field.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {fieldTypes.find((t) => t.value === field.type)?.label}
                    </Badge>
                    {field.required && (
                      <Badge variant="destructive" className="text-xs">
                        必填
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      ${field.id}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingField(editingField === field.id ? null : field.id)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                {editingField === field.id && (
                  <CardContent className="border-t border-border pt-3 pb-3 px-3">
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">字段ID (用于公式引用)</Label>
                          <Input
                            value={field.id}
                            className="h-8 text-sm font-mono"
                            onChange={(e) => updateField(field.id, { id: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">标签名称</Label>
                          <Input
                            value={field.label}
                            className="h-8 text-sm"
                            onChange={(e) => updateField(field.id, { label: e.target.value, name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">字段类型</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value: FieldType) => updateField(field.id, { type: value })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">默认值</Label>
                          <Input
                            value={String(field.defaultValue ?? "")}
                            className="h-8 text-sm"
                            onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
                          />
                        </div>
                      </div>

                      {field.type === "number" && (
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">最小值</Label>
                            <Input
                              type="number"
                              value={field.min ?? ""}
                              className="h-8 text-sm"
                              onChange={(e) => updateField(field.id, { min: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">最大值</Label>
                            <Input
                              type="number"
                              value={field.max ?? ""}
                              className="h-8 text-sm"
                              onChange={(e) => updateField(field.id, { max: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">后缀</Label>
                            <Input
                              value={field.suffix ?? ""}
                              className="h-8 text-sm"
                              onChange={(e) => updateField(field.id, { suffix: e.target.value })}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                          />
                          <Label className="text-xs">必填字段</Label>
                        </div>
                      </div>

                      {(field.type === "select" || field.type === "radio") && (
                        <div className="space-y-1">
                          <Label className="text-xs">选项列表（每行一个，格式：标签|值）</Label>
                          <Textarea
                            className="text-sm font-mono"
                            rows={3}
                            value={field.options?.map((o) => `${o.label}|${o.value}`).join("\n") ?? ""}
                            onChange={(e) => {
                              const options = e.target.value.split("\n").map((line) => {
                                const [label, value] = line.split("|")
                                return { label: label || "", value: value || label || "" }
                              })
                              updateField(field.id, { options })
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 系数表标签页 */}
        <TabsContent value="coefficients" className="flex-1 min-h-0 overflow-y-auto px-4 py-4 mt-0">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={addTableOpen} onOpenChange={setAddTableOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="mr-1 h-4 w-4" />
                    添加系数表
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加新系数表</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">表ID (用于公式引用)</Label>
                        <Input
                          value={newTable.id}
                          className="h-8 text-sm font-mono"
                          placeholder="如: rateTable"
                          onChange={(e) => setNewTable({ ...newTable, id: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">表名称</Label>
                        <Input
                          value={newTable.name}
                          className="h-8 text-sm"
                          placeholder="如: 费率表"
                          onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">说明</Label>
                      <Input
                        value={newTable.description}
                        className="h-8 text-sm"
                        onChange={(e) => setNewTable({ ...newTable, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">行键名称</Label>
                        <Input
                          value={newTable.rowKeyName}
                          className="h-8 text-sm"
                          placeholder="如: 年龄"
                          onChange={(e) => setNewTable({ ...newTable, rowKeyName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">列键名称</Label>
                        <Input
                          value={newTable.colKeyName}
                          className="h-8 text-sm"
                          placeholder="如: 性别"
                          onChange={(e) => setNewTable({ ...newTable, colKeyName: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddTable} className="w-full">
                      添加系数表
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {config.coefficientTables.map((table) => (
              <Card key={table.id}>
                <CardHeader className="py-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {table.name}
                      <Badge variant="outline" className="text-xs font-mono">
                        LOOKUP({table.id}, ...)
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{table.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeCoefficientTable(table.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pb-3">
                  <CoefficientTableEditor table={table} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 计算公式标签页 */}
        <TabsContent value="formulas" className="flex-1 min-h-0 overflow-y-auto px-4 py-4 mt-0">
          <FormulaEditor />
        </TabsContent>
      </Tabs>
    </div>
  )
}
