// 公式引擎 - 解析和执行用户定义的计算公式

import type { QuoterConfig } from "./types"

// 分割函数参数（考虑括号嵌套）
function splitArgs(argsStr: string): string[] {
  const args: string[] = []
  let currentArg = ""
  let depth = 0

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i]
    if (char === "(" || char === "[" || char === "{") {
      depth++
      currentArg += char
    } else if (char === ")" || char === "]" || char === "}") {
      depth--
      currentArg += char
    } else if (char === "," && depth === 0) {
      args.push(currentArg.trim())
      currentArg = ""
    } else {
      currentArg += char
    }
  }

  if (currentArg.trim()) {
    args.push(currentArg.trim())
  }

  return args
}

// 内置函数定义
const builtInFunctions: Record<string, (...args: any[]) => number> = {
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
  SUM: (...args: any[]) => {
    // 支持数组和数字
    const flat = args.flat(Infinity).filter(v => typeof v === 'number' && !isNaN(v))
    return flat.reduce((a: number, b: number) => a + b, 0)
  },
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
    formValues: Record<string, any>
    coefficientTables: QuoterConfig["coefficientTables"]
    calculatedValues: Record<string, any>
    fields: QuoterConfig["fields"]
  },
  arrayIndex?: number,
): number {
  let processedExpr = expression
  try {
    // 先替换字段引用 - 使用 $ 前缀表示字段
    // 例如: $age, $gender, $occupation
    processedExpr = processedExpr.replace(/\$(\w+)/g, (_, fieldId) => {
      let value = context.formValues[fieldId]

      // 如果是数组公式计算，从数组中获取对应项
      if (arrayIndex !== undefined && Array.isArray(value)) {
        value = value[arrayIndex]?.[fieldId] ?? value[arrayIndex]
      }

      if (typeof value === "string") {
        return `"${value}"`
      }
      return String(value ?? 0)
    })

    // 替换计算值引用 - 使用 @ 前缀
    // 例如: @mainPremium, @medicalPremium
    processedExpr = processedExpr.replace(/@(\w+)/g, (_, calcId) => {
      let value = context.calculatedValues[calcId]

      // 如果是数组公式计算，从数组中获取对应项
      if (arrayIndex !== undefined && Array.isArray(value)) {
        value = value[arrayIndex]
      }

      return String(value ?? 0)
    })

    // 最后替换 LOOKUP 函数调用
    // 格式: LOOKUP(tableId, rowKey, colKey)
    processedExpr = processedExpr.replace(
      /LOOKUP\s*\(\s*["']?(\w+)["']?\s*,\s*(.+?)\s*,\s*(.+?)\s*\)/g,
      (_, tableId, rowKeyExpr, colKeyExpr) => {
        // 解析行键和列键表达式
        const rowKey = evaluateSubExpression(rowKeyExpr, context)
        const colKey = evaluateSubExpression(colKeyExpr, context)
        const value = lookupCoefficient(context.coefficientTables, tableId, String(rowKey), String(colKey))
        return String(value)
      },
    )

    // 替换内置函数（需要处理嵌套括号）
    for (const [funcName, func] of Object.entries(builtInFunctions)) {
      let changed = true
      while (changed) {
        changed = false
        const regex = new RegExp(`${funcName}\\s*\\(`, "i")
        const match = processedExpr.match(regex)

        if (match && match.index !== undefined) {
          const offset = match.index
          let depth = 1
          let i = offset + match[0].length

          // 找到匹配的右括号
          while (i < processedExpr.length && depth > 0) {
            if (processedExpr[i] === "(") depth++
            if (processedExpr[i] === ")") depth--
            i++
          }

          if (depth === 0) {
            const argsStr = processedExpr.substring(offset + match[0].length, i - 1)
            const args = splitArgs(argsStr).map((arg: string) => {
              const trimmed = arg.trim()
              const num = Number(trimmed)
              if (!isNaN(num)) return num
              return evaluateFormula(trimmed, context)
            })
            const result = String(func(...args))

            // 替换整个函数调用
            processedExpr = processedExpr.substring(0, offset) + result + processedExpr.substring(i)
            changed = true
          }
        }
      }
    }

    // 安全地执行数学表达式
    // 移除所有非数学字符（保留数字、运算符、括号、小数点）
    const safeExpr = processedExpr.replace(/[^0-9+\-*/().\s]/g, "")

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
  formValues: Record<string, any>,
): Record<string, any> {
  const results: Record<string, any> = {}

  // 找到数组字段
  const arrayFields = config.fields.filter(f => f.type === 'array')

  // 按依赖顺序排序公式
  const sortedFormulas = sortFormulasByDependency(config.formulas)

  // 依次计算每个公式
  for (const formula of sortedFormulas) {
    // 如果是数组公式，对数组中的每一项执行
    if (formula.arrayFormula && arrayFields.length > 0) {
      const arrayField = arrayFields[0] // 假设只有一个数组字段
      const arrayValue = formValues[arrayField.id] || []

      if (Array.isArray(arrayValue) && arrayValue.length > 0) {
        const arrayResults: number[] = []

        for (let i = 0; i < arrayValue.length; i++) {
          const value = evaluateFormula(formula.expression, {
            formValues: { ...formValues, ...arrayValue[i] },
            coefficientTables: config.coefficientTables,
            calculatedValues: results,
            fields: config.fields,
          }, i)
          arrayResults.push(value)
        }

        results[formula.id] = arrayResults
      } else {
        results[formula.id] = []
      }
    } else {
      // 普通公式计算
      const value = evaluateFormula(formula.expression, {
        formValues,
        coefficientTables: config.coefficientTables,
        calculatedValues: results,
        fields: config.fields,
      })
      results[formula.id] = value
    }
  }

  return results
}
