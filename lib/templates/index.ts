import type { QuoterConfig } from "../types"
import { defaultInsuranceConfig } from "../types"
import { tuanyiConfig } from "./tuanyi-config"

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
]

export function getTemplateById(id: string): TemplateOption | undefined {
  return templates.find((t) => t.id === id)
}

export function getDefaultTemplate(): TemplateOption {
  return templates[0]
}
