import type { QuoterConfig } from "../types"

export const carInsuranceConfig: QuoterConfig = {
  id: "car-insurance",
  name: "车险报价器",
  title: "车险报价计算",
  description: "适用于私家车商业险报价计算",
  fields: [
    {
      id: "carAge",
      name: "车龄",
      label: "车龄",
      type: "number",
      required: true,
      min: 0,
      max: 15,
      suffix: "年",
      defaultValue: 3,
      tooltip: "车辆使用年限"
    },
    {
      id: "drivingAge",
      name: "驾龄",
      label: "驾龄",
      type: "number",
      required: true,
      min: 0,
      max: 50,
      suffix: "年",
      defaultValue: 5,
      tooltip: "主驾驶员驾龄"
    },
    {
      id: "accidentCount",
      name: "上年出险次数",
      label: "上年出险次数",
      type: "select",
      required: true,
      options: [
        { label: "0次", value: 0 },
        { label: "1次", value: 1 },
        { label: "2次", value: 2 },
        { label: "3次及以上", value: 3 }
      ],
      defaultValue: 0
    },
    {
      id: "carValue",
      name: "车辆价值",
      label: "车辆价值",
      type: "number",
      required: true,
      min: 5,
      max: 200,
      suffix: "万元",
      defaultValue: 15,
      tooltip: "车辆当前市场价值"
    },
    {
      id: "cityLevel",
      name: "所在城市",
      label: "所在城市",
      type: "select",
      required: true,
      options: [
        { label: "一线城市", value: "tier1" },
        { label: "二线城市", value: "tier2" },
        { label: "三线及以下城市", value: "tier3" }
      ],
      defaultValue: "tier2"
    },
    {
      id: "hasCommercialInsurance",
      name: "是否投保商业险",
      label: "商业险",
      type: "radio",
      required: true,
      options: [
        { label: "投保", value: "yes" },
        { label: "不投保", value: "no" }
      ],
      defaultValue: "yes"
    },
    {
      id: "thirdPartyLiability",
      name: "第三者责任险保额",
      label: "第三者责任险保额",
      type: "select",
      required: true,
      options: [
        { label: "50万", value: 50 },
        { label: "100万", value: 100 },
        { label: "150万", value: 150 },
        { label: "200万", value: 200 }
      ],
      defaultValue: 100
    },
    {
      id: "hasDamageInsurance",
      name: "车损险",
      label: "车损险",
      type: "radio",
      required: true,
      options: [
        { label: "投保", value: "yes" },
        { label: "不投保", value: "no" }
      ],
      defaultValue: "yes"
    }
  ],
  coefficientTables: [
    {
      id: "accidentCoef",
      name: "出险次数系数表",
      description: "根据上年出险次数调整保费",
      rowKeyName: "出险次数",
      colKeyName: "调整",
      data: {
        "0": { "discount": 0.7 },
        "1": { "discount": 1.0 },
        "2": { "discount": 1.25 },
        "3": { "discount": 1.5 }
      }
    },
    {
      id: "carAgeCoef",
      name: "车龄系数表",
      description: "车龄越大保费越高",
      rowKeyName: "车龄",
      colKeyName: "调整",
      data: {
        "0": { "rate": 1.0 },
        "3": { "rate": 1.1 },
        "5": { "rate": 1.2 },
        "8": { "rate": 1.35 },
        "10": { "rate": 1.5 },
        "15": { "rate": 1.7 }
      }
    },
    {
      id: "cityCoef",
      name: "城市系数表",
      description: "不同城市风险系数不同",
      rowKeyName: "城市级别",
      colKeyName: "调整",
      data: {
        "tier1": { "rate": 1.15 },
        "tier2": { "rate": 1.0 },
        "tier3": { "rate": 0.9 }
      }
    },
    {
      id: "thirdPartyRate",
      name: "三者险基础费率表",
      description: "不同保额对应的基础保费",
      rowKeyName: "保额",
      colKeyName: "基础保费",
      data: {
        "50": { "premium": 800 },
        "100": { "premium": 1200 },
        "150": { "premium": 1500 },
        "200": { "premium": 1800 }
      }
    }
  ],
  formulas: [
    {
      id: "thirdPartyPremium",
      name: "第三者责任险保费",
      description: "基础保费 × 出险系数 × 城市系数",
      expression: "ROUND(LOOKUP(thirdPartyRate, $thirdPartyLiability, 'premium') * LOOKUP(accidentCoef, $accidentCount, 'discount') * LOOKUP(cityCoef, $cityLevel, 'rate'), 2)",
      dependencies: ["thirdPartyLiability", "accidentCount", "cityLevel"],
      showInResult: true,
      unit: "元"
    },
    {
      id: "damageInsurancePremium",
      name: "车损险保费",
      description: "车辆价值 × 费率 × 车龄系数 × 出险系数",
      expression: "IF($hasDamageInsurance == 'yes', ROUND($carValue * 10000 * 0.009 * LOOKUP(carAgeCoef, $carAge, 'rate') * LOOKUP(accidentCoef, $accidentCount, 'discount'), 2), 0)",
      dependencies: ["hasDamageInsurance", "carValue", "carAge", "accidentCount"],
      showInResult: true,
      unit: "元"
    },
    {
      id: "commercialInsuranceTotal",
      name: "商业险合计",
      description: "所有商业险项目合计",
      expression: "IF($hasCommercialInsurance == 'yes', @thirdPartyPremium + @damageInsurancePremium, 0)",
      dependencies: ["hasCommercialInsurance"],
      showInResult: true,
      unit: "元"
    },
    {
      id: "compulsoryInsurance",
      name: "交强险",
      description: "国家规定的交强险保费（固定）",
      expression: "950",
      dependencies: [],
      showInResult: true,
      unit: "元"
    },
    {
      id: "vehicleTax",
      name: "车船税",
      description: "根据车辆价值估算车船税",
      expression: "IF($carValue <= 10, 360, IF($carValue <= 25, 660, IF($carValue <= 40, 1200, 3600)))",
      dependencies: ["carValue"],
      showInResult: true,
      unit: "元"
    },
    {
      id: "totalPremium",
      name: "保费合计",
      description: "所有费用总和",
      expression: "@commercialInsuranceTotal + @compulsoryInsurance + @vehicleTax",
      dependencies: [],
      showInResult: true,
      unit: "元"
    }
  ],
  sections: [
    {
      id: "vehicle-info",
      title: "车辆信息",
      fieldIds: ["carAge", "carValue", "cityLevel"],
      collapsible: false
    },
    {
      id: "driver-info",
      title: "驾驶人信息",
      fieldIds: ["drivingAge", "accidentCount"],
      collapsible: false
    },
    {
      id: "insurance-options",
      title: "保险选项",
      fieldIds: ["hasCommercialInsurance", "thirdPartyLiability", "hasDamageInsurance"],
      collapsible: false
    }
  ]
}
