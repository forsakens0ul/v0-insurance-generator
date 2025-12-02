"use client"

import React from "react"
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import type { QuoterConfig } from "@/lib/types"

Font.register({
  family: "NotoSansSC",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/notosanssc/v36/k3kXo84MPvpLmixcA63oeALhLOCT-xWNm8Hqd37x1OD6ys8jMwQN5gk.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/notosanssc/v36/k3kXo84MPvpLmixcA63oeALhLOCT-xWNm8Hqd3711eD6ys8jMwQN5gk.ttf",
      fontWeight: 700,
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "NotoSansSC",
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    borderBottom: "2 solid #2563eb",
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1e40af",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: "#64748b",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 12,
    paddingLeft: 10,
    borderLeft: "4 solid #3b82f6",
  },
  fieldRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    marginBottom: 4,
    borderRadius: 4,
  },
  fieldLabel: {
    width: "40%",
    fontSize: 10,
    color: "#475569",
  },
  fieldValue: {
    width: "60%",
    fontSize: 10,
    color: "#0f172a",
    fontWeight: 700,
  },
  resultSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    border: "1 solid #93c5fd",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottom: "1 solid #dbeafe",
  },
  resultLabel: {
    fontSize: 11,
    color: "#1e40af",
  },
  resultValue: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1e40af",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 8,
    borderTop: "2 solid #3b82f6",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e40af",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#dc2626",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center",
    paddingTop: 15,
    borderTop: "1 solid #e2e8f0",
  },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-45deg)",
    fontSize: 80,
    color: "#f1f5f9",
    opacity: 0.3,
    fontWeight: 700,
  },
})

interface PDFQuotationProps {
  config: QuoterConfig
  formValues: Record<string, any>
  calculatedValues: Record<string, number>
}

export const PDFQuotation: React.FC<PDFQuotationProps> = ({
  config,
  formValues,
  calculatedValues,
}) => {
  const formatFieldValue = (field: any, value: any) => {
    if (field.type === "radio" || field.type === "select") {
      const option = field.options?.find((opt: any) => opt.value === value)
      return option ? option.label : String(value)
    }
    if (field.type === "number") {
      return `${value}${field.suffix || ""}`
    }
    return String(value)
  }

  const visibleFormulas = config.formulas.filter((f) => f.showInResult)
  const totalPremiumFormula = config.formulas.find((f) => f.id === "totalPremium")

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark}>{config.name}</Text>

        <View style={styles.header}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>
            报价日期：{new Date().toLocaleDateString("zh-CN")}
          </Text>
        </View>

        {config.sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.fieldIds.map((fieldId) => {
              const field = config.fields.find((f) => f.id === fieldId)
              if (!field) return null
              return (
                <View key={fieldId} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{field.label}：</Text>
                  <Text style={styles.fieldValue}>
                    {formatFieldValue(field, formValues[fieldId])}
                  </Text>
                </View>
              )
            })}
          </View>
        ))}

        <View style={styles.resultSection}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#1e40af",
              marginBottom: 12,
            }}
          >
            计算结果
          </Text>

          {visibleFormulas.map((formula) => {
            if (formula.id === "totalPremium") return null
            const value = calculatedValues[formula.id]
            return (
              <View key={formula.id} style={styles.resultRow}>
                <Text style={styles.resultLabel}>{formula.name}</Text>
                <Text style={styles.resultValue}>
                  {typeof value === "number" ? value.toFixed(2) : "0.00"}{" "}
                  {formula.unit || ""}
                </Text>
              </View>
            )
          })}

          {totalPremiumFormula && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{totalPremiumFormula.name}</Text>
              <Text style={styles.totalValue}>
                {typeof calculatedValues.totalPremium === "number"
                  ? calculatedValues.totalPremium.toFixed(2)
                  : "0.00"}{" "}
                {totalPremiumFormula.unit || "元"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text>本报价单仅供参考，实际保费以保险公司核保结果为准</Text>
          <Text style={{ marginTop: 4 }}>
            报价单编号：{Date.now().toString(36).toUpperCase()}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
