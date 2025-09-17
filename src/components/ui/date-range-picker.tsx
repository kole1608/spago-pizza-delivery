'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DatePickerWithRangeProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePickerWithRange({
  value,
  onChange,
  placeholder = "Pick a date range",
  className
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(value)

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return placeholder
    
    if (!range.to) {
      return range.from.toLocaleDateString()
    }
    
    return `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
  }

  const handlePresetSelect = (preset: string) => {
    const now = new Date()
    let from: Date
    let to: Date = now

    switch (preset) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'yesterday':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
        break
      case 'last7days':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'last30days':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'lastMonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
        break
      default:
        return
    }

    const newRange = { from, to }
    setSelectedRange(newRange)
    onChange?.(newRange)
    setIsOpen(false)
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start text-left font-normal"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {formatDateRange(selectedRange)}
      </Button>
      
      {isOpen && (
        <Card className="absolute z-50 mt-2 w-64">
          <CardContent className="p-3">
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePresetSelect('today')}
                className="w-full justify-start"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePresetSelect('yesterday')}
                className="w-full justify-start"
              >
                Yesterday
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePresetSelect('last7days')}
                className="w-full justify-start"
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePresetSelect('last30days')}
                className="w-full justify-start"
              >
                Last 30 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePresetSelect('thisMonth')}
                className="w-full justify-start"
              >
                This month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePresetSelect('lastMonth')}
                className="w-full justify-start"
              >
                Last month
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}