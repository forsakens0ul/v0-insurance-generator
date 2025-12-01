// 公式引擎 - 解析和执行用户定义的计算公式

import type { QuoterConfig } from "./types"

// 内置函数定义
const builtInFunctions: Record<string, (...args: number[]) => number> = {
  // 数学函数
  ROUND: (value: number, decimals = 0) => {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
  },
  FLOOR: (value: number) => Math.floor(value),
  CEIL: (value: number) => Math.ceil(value),
  ABS: (value: number) => Math.abs(value),
  MIN: (...args: number[]) => Math.min(...args),
  MAX: (...args: number[]) => Math.max(...args),
  SUM: (...args: number[]) => args.reduce((a, b) => a + b, 0),
  AVG: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,

  // 条件函数
  IF: (condition: number, trueVal: number, falseVal: number) => (condition ? trueVal : falseVal),
}

// 查找系数表中的值
export function lookupCoefficient(
  tables: QuoterConfig["coefficientTables"],
  tableId: string,
  rowKey: string,
  colKey: string,
): number {
  const table = tables.find((t) => t.id === tableId)
  if (!table) return 0

  const rowData = table.data[rowKey]
  if (!rowData) return 0

  // 尝试精确匹配
  if (colKey in rowData) {
    return rowData[colKey]
  }

  // 如果是数字类型的列键，尝试找最接近的
  const numKey = Number(colKey)
  if (!isNaN(numKey)) {
    const numericKeys = Object.keys(rowData)
      .map(Number)
      .filter((k) => !isNaN(k))
      .sort((a, b) => a - b)

    // 找到小于等于目标值的最大键
    let closestKey: number | undefined
    for (const key of numericKeys) {
      if (key <= numKey) {
        closestKey = key
      }
    }

    if (closestKey !== undefined) {
      return rowData[String(closestKey)]
    }
  }

  return 0
}

// 解析并执行公式表达式
export function evaluateFormula(
  expression: string,
  context: {
    formValues: Record<string, string | number>
    coefficientTables: QuoterConfig["coefficientTables"]
    calculatedValues: Record<string, number>
    fields: QuoterConfig["fields"]
  },
): number {
  try {
    // 替换 LOOKUP 函数调用
    // 格式: LOOKUP(tableId, rowKey, colKey)
    let processedExpr = expression.replace(
      /LOOKUP\s*$$\s*["']?(\w+)["']?\s*,\s*(.+?)\s*,\s*(.+?)\s*$$/g,
      (_, tableId, rowKeyExpr, colKeyExpr) => {
        // 解析行键和列键表达式
        const rowKey = evaluateSubExpression(rowKeyExpr, context)
        const colKey = evaluateSubExpression(colKeyExpr, context)
        const value = lookupCoefficient(context.coefficientTables, tableId, String(rowKey), String(colKey))
        return String(value)
      },
    )

    // 替换字段引用 - 使用 $ 前缀表示字段
    // 例如: $age, $gender, $occupation
    processedExpr = processedExpr.replace(/\$(\w+)/g, (_, fieldId) => {
      const value = context.formValues[fieldId]
      if (typeof value === "string") {
        return `"${value}"`
      }
      return String(value ?? 0)
    })

    // 替换计算值引用 - 使用 @ 前缀
    // 例如: @mainPremium, @medicalPremium
    processedExpr = processedExpr.replace(/@(\w+)/g, (_, calcId) => {
      return String(context.calculatedValues[calcId] ?? 0)
    })

    // 替换内置函数
    for (const [funcName, func] of Object.entries(builtInFunctions)) {
      const regex = new RegExp(`${funcName}\\s*\$$([^)]+)\$$`, "gi")
      processedExpr = processedExpr.replace(regex, (_, argsStr) => {
        const args = argsStr.split(",").map((arg: string) => {
          const trimmed = arg.trim()
          // 如果是数字直接返回
          const num = Number(trimmed)
          if (!isNaN(num)) return num
          // 否则尝试递归解析
          return evaluateFormula(trimmed, context)
        })
        return String(func(...args))
      })
    }

    // 安全地执行数学表达式
    // 移除所有非数学字符（保留数字、运算符、括号、小数点）
    const safeExpr = processedExpr.replace(/[^0-9+\-*/().e\s]/g, "")

    if (!safeExpr.trim()) return 0

    // 使用 Function 构造器执行表达式
    const result = new Function(`return ${safeExpr}`)()
    return typeof result === "number" && !isNaN(result) ? result : 0
  } catch (error) {
    console.error("公式计算错误:", expression, error)
    return 0
  }
}

// 解析子表达式（用于 LOOKUP 参数）
function evaluateSubExpression(
  expr: string,
  context: {
    formValues: Record<string, string | number>
    calculatedValues: Record<string, number>
  },
): string | number {
  const trimmed = expr.trim()

  // 如果是带引号的字符串
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }

  // 如果是字段引用
  if (trimmed.startsWith("$")) {
    return context.formValues[trimmed.slice(1)] ?? ""
  }

  // 如果是计算值引用
  if (trimmed.startsWith("@")) {
    return context.calculatedValues[trimmed.slice(1)] ?? 0
  }

  // 如果是数字
  const num = Number(trimmed)
  if (!isNaN(num)) return num

  return trimmed
}

// 根据依赖关系对公式进行拓扑排序
export function sortFormulasByDependency(formulas: QuoterConfig["formulas"]): QuoterConfig["formulas"] {
  const sorted: QuoterConfig["formulas"] = []
  const visited = new Set<string>()
  const visiting = new Set<string>()

  const visit = (formula: QuoterConfig["formulas"][0]) => {
    if (visited.has(formula.id)) return
    if (visiting.has(formula.id)) {
      console.warn("检测到循环依赖:", formula.id)
      return
    }

    visiting.add(formula.id)

    // 先处理依赖的公式
    for (const depId of formula.dependencies) {
      // 检查是否是其他公式的 ID
      const depFormula = formulas.find((f) => f.id === depId)
      if (depFormula) {
        visit(depFormula)
      }
    }

    visiting.delete(formula.id)
    visited.add(formula.id)
    sorted.push(formula)
  }

  for (const formula of formulas) {
    visit(formula)
  }

  return sorted
}

// 执行所有公式计算
export function calculateAll(
  config: QuoterConfig,
  formValues: Record<string, string | number>,
): Record<string, number> {
  const results: Record<string, number> = {}

  // 按依赖顺序排序公式
  const sortedFormulas = sortFormulasByDependency(config.formulas)

  // 依次计算每个公式
  for (const formula of sortedFormulas) {
    const value = evaluateFormula(formula.expression, {
      formValues,
      coefficientTables: config.coefficientTables,
      calculatedValues: results,
      fields: config.fields,
    })
    results[formula.id] = value
  }

  return results
}
