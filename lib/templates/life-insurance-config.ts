import type { QuoterConfig } from "../types"

export const lifeInsuranceConfig: QuoterConfig = {
  id: "life-insurance",
  name: "寿险报价器",
  title: "定期寿险报价计算",
  description: "适用于定期寿险产品报价",
  fields: [
    {
      id: "age",
      name: "年龄",
      label: "被保险人年龄",
      type: "number",
      required: true,
      min: 18,
      max: 60,
      suffix: "岁",
      defaultValue: 30,
      tooltip: "承保年龄范围：18-60岁"
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
      id: "occupation",
      name: "职业类别",
      label: "职业类别",
      type: "select",
      required: true,
      options: [
        { label: "一类（办公室人员）", value: "class1" },
        { label: "二类（轻体力劳动）", value: "class2" },
        { label: "三类（中等风险）", value: "class3" },
        { label: "四类（较高风险）", value: "class4" }
      ],
      defaultValue: "class1"
    },
    {
      id: "coverageAmount",
      name: "保额",
      label: "保险金额",
      type: "select",
      required: true,
      options: [
        { label: "50万", value: 50 },
        { label: "100万", value: 100 },
        { label: "200万", value: 200 },
        { label: "300万", value: 300 },
        { label: "500万", value: 500 }
      ],
      defaultValue: 100,
      suffix: "万元"
    },
    {
      id: "coveragePeriod",
      name: "保障期限",
      label: "保障期限",
      type: "select",
      required: true,
      options: [
        { label: "10年", value: 10 },
        { label: "20年", value: 20 },
        { label: "30年", value: 30 },
        { label: "至60岁", value: 60 },
        { label: "至70岁", value: 70 }
      ],
      defaultValue: 30,
      suffix: "年"
    },
    {
      id: "paymentPeriod",
      name: "缴费期限",
      label: "缴费期限",
      type: "select",
      required: true,
      options: [
        { label: "趸交（一次性）", value: 1 },
        { label: "5年", value: 5 },
        { label: "10年", value: 10 },
        { label: "20年", value: 20 },
        { label: "30年", value: 30 }
      ],
      defaultValue: 20
    },
    {
      id: "healthStatus",
      name: "健康状况",
      label: "健康状况",
      type: "select",
      required: true,
      options: [
        { label: "标准体", value: "standard" },
        { label: "优选体", value: "preferred" },
        { label: "次标准体", value: "substandard" }
      ],
      defaultValue: "standard"
    },
    {
      id: "hasAdditionalBenefit",
      name: "附加保费豁免",
      label: "附加保费豁免",
      type: "radio",
      required: true,
      options: [
        { label: "需要", value: "yes" },
        { label: "不需要", value: "no" }
      ],
      defaultValue: "no",
      tooltip: "重疾/身故可豁免后续保费"
    }
  ],
  coefficientTables: [
    {
      id: "ageGenderRate",
      name: "年龄性别费率表",
      description: "每万元保额对应的年保费（元/万元）",
      rowKeyName: "性别",
      colKeyName: "年龄",
      data: {
        "male": {
          "18": 8,
          "20": 8.5,
          "25": 10,
          "30": 12,
          "35": 15,
          "40": 20,
          "45": 28,
          "50": 40,
          "55": 58,
          "60": 85
        },
        "female": {
          "18": 5,
          "20": 5.5,
          "25": 6.5,
          "30": 8,
          "35": 10,
          "40": 13,
          "45": 18,
          "50": 26,
          "55": 38,
          "60": 55
        }
      }
    },
    {
      id: "occupationCoef",
      name: "职业系数表",
      description: "不同职业类别的费率调整",
      rowKeyName: "职业",
      colKeyName: "系数",
      data: {
        "class1": { "rate": 1.0 },
        "class2": { "rate": 1.15 },
        "class3": { "rate": 1.35 },
        "class4": { "rate": 1.6 }
      }
    },
    {
      id: "periodCoef",
      name: "保障期限系数表",
      description: "不同保障期限的费率调整",
      rowKeyName: "期限",
      colKeyName: "系数",
      data: {
        "10": { "rate": 0.7 },
        "20": { "rate": 0.9 },
        "30": { "rate": 1.0 },
        "60": { "rate": 1.15 },
        "70": { "rate": 1.3 }
      }
    },
    {
      id: "paymentCoef",
      name: "缴费期限系数表",
      description: "缴费期限越长，年保费越低",
      rowKeyName: "缴费期",
      colKeyName: "系数",
      data: {
        "1": { "rate": 1.0 },
        "5": { "rate": 0.22 },
        "10": { "rate": 0.12 },
        "20": { "rate": 0.065 },
        "30": { "rate": 0.05 }
      }
    },
    {
      id: "healthCoef",
      name: "健康状况系数表",
      description: "健康状况对费率的影响",
      rowKeyName: "健康状况",
      colKeyName: "系数",
      data: {
        "preferred": { "rate": 0.9 },
        "standard": { "rate": 1.0 },
        "substandard": { "rate": 1.3 }
      }
    }
  ],
  formulas: [
    {
      id: "baseRate",
      name: "基础费率",
      description: "根据年龄和性别查询基础费率",
      expression: "LOOKUP(ageGenderRate, $gender, $age)",
      dependencies: ["age", "gender"],
      showInResult: false,
      unit: "元/万元"
    },
    {
      id: "occupationAdjustment",
      name: "职业调整系数",
      description: "职业风险调整",
      expression: "LOOKUP(occupationCoef, $occupation, 'rate')",
      dependencies: ["occupation"],
      showInResult: false,
      unit: ""
    },
    {
      id: "periodAdjustment",
      name: "期限调整系数",
      description: "保障期限调整",
      expression: "LOOKUP(periodCoef, $coveragePeriod, 'rate')",
      dependencies: ["coveragePeriod"],
      showInResult: false,
      unit: ""
    },
    {
      id: "paymentAdjustment",
      name: "缴费期调整系数",
      description: "缴费期限调整",
      expression: "LOOKUP(paymentCoef, $paymentPeriod, 'rate')",
      dependencies: ["paymentPeriod"],
      showInResult: false,
      unit: ""
    },
    {
      id: "healthAdjustment",
      name: "健康调整系数",
      description: "健康状况调整",
      expression: "LOOKUP(healthCoef, $healthStatus, 'rate')",
      dependencies: ["healthStatus"],
      showInResult: false,
      unit: ""
    },
    {
      id: "totalPremium",
      name: "基本保费（年缴）",
      description: "基础费率 × 保额 × 各项系数",
      expression: "ROUND(@baseRate * $coverageAmount * @occupationAdjustment * @periodAdjustment * @paymentAdjustment * @healthAdjustment, 2)",
      dependencies: ["coverageAmount"],
      showInResult: true,
      unit: "元/年"
    },
    {
      id: "waiverPremium",
      name: "豁免保费",
      description: "附加保费豁免需要额外费用",
      expression: "IF($hasAdditionalBenefit == 'yes', ROUND(@totalPremium * 0.05, 2), 0)",
      dependencies: ["hasAdditionalBenefit"],
      showInResult: true,
      unit: "元/年"
    },
    {
      id: "finalPremium",
      name: "总保费（年缴）",
      description: "基本保费 + 豁免保费",
      expression: "ROUND(@totalPremium + @waiverPremium, 2)",
      dependencies: [],
      showInResult: true,
      unit: "元/年"
    },
    {
      id: "totalPayment",
      name: "总缴费金额",
      description: "年保费 × 缴费年限",
      expression: "ROUND(@finalPremium * $paymentPeriod, 2)",
      dependencies: ["paymentPeriod"],
      showInResult: true,
      unit: "元"
    }
  ],
  sections: [
    {
      id: "insured-info",
      title: "被保险人信息",
      fieldIds: ["age", "gender", "occupation", "healthStatus"],
      collapsible: false
    },
    {
      id: "coverage-options",
      title: "保障方案",
      fieldIds: ["coverageAmount", "coveragePeriod", "paymentPeriod"],
      collapsible: false
    },
    {
      id: "additional-benefits",
      title: "附加保障",
      fieldIds: ["hasAdditionalBenefit"],
      collapsible: false
    }
  ]
}
