import type { QuoterConfig } from "../types"
import { defaultInsuranceConfig } from "../types"
import { tuanyiConfig } from "./tuanyi-config"
import { carInsuranceConfig } from "./car-insurance-config"
import { healthInsuranceConfig } from "./health-insurance-config"
import { lifeInsuranceConfig } from "./life-insurance-config"

export interface TemplateOption {
  id: string
  name: string
  description: string
  icon: string
  config: QuoterConfig
}

export const templates: TemplateOption[] = [
  {
    id: "personal-accident",
    name: "个人意外险",
    description: "适用于个人意外伤害保险产品报价",
    icon: "👤",
    config: defaultInsuranceConfig,
  },
  {
    id: "group-accident",
    name: "团体意外险",
    description: "适用于企业团体意外伤害保险产品报价",
    icon: "👥",
    config: tuanyiConfig,
  },
  {
    id: "car-insurance",
    name: "车险报价器",
    description: "私家车商业险及交强险报价计算",
    icon: "🚗",
    config: carInsuranceConfig,
  },
  {
    id: "health-insurance",
    name: "健康险报价器",
    description: "健康医疗保险产品报价，含风险评估",
    icon: "🏥",
    config: healthInsuranceConfig,
  },
  {
    id: "life-insurance",
    name: "定期寿险",
    description: "定期寿险产品报价，支持多种缴费方案",
    icon: "💼",
    config: lifeInsuranceConfig,
  },
]

export function getTemplateById(id: string): TemplateOption | undefined {
  return templates.find((t) => t.id === id)
}

export function getDefaultTemplate(): TemplateOption {
  return templates[0]
}
