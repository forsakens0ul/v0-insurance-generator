import type { QuoterConfig } from "../types"

export const healthInsuranceConfig: QuoterConfig = {
  id: "health-insurance",
  name: "健康险报价器",
  title: "健康医疗保险报价",
  description: "适用于个人健康医疗保险产品报价",
  fields: [
    {
      id: "age",
      name: "年龄",
      label: "被保险人年龄",
      type: "number",
      required: true,
      min: 0,
      max: 70,
      suffix: "岁",
      defaultValue: 35,
      tooltip: "承保年龄范围：0-70岁"
    },
    {
      id: "gender",
      name: "性别",
      label: "性别",
      type: "radio",
      required: true,
      options: [
        { label: "男", value: "male" },
        { label: "女", value: "female" }
      ],
      defaultValue: "male"
    },
    {
      id: "bmi",
      name: "BMI指数",
      label: "BMI指数",
      type: "number",
      required: true,
      min: 15,
      max: 40,
      suffix: "",
      defaultValue: 22,
      tooltip: "体重(kg) ÷ 身高²(m)"
    },
    {
      id: "smokingHistory",
      name: "吸烟史",
      label: "吸烟史",
      type: "select",
      required: true,
      options: [
        { label: "从不吸烟", value: "never" },
        { label: "已戒烟", value: "quit" },
        { label: "偶尔吸烟", value: "occasional" },
        { label: "经常吸烟", value: "regular" }
      ],
      defaultValue: "never"
    },
    {
      id: "medicalHistory",
      name: "既往病史",
      label: "既往病史",
      type: "select",
      required: true,
      options: [
        { label: "无", value: "none" },
        { label: "轻微疾病史", value: "minor" },
        { label: "慢性病史", value: "chronic" },
        { label: "重大疾病史", value: "major" }
      ],
      defaultValue: "none"
    },
    {
      id: "coverageAmount",
      name: "保障额度",
      label: "保障额度",
      type: "select",
      required: true,
      options: [
        { label: "30万", value: 30 },
        { label: "50万", value: 50 },
        { label: "80万", value: 80 },
        { label: "100万", value: 100 }
      ],
      defaultValue: 50,
      suffix: "万元"
    },
    {
      id: "deductible",
      name: "免赔额",
      label: "免赔额",
      type: "select",
      required: true,
      options: [
        { label: "0元", value: 0 },
        { label: "5000元", value: 5000 },
        { label: "1万元", value: 10000 }
      ],
      defaultValue: 5000
    },
    {
      id: "familyHistory",
      name: "家族遗传病史",
      label: "家族遗传病史",
      type: "radio",
      required: true,
      options: [
        { label: "无", value: "no" },
        { label: "有", value: "yes" }
      ],
      defaultValue: "no"
    }
  ],
  coefficientTables: [
    {
      id: "ageGenderRate",
      name: "年龄性别费率表",
      description: "不同年龄段和性别的基础费率",
      rowKeyName: "性别",
      colKeyName: "年龄",
      data: {
        "male": {
          "0": 0.5,
          "5": 0.4,
          "10": 0.45,
          "18": 0.6,
          "25": 0.75,
          "30": 0.9,
          "35": 1.0,
          "40": 1.3,
          "45": 1.7,
          "50": 2.2,
          "55": 2.8,
          "60": 3.5,
          "65": 4.2,
          "70": 5.0
        },
        "female": {
          "0": 0.45,
          "5": 0.38,
          "10": 0.42,
          "18": 0.55,
          "25": 0.68,
          "30": 0.82,
          "35": 0.95,
          "40": 1.2,
          "45": 1.55,
          "50": 2.0,
          "55": 2.5,
          "60": 3.1,
          "65": 3.8,
          "70": 4.5
        }
      }
    },
    {
      id: "bmiCoef",
      name: "BMI系数表",
      description: "BMI指数对保费的影响",
      rowKeyName: "BMI范围",
      colKeyName: "系数",
      data: {
        "18.5": { "rate": 1.0 },
        "24": { "rate": 1.0 },
        "28": { "rate": 1.15 },
        "32": { "rate": 1.35 },
        "40": { "rate": 1.6 }
      }
    },
    {
      id: "smokingCoef",
      name: "吸烟系数表",
      description: "吸烟史对保费的影响",
      rowKeyName: "吸烟情况",
      colKeyName: "系数",
      data: {
        "never": { "rate": 1.0 },
        "quit": { "rate": 1.1 },
        "occasional": { "rate": 1.25 },
        "regular": { "rate": 1.45 }
      }
    },
    {
      id: "medicalHistoryCoef",
      name: "病史系数表",
      description: "既往病史对保费的影响",
      rowKeyName: "病史",
      colKeyName: "系数",
      data: {
        "none": { "rate": 1.0 },
        "minor": { "rate": 1.15 },
        "chronic": { "rate": 1.5 },
        "major": { "rate": 2.0 }
      }
    },
    {
      id: "deductibleDiscount",
      name: "免赔额折扣表",
      description: "选择免赔额可享受的折扣",
      rowKeyName: "免赔额",
      colKeyName: "折扣",
      data: {
        "0": { "discount": 1.0 },
        "5000": { "discount": 0.85 },
        "10000": { "discount": 0.75 }
      }
    }
  ],
  formulas: [
    {
      id: "basePremium",
      name: "基础保费",
      description: "保额 × 基础费率",
      expression: "ROUND($coverageAmount * 100, 2)",
      dependencies: ["coverageAmount"],
      showInResult: false,
      unit: "元"
    },
    {
      id: "ageGenderAdjustment",
      name: "年龄性别调整系数",
      description: "根据年龄和性别查询费率",
      expression: "LOOKUP(ageGenderRate, $gender, $age)",
      dependencies: ["age", "gender"],
      showInResult: false,
      unit: ""
    },
    {
      id: "healthRiskAdjustment",
      name: "健康风险调整",
      description: "BMI × 吸烟 × 病史系数的综合影响",
      expression: "ROUND(LOOKUP(bmiCoef, $bmi, 'rate') * LOOKUP(smokingCoef, $smokingHistory, 'rate') * LOOKUP(medicalHistoryCoef, $medicalHistory, 'rate'), 3)",
      dependencies: ["bmi", "smokingHistory", "medicalHistory"],
      showInResult: false,
      unit: ""
    },
    {
      id: "familyHistoryExtra",
      name: "家族病史附加费",
      description: "有家族遗传病史需要额外收费",
      expression: "IF($familyHistory == 'yes', 500, 0)",
      dependencies: ["familyHistory"],
      showInResult: true,
      unit: "元"
    },
    {
      id: "premiumBeforeDiscount",
      name: "折扣前保费",
      description: "基础保费 × 年龄性别系数 × 健康风险系数",
      expression: "ROUND(@basePremium * @ageGenderAdjustment * @healthRiskAdjustment + @familyHistoryExtra, 2)",
      dependencies: [],
      showInResult: true,
      unit: "元"
    },
    {
      id: "deductibleDiscountAmount",
      name: "免赔额优惠",
      description: "选择免赔额享受的折扣",
      expression: "LOOKUP(deductibleDiscount, $deductible, 'discount')",
      dependencies: ["deductible"],
      showInResult: false,
      unit: ""
    },
    {
      id: "totalPremium",
      name: "最终保费",
      description: "折扣前保费 × 免赔额折扣",
      expression: "ROUND(@premiumBeforeDiscount * @deductibleDiscountAmount, 2)",
      dependencies: [],
      showInResult: true,
      unit: "元"
    }
  ],
  sections: [
    {
      id: "basic-info",
      title: "基本信息",
      fieldIds: ["age", "gender", "bmi"],
      collapsible: false
    },
    {
      id: "health-status",
      title: "健康状况",
      fieldIds: ["smokingHistory", "medicalHistory", "familyHistory"],
      collapsible: false
    },
    {
      id: "coverage-options",
      title: "保障选项",
      fieldIds: ["coverageAmount", "deductible"],
      collapsible: false
    }
  ]
}
