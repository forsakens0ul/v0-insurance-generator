// 字段类型定义
export type FieldType = "radio" | "select" | "number" | "text" | "array"

// 表单字段配置
export interface FormField {
  id: string
  name: string
  label: string
  type: FieldType
  required: boolean
  options?: { label: string; value: string | number }[]
  min?: number
  max?: number
  suffix?: string
  defaultValue?: string | number | any[]
  tooltip?: string
  // array类型专用配置
  arrayConfig?: {
    minItems: number
    maxItems: number
    itemFields: FormField[]
  }
}

// 系数表配置
export interface CoefficientTable {
  id: string
  name: string
  description: string
  rowKeyName: string
  colKeyName: string
  data: Record<string, Record<string, number>>
}

// 计算公式配置
export interface Formula {
  id: string
  name: string
  description: string
  expression: string
  dependencies: string[]
  showInResult: boolean
  unit?: string
  // 是否为数组公式（对每个数组项执行）
  arrayFormula?: boolean
}

// 报价器配置
export interface QuoterConfig {
  id: string
  name: string
  title: string
  description: string
  fields: FormField[]
  coefficientTables: CoefficientTable[]
  formulas: Formula[]
  sections: {
    id: string
    title: string
    fieldIds: string[]
    collapsible?: boolean
  }[]
}

export const defaultInsuranceConfig: QuoterConfig = {
  id: "insurance-quoter",
  name: "个人意外险报价器",
  title: "个人意外险报价器",
  description: "用于计算个人意外险保费",
  fields: [
    {
      id: "gender",
      name: "被保险人性别",
      label: "被保险人性别",
      type: "radio",
      required: true,
      options: [
        { label: "男", value: "male" },
        { label: "女", value: "female" },
      ],
      defaultValue: "male",
    },
    {
      id: "age",
      name: "被保险人年龄",
      label: "被保险人年龄",
      type: "number",
      required: true,
      min: 0,
      max: 60,
      suffix: "岁",
      defaultValue: 30,
    },
    {
      id: "occupation",
      name: "职业类别",
      label: "职业类别",
      type: "select",
      required: true,
      options: [
        { label: "一类", value: "class1" },
        { label: "二类", value: "class2" },
        { label: "三类", value: "class3" },
        { label: "四类", value: "class4" },
        { label: "五类", value: "class5" },
        { label: "六类", value: "class6" },
      ],
      defaultValue: "class2",
    },
    {
      id: "medicalRatio",
      name: "意外医疗扣除赔付比例",
      label: "意外医疗扣除赔付比例",
      type: "select",
      required: true,
      options: [
        { label: "意外医疗扣除100元后80%比例赔付", value: 80 },
        { label: "意外医疗扣除100元后90%比例赔付", value: 90 },
        { label: "意外医疗扣除100元后100%比例赔付", value: 100 },
      ],
      defaultValue: 80,
    },
    {
      id: "hospitalDays",
      name: "住院津贴免赔天数",
      label: "住院津贴免赔天数",
      type: "select",
      required: true,
      options: [
        { label: "免赔0天", value: 0 },
        { label: "免赔3天", value: 3 },
      ],
      defaultValue: 3,
    },
    {
      id: "accidentAmount",
      name: "意外身故伤残保额",
      label: "意外身故/伤残保额",
      type: "number",
      required: true,
      min: 1,
      max: 100,
      suffix: "万元",
      defaultValue: 20,
      tooltip: "保额不超过100万元",
    },
    {
      id: "medicalAmount",
      name: "附加意外伤害医疗保额",
      label: "附加意外伤害医疗保额",
      type: "number",
      required: true,
      min: 0,
      suffix: "万元",
      defaultValue: 5,
    },
    {
      id: "hospitalAllowance",
      name: "附加意外伤害住院津贴",
      label: "附加意外伤害住院津贴",
      type: "number",
      required: false,
      min: 0,
      max: 300,
      suffix: "元/天",
      defaultValue: 100,
      tooltip: "不能超过300元，非必填",
    },
  ],
  coefficientTables: [
    {
      id: "ageCoef",
      name: "年龄调整系数表",
      description: "根据性别和年龄确定调整系数",
      rowKeyName: "性别",
      colKeyName: "年龄",
      data: {
        male: {
          "0": 0.342,
          "5": 0.188,
          "10": 0.211,
          "15": 0.33,
          "18": 0.41,
          "20": 0.506,
          "25": 0.583,
          "30": 0.671,
          "35": 0.764,
          "40": 1,
          "45": 1.296,
          "50": 1.534,
          "55": 1.866,
          "60": 2.188,
        },
        female: {
          "0": 0.252,
          "5": 0.129,
          "10": 0.106,
          "15": 0.126,
          "18": 0.139,
          "20": 0.159,
          "25": 0.157,
          "30": 0.181,
          "35": 0.227,
          "40": 0.333,
          "45": 0.455,
          "50": 0.584,
          "55": 0.766,
          "60": 0.937,
        },
      },
    },
    {
      id: "occupationCoef",
      name: "职业类别系数表",
      description: "根据职业类别确定费率系数",
      rowKeyName: "系数类型",
      colKeyName: "职业类别",
      data: {
        factor: {
          class1: 0.8,
          class2: 1.2,
          class3: 1.4,
          class4: 1.6,
          class5: 2.0,
          class6: 3.0,
        },
      },
    },
    {
      id: "medicalCoef",
      name: "医疗险系数表",
      description: "根据职业类别和赔付比例确定医疗险系数",
      rowKeyName: "职业类别",
      colKeyName: "赔付比例",
      data: {
        class1: { "80": 1.08, "90": 1.17, "100": 1.26 },
        class2: { "80": 0.95, "90": 1.03, "100": 1.12 },
        class3: { "80": 0.78, "90": 0.86, "100": 0.91 },
        class4: { "80": 0.66, "90": 0.71, "100": 0.75 },
        class5: { "80": 0.49, "90": 0.52, "100": 0.57 },
        class6: { "80": 0.42, "90": 0.45, "100": 0.49 },
      },
    },
    {
      id: "hospitalCoef",
      name: "住院津贴系数表",
      description: "根据职业类别和免赔天数确定住院津贴系数",
      rowKeyName: "职业类别",
      colKeyName: "免赔天数",
      data: {
        class1: { "0": 1.38, "3": 1.18 },
        class2: { "0": 2.31, "3": 1.97 },
        class3: { "0": 3.23, "3": 2.75 },
        class4: { "0": 3.69, "3": 3.14 },
        class5: { "0": 4.62, "3": 3.92 },
        class6: { "0": 5.54, "3": 4.71 },
      },
    },
  ],
  formulas: [
    {
      id: "mainPremium",
      name: "主险保费",
      description: "计算主险保费 = 保额 × 基准费率 × 续保系数 × 年龄系数 × 职业系数",
      expression:
        "ROUND($accidentAmount * 10000 * 0.000842 * 0.9 * LOOKUP(ageCoef, $gender, $age) * LOOKUP(occupationCoef, 'factor', $occupation), 2)",
      dependencies: ["accidentAmount", "gender", "age", "occupation"],
      showInResult: true,
      unit: "元",
    },
    {
      id: "medicalPremium",
      name: "附加医疗险保费",
      description: "计算附加医疗险保费 = 医疗保额 × 医疗系数 / 1000",
      expression: "ROUND($medicalAmount * 10000 * LOOKUP(medicalCoef, $occupation, $medicalRatio) / 1000, 2)",
      dependencies: ["medicalAmount", "occupation", "medicalRatio"],
      showInResult: true,
      unit: "元",
    },
    {
      id: "hospitalPremium",
      name: "住院津贴险保费",
      description: "计算住院津贴保费 = (津贴金额 / 10) × 住院系数",
      expression: "ROUND(($hospitalAllowance / 10) * LOOKUP(hospitalCoef, $occupation, $hospitalDays), 2)",
      dependencies: ["hospitalAllowance", "occupation", "hospitalDays"],
      showInResult: true,
      unit: "元",
    },
    {
      id: "totalPremium",
      name: "总保费",
      description: "各项保费之和",
      expression: "ROUND(@mainPremium + @medicalPremium + @hospitalPremium, 2)",
      dependencies: ["mainPremium", "medicalPremium", "hospitalPremium"],
      showInResult: true,
      unit: "元",
    },
  ],
  sections: [
    {
      id: "basic",
      title: "基本信息",
      fieldIds: ["gender", "age", "occupation", "medicalRatio", "hospitalDays"],
      collapsible: false,
    },
    {
      id: "amount",
      title: "保额信息",
      fieldIds: ["accidentAmount", "medicalAmount", "hospitalAllowance"],
      collapsible: true,
    },
  ],
}
