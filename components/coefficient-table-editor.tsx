"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, X } from "lucide-react"
import { useQuoterStore } from "@/lib/quoter-store"
import type { CoefficientTable } from "@/lib/types"

interface CoefficientTableEditorProps {
  table: CoefficientTable
}

export function CoefficientTableEditor({ table }: CoefficientTableEditorProps) {
  const { updateCoefficientCell, addCoefficientRow, addCoefficientCol, deleteCoefficientRow, deleteCoefficientCol } =
    useQuoterStore()
  const [newRowKey, setNewRowKey] = useState("")
  const [newColKey, setNewColKey] = useState("")
  const [addRowOpen, setAddRowOpen] = useState(false)
  const [addColOpen, setAddColOpen] = useState(false)

  const rowKeys = Object.keys(table.data)
  const colKeys = rowKeys.length > 0 ? Object.keys(table.data[rowKeys[0]]) : []

  const handleAddRow = () => {
    if (newRowKey.trim()) {
      addCoefficientRow(table.id, newRowKey.trim())
      setNewRowKey("")
      setAddRowOpen(false)
    }
  }

  const handleAddCol = () => {
    if (newColKey.trim()) {
      addCoefficientCol(table.id, newColKey.trim())
      setNewColKey("")
      setAddColOpen(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          行键: {table.rowKeyName} | 列键: {table.colKeyName}
        </div>
        <div className="flex gap-1">
          <Dialog open={addRowOpen} onOpenChange={setAddRowOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                <Plus className="h-3 w-3 mr-1" />
                添加行
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[300px]">
              <DialogHeader>
                <DialogTitle>添加新行</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">{table.rowKeyName}</Label>
                  <Input
                    value={newRowKey}
                    onChange={(e) => setNewRowKey(e.target.value)}
                    placeholder={`输入${table.rowKeyName}`}
                    className="h-8"
                  />
                </div>
                <Button onClick={handleAddRow} className="w-full h-8">
                  确定
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={addColOpen} onOpenChange={setAddColOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs bg-transparent">
                <Plus className="h-3 w-3 mr-1" />
                添加列
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[300px]">
              <DialogHeader>
                <DialogTitle>添加新列</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">{table.colKeyName}</Label>
                  <Input
                    value={newColKey}
                    onChange={(e) => setNewColKey(e.target.value)}
                    placeholder={`输入${table.colKeyName}`}
                    className="h-8"
                  />
                </div>
                <Button onClick={handleAddCol} className="w-full h-8">
                  确定
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-2 text-left font-medium border-r border-b min-w-[80px]">
                {table.rowKeyName} \ {table.colKeyName}
              </th>
              {colKeys.map((colKey) => (
                <th key={colKey} className="p-2 text-center font-medium border-r border-b min-w-[60px] group relative">
                  {colKey}
                  <button
                    onClick={() => deleteCoefficientCol(table.id, colKey)}
                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((rowKey) => (
              <tr key={rowKey} className="group hover:bg-muted/30">
                <td className="p-2 font-medium border-r border-b bg-muted/20 relative">
                  {rowKey}
                  <button
                    onClick={() => deleteCoefficientRow(table.id, rowKey)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </td>
                {colKeys.map((colKey) => (
                  <td key={colKey} className="p-1 border-r border-b">
                    <Input
                      type="number"
                      step="0.001"
                      value={table.data[rowKey]?.[colKey] ?? 0}
                      onChange={(e) => updateCoefficientCell(table.id, rowKey, colKey, Number(e.target.value))}
                      className="h-7 text-xs text-center px-1"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
