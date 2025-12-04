'use client'

import { useEffect, useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

export interface ControlSliderProps {
  label: string
  value: number
  displayValue: string
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  debounceMs?: number
}

export function ControlSlider({
  label,
  value,
  displayValue,
  min,
  max,
  step,
  onChange,
  debounceMs = 200,
}: ControlSliderProps) {
  const [internalValue, setInternalValue] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  const handleValueChange = ([next]: number[]) => {
    setInternalValue(next)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      onChange(next)
    }, debounceMs)
  }

  return (
    <div className="space-y-2">
      <Label className="text-white">
        {label}: <span className="text-white font-mono">{displayValue}</span>
      </Label>
      <Slider
        value={[internalValue]}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
      />
    </div>
  )
}
