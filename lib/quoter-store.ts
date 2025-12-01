import { create } from "zustand"
import { type QuoterConfig, type FormField, type CoefficientTable, type Formula, defaultInsuranceConfig } from "./types"
import { calculateAll } from "./formula-engine"

interface QuoterState {
  config: QuoterConfig
  formValues: Record<string, string | number>
  calculatedValues: Record<string, number>

  // 配置操作
  setConfig: (config: QuoterConfig) => void
  updateField: (fieldId: string, field: Partial<FormField>) => void
  addField: (field: FormField) => void
  removeField: (fieldId: string) => void

  // 系数表操作
  updateCoefficientTable: (tableId: string, updates: Partial<CoefficientTable>) => void
  updateCoefficientCell: (tableId: string, rowKey: string, colKey: string, value: number) => void
  addCoefficientRow: (tableId: string, rowKey: string) => void
  addCoefficientCol: (tableId: string, colKey: string) => void
  deleteCoefficientRow: (tableId: string, rowKey: string) => void
  deleteCoefficientCol: (tableId: string, colKey: string) => void
  addCoefficientTable: (table: CoefficientTable) => void
  removeCoefficientTable: (tableId: string) => void

  // 公式操作
  updateFormula: (formulaId: string, formula: Partial<Formula>) => void
  addFormula: (formula: Formula) => void
  removeFormula: (formulaId: string) => void

  // 表单值操作
  setFormValue: (fieldId: string, value: string | number) => void
  setFormValues: (values: Record<string, string | number>) => void

  // 计算操作
  calculate: () => void
}

// 根据配置生成初始表单值
function getInitialFormValues(config: QuoterConfig): Record<string, string | number> {
  const values: Record<string, string | number> = {}
  for (const field of config.fields) {
    if (field.defaultValue !== undefined) {
      values[field.id] = field.defaultValue
    }
  }
  return values
}

export const useQuoterStore = create<QuoterState>((set, get) => {
  const initialFormValues = getInitialFormValues(defaultInsuranceConfig)
  const initialCalculatedValues = calculateAll(defaultInsuranceConfig, initialFormValues)

  return {
  config: defaultInsuranceConfig,
  formValues: initialFormValues,
  calculatedValues: initialCalculatedValues,

  setConfig: (config) => {
    set({
      config,
      formValues: getInitialFormValues(config),
    })
    get().calculate()
  },

  updateField: (fieldId, fieldUpdate) => {
    set((state) => ({
      config: {
        ...state.config,
        fields: state.config.fields.map((f) => (f.id === fieldId ? { ...f, ...fieldUpdate } : f)),
      },
    }))
    get().calculate()
  },

  addField: (field) => {
    set((state) => ({
      config: {
        ...state.config,
        fields: [...state.config.fields, field],
      },
      formValues: {
        ...state.formValues,
        [field.id]: field.defaultValue ?? "",
      },
    }))
  },

  removeField: (fieldId) =>
    set((state) => ({
      config: {
        ...state.config,
        fields: state.config.fields.filter((f) => f.id !== fieldId),
      },
    })),

  updateCoefficientTable: (tableId, updates) => {
    set((state) => ({
      config: {
        ...state.config,
        coefficientTables: state.config.coefficientTables.map((t) => (t.id === tableId ? { ...t, ...updates } : t)),
      },
    }))
    get().calculate()
  },

  updateCoefficientCell: (tableId, rowKey, colKey, value) => {
    set((state) => ({
      config: {
        ...state.config,
        coefficientTables: state.config.coefficientTables.map((t) => {
          if (t.id !== tableId) return t
          return {
            ...t,
            data: {
              ...t.data,
              [rowKey]: {
                ...t.data[rowKey],
                [colKey]: value,
              },
            },
          }
        }),
      },
    }))
    get().calculate()
  },

  addCoefficientRow: (tableId, rowKey) => {
    set((state) => {
      const table = state.config.coefficientTables.find((t) => t.id === tableId)
      if (!table) return state

      // 获取现有的列键
      const existingCols = Object.keys(Object.values(table.data)[0] || {})
      const newRowData: Record<string, number> = {}
      for (const col of existingCols) {
        newRowData[col] = 0
      }

      return {
        config: {
          ...state.config,
          coefficientTables: state.config.coefficientTables.map((t) => {
            if (t.id !== tableId) return t
            return {
              ...t,
              data: {
                ...t.data,
                [rowKey]: newRowData,
              },
            }
          }),
        },
      }
    })
  },

  addCoefficientCol: (tableId, colKey) => {
    set((state) => ({
      config: {
        ...state.config,
        coefficientTables: state.config.coefficientTables.map((t) => {
          if (t.id !== tableId) return t
          const newData = { ...t.data }
          for (const rowKey of Object.keys(newData)) {
            newData[rowKey] = { ...newData[rowKey], [colKey]: 0 }
          }
          return { ...t, data: newData }
        }),
      },
    }))
  },

  deleteCoefficientRow: (tableId, rowKey) => {
    set((state) => ({
      config: {
        ...state.config,
        coefficientTables: state.config.coefficientTables.map((t) => {
          if (t.id !== tableId) return t
          const newData = { ...t.data }
          delete newData[rowKey]
          return { ...t, data: newData }
        }),
      },
    }))
    get().calculate()
  },

  deleteCoefficientCol: (tableId, colKey) => {
    set((state) => ({
      config: {
        ...state.config,
        coefficientTables: state.config.coefficientTables.map((t) => {
          if (t.id !== tableId) return t
          const newData: Record<string, Record<string, number>> = {}
          for (const [rowKey, rowData] of Object.entries(t.data)) {
            const { [colKey]: _, ...rest } = rowData
            newData[rowKey] = rest
          }
          return { ...t, data: newData }
        }),
      },
    }))
    get().calculate()
  },

  addCoefficientTable: (table) => {
    set((state) => ({
      config: {
        ...state.config,
        coefficientTables: [...state.config.coefficientTables, table],
      },
    }))
  },

  removeCoefficientTable: (tableId) => {
    set((state) => ({
      config: {
        ...state.config,
        coefficientTables: state.config.coefficientTables.filter((t) => t.id !== tableId),
      },
    }))
    get().calculate()
  },

  updateFormula: (formulaId, formulaUpdate) => {
    set((state) => ({
      config: {
        ...state.config,
        formulas: state.config.formulas.map((f) => (f.id === formulaId ? { ...f, ...formulaUpdate } : f)),
      },
    }))
    get().calculate()
  },

  addFormula: (formula) => {
    set((state) => ({
      config: {
        ...state.config,
        formulas: [...state.config.formulas, formula],
      },
    }))
    get().calculate()
  },

  removeFormula: (formulaId) => {
    set((state) => ({
      config: {
        ...state.config,
        formulas: state.config.formulas.filter((f) => f.id !== formulaId),
      },
    }))
    get().calculate()
  },

  setFormValue: (fieldId, value) => {
    set((state) => ({
      formValues: { ...state.formValues, [fieldId]: value },
    }))
    get().calculate()
  },

  setFormValues: (values) => {
    set({ formValues: values })
    get().calculate()
  },

  calculate: () => {
    const { config, formValues } = get()
    const results = calculateAll(config, formValues)
    set({ calculatedValues: results })
  },
}})
