"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Download, Copy, Check, FileSpreadsheet, FileCode, FileText, FileType } from "lucide-react"
import { useQuoterStore } from "@/lib/quoter-store"
import { pdf } from "@react-pdf/renderer"
import { PDFQuotation } from "./pdf-quotation"

export function ExportPanel() {
  const { config, formValues, calculatedValues } = useQuoterStore()
  const [copiedType, setCopiedType] = useState<string | null>(null)

  const generateTSXCode = () => {
    // 生成系数表数据
    const coefficientTablesCode = config.coefficientTables
      .map((table) => {
        return `const ${table.id}Data: Record<string, Record<string, number>> = ${JSON.stringify(table.data, null, 2)};`
      })
      .join("\n\n")

    // 生成查找函数
    const lookupFunctionCode = `
// 系数表查找函数
function lookup(
  tableData: Record<string, Record<string, number>>,
  rowKey: string,
  colKey: string | number
): number {
  const rowData = tableData[rowKey];
  if (!rowData) return 0;
  
  const colKeyStr = String(colKey);
  if (colKeyStr in rowData) {
    return rowData[colKeyStr];
  }
  
  // 数值型列键的插值查找
  const numKey = Number(colKey);
  if (!isNaN(numKey)) {
    const numericKeys = Object.keys(rowData)
      .map(Number)
      .filter((k) => !isNaN(k))
      .sort((a, b) => a - b);
    
    let closestKey: number | undefined;
    for (const key of numericKeys) {
      if (key <= numKey) {
        closestKey = key;
      }
    }
    
    if (closestKey !== undefined) {
      return rowData[String(closestKey)];
    }
  }
  
  return 0;
}`

    // 生成表单字段的类型定义
    const formDataType = config.fields.map((f) => `  ${f.id}: ${f.type === "number" ? "number" : "string"};`).join("\n")

    // 生成计算函数
    const calculationCode = config.formulas
      .map((formula) => {
        // 转换公式表达式为 JavaScript 代码
        let jsExpr = formula.expression
        // 替换 LOOKUP 调用
        jsExpr = jsExpr.replace(
          /LOOKUP\s*$$\s*(\w+)\s*,\s*['"]?(\$?\w+)['"]?\s*,\s*['"]?(\$?\w+)['"]?\s*$$/g,
          (_, tableId, rowKey, colKey) => {
            const rowKeyJs = rowKey.startsWith("$") ? `data.${rowKey.slice(1)}` : `"${rowKey}"`
            const colKeyJs = colKey.startsWith("$") ? `data.${colKey.slice(1)}` : `"${colKey}"`
            return `lookup(${tableId}Data, String(${rowKeyJs}), ${colKeyJs})`
          },
        )
        // 替换字段引用
        jsExpr = jsExpr.replace(/\$(\w+)/g, "data.$1")
        // 替换公式引用
        jsExpr = jsExpr.replace(/@(\w+)/g, "results.$1")
        // 替换 ROUND 函数
        jsExpr = jsExpr.replace(
          /ROUND\s*$$\s*(.+?)\s*,\s*(\d+)\s*$$/g,
          "Math.round(($1) * Math.pow(10, $2)) / Math.pow(10, $2)",
        )

        return `  results.${formula.id} = ${jsExpr};`
      })
      .join("\n")

    // 生成默认值
    const defaultValues = config.fields
      .map((f) => {
        const val = f.defaultValue
        if (f.type === "array") {
          return `    ${f.id}: ${JSON.stringify(val ?? [])},`
        }
        if (typeof val === "string") return `    ${f.id}: "${val}",`
        return `    ${f.id}: ${val ?? 0},`
      })
      .join("\n")

    // 生成表单渲染代码
    const formFieldsCode = config.fields
      .map((field) => {
        if (field.type === "array") {
          return `
        {/* ${field.label} */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            ${field.required ? '<span className="text-red-500">*</span> ' : ""}${field.label}
          </label>
          <p className="text-sm text-gray-500">数组字段暂不支持导出代码生成</p>
        </div>`
        } else if (field.type === "radio") {
          return `
        {/* ${field.label} */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            ${field.required ? '<span className="text-red-500">*</span> ' : ""}${field.label}
          </label>
          <div className="flex gap-4">
            ${field.options
              ?.map(
                (opt) => `
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="${field.id}"
                value="${opt.value}"
                checked={formData.${field.id} === "${opt.value}"}
                onChange={(e) => setFormData({ ...formData, ${field.id}: e.target.value })}
                className="w-4 h-4"
              />
              ${opt.label}
            </label>`,
              )
              .join("")}
          </div>
        </div>`
        } else if (field.type === "select") {
          return `
        {/* ${field.label} */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            ${field.required ? '<span className="text-red-500">*</span> ' : ""}${field.label}
          </label>
          <select
            value={formData.${field.id}}
            onChange={(e) => setFormData({ ...formData, ${field.id}: ${field.options?.some((o) => typeof o.value === "number") ? "Number(e.target.value)" : "e.target.value"} })}
            className="w-full h-10 px-3 border rounded-md"
          >
            ${field.options?.map((opt) => `<option value="${opt.value}">${opt.label}</option>`).join("\n            ")}
          </select>
        </div>`
        } else if (field.type === "number") {
          return `
        {/* ${field.label} */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            ${field.required ? '<span className="text-red-500">*</span> ' : ""}${field.label}
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.${field.id}}
              ${field.min !== undefined ? `min={${field.min}}` : ""}
              ${field.max !== undefined ? `max={${field.max}}` : ""}
              onChange={(e) => setFormData({ ...formData, ${field.id}: Number(e.target.value) })}
              className="w-full h-10 px-3 border rounded-md ${field.suffix ? "pr-12" : ""}"
            />
            ${field.suffix ? `<span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">${field.suffix}</span>` : ""}
          </div>
        </div>`
        } else {
          return `
        {/* ${field.label} */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            ${field.required ? '<span className="text-red-500">*</span> ' : ""}${field.label}
          </label>
          <input
            type="text"
            value={formData.${field.id}}
            onChange={(e) => setFormData({ ...formData, ${field.id}: e.target.value })}
            className="w-full h-10 px-3 border rounded-md"
          />
        </div>`
        }
      })
      .join("\n")

    // 生成结果显示代码
    const resultDisplayCode = config.formulas
      .filter((f) => f.showInResult)
      .map((formula) => {
        const valueDisplay = formula.arrayFormula
          ? `Array.isArray(results.${formula.id}) ? '[' + results.${formula.id}.length + '项]' : (results.${formula.id}?.toFixed(2) ?? "0.00")`
          : `results.${formula.id}?.toFixed(2) ?? "0.00"`

        if (formula.id === "totalPremium") {
          return `
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">${formula.name}</span>
              <span className="text-xl font-bold text-red-500">
                {${valueDisplay}} ${formula.unit || ""}
              </span>
            </div>
          </div>`
        }
        return `
          <div className="flex justify-between items-center">
            <span className="text-gray-600">${formula.name}</span>
            <span className="font-medium text-blue-600">
              {${valueDisplay}} ${formula.unit || ""}
            </span>
          </div>`
      })
      .join("")

    return `"use client";
import React, { useState, useMemo } from 'react';

// ============ 系数表数据 ============
${coefficientTablesCode}

${lookupFunctionCode}

// ============ 类型定义 ============
interface FormData {
${formDataType}
}

interface CalculationResults {
${config.formulas.map((f) => `  ${f.id}: number;`).join("\n")}
}

// ============ 计算函数 ============
function calculatePremium(data: FormData): CalculationResults {
  const results: CalculationResults = {
${config.formulas.map((f) => `    ${f.id}: 0,`).join("\n")}
  };

${calculationCode}

  return results;
}

// ============ 主组件 ============
export default function ${config.id.replace(/[^a-zA-Z0-9]/g, "_")}Quoter() {
  const [formData, setFormData] = useState<FormData>({
${defaultValues}
  });

  const results = useMemo(() => calculatePremium(formData), [formData]);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-6 text-white">
        <h1 className="text-lg font-bold text-center">${config.title}</h1>
      </div>

      {/* 表单 */}
      <div className="p-4 space-y-4">
${formFieldsCode}

        {/* 计算结果 */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="font-medium text-sm mb-3">计算结果</h3>
${resultDisplayCode}
        </div>
      </div>

      {/* 底部栏 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t flex items-center">
        <div className="flex-1 px-4 py-3">
          <span className="text-gray-600">总保费</span>
          <span className="ml-2 text-xl font-bold text-red-500">
            {results.totalPremium?.toFixed(2) ?? "0.00"}
          </span>
          <span className="ml-1 text-gray-600">元</span>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 font-medium">
          报价预览
        </button>
      </div>
    </div>
  );
}`
  }

  const generateFormulasTXT = () => {
    let txt = `════════════════════════════════════════════════════════════════════\n`
    txt += `  ${config.name} - 计算逻辑说明文档\n`
    txt += `════════════════════════════════════════════════════════════════════\n`
    txt += `生成时间: ${new Date().toLocaleString()}\n\n`

    txt += `┌─────────────────────────────────────────────────────────────────┐\n`
    txt += `│  一、表单字段定义                                              │\n`
    txt += `└─────────────────────────────────────────────────────────────────┘\n\n`

    config.fields.forEach((f, index) => {
      txt += `${index + 1}. ${f.label}\n`
      txt += `   - 字段ID: ${f.id}\n`
      txt += `   - 引用方式: $${f.id}\n`
      txt += `   - 类型: ${f.type}\n`
      txt += `   - 必填: ${f.required ? "是" : "否"}\n`
      txt += `   - 默认值: ${typeof f.defaultValue === 'object' ? JSON.stringify(f.defaultValue) : f.defaultValue}\n`
      if (f.type === "number") {
        txt += `   - 范围: ${f.min ?? "无"} ~ ${f.max ?? "无"}\n`
        if (f.suffix) txt += `   - 单位: ${f.suffix}\n`
      }
      if (f.options) {
        txt += `   - 选项:\n`
        f.options.forEach((o) => {
          txt += `     • ${o.label} (值: ${o.value})\n`
        })
      }
      txt += `\n`
    })

    txt += `┌─────────────────────────────────────────────────────────────────┐\n`
    txt += `│  二、系数表定义                                                │\n`
    txt += `└─────────────────────────────────────────────────────────────────┘\n\n`

    config.coefficientTables.forEach((t, index) => {
      txt += `${index + 1}. ${t.name} (ID: ${t.id})\n`
      txt += `   说明: ${t.description}\n`
      txt += `   引用方式: LOOKUP(${t.id}, <${t.rowKeyName}>, <${t.colKeyName}>)\n\n`

      // 格式化表格输出
      const rowKeys = Object.keys(t.data)
      const colKeys = rowKeys.length > 0 ? Object.keys(t.data[rowKeys[0]]) : []

      if (rowKeys.length > 0 && colKeys.length > 0) {
        // 表头
        txt += `   ${t.rowKeyName.padEnd(12)} | ${colKeys.map((c) => c.padStart(8)).join(" | ")}\n`
        txt += `   ${"-".repeat(12)}-+-${colKeys.map(() => "-".repeat(8)).join("-+-")}\n`
        // 数据行
        rowKeys.slice(0, 10).forEach((rowKey) => {
          const values = colKeys.map((colKey) => (t.data[rowKey][colKey] ?? 0).toString().padStart(8))
          txt += `   ${rowKey.padEnd(12)} | ${values.join(" | ")}\n`
        })
        if (rowKeys.length > 10) {
          txt += `   ... (共 ${rowKeys.length} 行)\n`
        }
      }
      txt += `\n`
    })

    txt += `┌─────────────────────────────────────────────────────────────────┐\n`
    txt += `│  三、计算公式定义                                              │\n`
    txt += `└─────────────────────────────────────────────────────────────────┘\n\n`

    txt += `公式语法说明:\n`
    txt += `  • $fieldId    - 引用表单字段值\n`
    txt += `  • @formulaId  - 引用其他公式的计算结果\n`
    txt += `  • LOOKUP(tableId, rowKey, colKey) - 查询系数表\n`
    txt += `  • ROUND(value, decimals) - 四舍五入\n`
    txt += `  • IF(condition, trueVal, falseVal) - 条件判断\n\n`

    config.formulas.forEach((f, index) => {
      txt += `${index + 1}. ${f.name} (ID: ${f.id})\n`
      txt += `   说明: ${f.description}\n`
      txt += `   表达式: ${f.expression}\n`
      txt += `   依赖字段: ${f.dependencies.join(", ")}\n`
      txt += `   显示结果: ${f.showInResult ? "是" : "否"}\n`
      if (f.unit) txt += `   单位: ${f.unit}\n`
      txt += `\n`
    })

    txt += `┌─────────────────────────────────────────────────────────────────┐\n`
    txt += `│  四、当前计算结果示例                                          │\n`
    txt += `└─────────────────────────────────────────────────────────────────┘\n\n`

    txt += `输入值:\n`
    config.fields.forEach((f) => {
      const value = formValues[f.id]
      if (f.type === 'array') {
        txt += `  ${f.label}: [数组字段, ${Array.isArray(value) ? value.length : 0}项]\n`
      } else {
        const option = f.options?.find((o) => o.value === value)
        txt += `  ${f.label}: ${option?.label ?? value} ${f.suffix ?? ""}\n`
      }
    })

    txt += `\n计算结果:\n`
    config.formulas.forEach((f) => {
      const value = calculatedValues[f.id]
      if (Array.isArray(value)) {
        txt += `  ${f.name}: [数组结果, ${value.length}项]\n`
      } else {
        txt += `  ${f.name}: ${value?.toFixed(2) ?? "0.00"} ${f.unit ?? ""}\n`
      }
    })

    return txt
  }

  const generateExcelCSV = () => {
    let csv = "\uFEFF"

    // 字段配置表
    csv += "【表单字段配置】\n"
    csv += "字段ID,字段名称,字段类型,必填,默认值,最小值,最大值,后缀,选项\n"
    config.fields.forEach((f) => {
      const defaultVal = typeof f.defaultValue === 'object' ? JSON.stringify(f.defaultValue) : (f.defaultValue ?? "")
      csv += `${f.id},${f.label},${f.type},${f.required ? "是" : "否"},"${defaultVal}",${f.min ?? ""},${f.max ?? ""},${f.suffix ?? ""},"${f.options?.map((o) => `${o.label}:${o.value}`).join(";") ?? ""}"\n`
    })

    csv += "\n【计算公式配置】\n"
    csv += "公式ID,公式名称,描述,表达式,依赖字段,显示结果,单位\n"
    config.formulas.forEach((f) => {
      csv += `${f.id},${f.name},"${f.description}","${f.expression}","${f.dependencies.join(";")}",${f.showInResult ? "是" : "否"},${f.unit ?? ""}\n`
    })

    // 系数表
    config.coefficientTables.forEach((table) => {
      csv += `\n【系数表: ${table.name}】\n`
      csv += `表ID: ${table.id}\n`
      csv += `说明: ${table.description}\n`

      const rowKeys = Object.keys(table.data)
      const colKeys = rowKeys.length > 0 ? Object.keys(table.data[rowKeys[0]]) : []

      csv += `${table.rowKeyName},${colKeys.join(",")}\n`
      rowKeys.forEach((rowKey) => {
        const values = colKeys.map((colKey) => table.data[rowKey][colKey] ?? 0)
        csv += `${rowKey},${values.join(",")}\n`
      })
    })

    return csv
  }

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content)
    setCopiedType(type)
    setTimeout(() => setCopiedType(null), 2000)
  }

  const handleDownload = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPDF = async () => {
    const blob = await pdf(
      <PDFQuotation
        config={config}
        formValues={formValues}
        calculatedValues={calculatedValues}
      />
    ).toBlob()

    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${config.name}-报价单-${new Date().toLocaleDateString("zh-CN")}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const tsxCode = generateTSXCode()
  const formulasTxt = generateFormulasTXT()
  const excelCsv = generateExcelCSV()

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 border-b border-border">
        <CardTitle className="text-lg">导出</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs defaultValue="pdf" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-3 grid w-[calc(100%-2rem)] grid-cols-4">
            <TabsTrigger value="pdf" className="gap-1">
              <FileType className="h-3 w-3" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="tsx" className="gap-1">
              <FileCode className="h-3 w-3" />
              TSX
            </TabsTrigger>
            <TabsTrigger value="txt" className="gap-1">
              <FileText className="h-3 w-3" />
              TXT
            </TabsTrigger>
            <TabsTrigger value="excel" className="gap-1">
              <FileSpreadsheet className="h-3 w-3" />
              Excel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="flex-1 flex flex-col px-4 pb-4 mt-3">
            <div className="rounded-lg border border-border bg-muted/30 p-6 space-y-4">
              <div className="text-center space-y-2">
                <FileType className="h-12 w-12 mx-auto text-primary" />
                <h3 className="text-lg font-semibold">导出 PDF 报价单</h3>
                <p className="text-sm text-muted-foreground">
                  生成专业格式的 PDF 报价单文档，包含所有输入信息和计算结果
                </p>
              </div>
              <div className="bg-card rounded-lg p-4 space-y-2 border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">报价器名称：</span>
                  <span className="font-medium">{config.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">总保费：</span>
                  <span className="font-bold text-primary">
                    {calculatedValues.totalPremium?.toFixed(2) || "0.00"} 元
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">生成日期：</span>
                  <span className="font-medium">{new Date().toLocaleDateString("zh-CN")}</span>
                </div>
              </div>
              <Button className="w-full" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                下载 PDF 报价单
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="tsx" className="flex-1 flex flex-col px-4 pb-4 mt-3 overflow-hidden">
            <div className="flex gap-2 mb-2">
              <Button size="sm" variant="outline" onClick={() => handleCopy(tsxCode, "tsx")}>
                {copiedType === "tsx" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                复制
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(tsxCode, `${config.id}.tsx`, "text/typescript")}
              >
                <Download className="h-4 w-4 mr-1" />
                下载
              </Button>
            </div>
            <Textarea value={tsxCode} readOnly className="flex-1 font-mono text-xs resize-none" />
          </TabsContent>

          <TabsContent value="txt" className="flex-1 flex flex-col px-4 pb-4 mt-3 overflow-hidden">
            <div className="flex gap-2 mb-2">
              <Button size="sm" variant="outline" onClick={() => handleCopy(formulasTxt, "txt")}>
                {copiedType === "txt" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                复制
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(formulasTxt, `${config.id}-formulas.txt`, "text/plain")}
              >
                <Download className="h-4 w-4 mr-1" />
                下载
              </Button>
            </div>
            <Textarea value={formulasTxt} readOnly className="flex-1 font-mono text-xs resize-none whitespace-pre" />
          </TabsContent>

          <TabsContent value="excel" className="flex-1 flex flex-col px-4 pb-4 mt-3 overflow-hidden">
            <div className="flex gap-2 mb-2">
              <Button size="sm" variant="outline" onClick={() => handleCopy(excelCsv, "excel")}>
                {copiedType === "excel" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                复制
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(excelCsv, `${config.id}.csv`, "text/csv;charset=utf-8")}
              >
                <Download className="h-4 w-4 mr-1" />
                下载 CSV
              </Button>
            </div>
            <Textarea value={excelCsv} readOnly className="flex-1 font-mono text-xs resize-none whitespace-pre" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
