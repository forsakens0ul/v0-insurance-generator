"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, Clock, Download } from "lucide-react"
import { useQuoterStore } from "@/lib/quoter-store"
import type { QuoterConfig } from "@/lib/types"

interface HistoryRecord {
  id: string
  name: string
  config_data: QuoterConfig
  created_at: string
}

interface HistoryPanelProps {
  onClose: () => void
}

export function HistoryPanel({ onClose }: HistoryPanelProps) {
  const [histories, setHistories] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { setConfig } = useQuoterStore()

  useEffect(() => {
    loadHistories()
  }, [])

  const loadHistories = async () => {
    setLoading(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase 配置缺失")
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/quoter_configs?select=*&order=created_at.desc&limit=50`, {
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
      })

      if (!response.ok) {
        throw new Error("加载历史记录失败")
      }

      const data = await response.json()
      setHistories(data)
    } catch (error) {
      console.error("加载历史记录错误:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadConfig = (record: HistoryRecord) => {
    setConfig(record.config_data)
    onClose()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="w-[400px] border-l border-border bg-card flex flex-col h-full">
      <div className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <span className="font-semibold">历史记录</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              加载中...
            </div>
          ) : histories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>暂无历史记录</p>
              <p className="text-xs mt-1">保存配置后会显示在这里</p>
            </div>
          ) : (
            histories.map((record) => (
              <Card
                key={record.id}
                className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleLoadConfig(record)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {record.name}
                    </h4>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(record.created_at)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLoadConfig(record)
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
