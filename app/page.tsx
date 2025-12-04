"use client"

import { useState } from "react"
import { LiquidLogo } from "@/components/liquid-logo"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export default function Home() {
  const [patternScale, setPatternScale] = useState(2)
  const [refraction, setRefraction] = useState(0.015)
  const [edge, setEdge] = useState(0.2)
  const [patternBlur, setPatternBlur] = useState(0.005)
  const [liquid, setLiquid] = useState(0.07)
  const [speed, setSpeed] = useState(0.1)

  return (
    <main className="flex flex-col md:flex-row min-h-screen items-center justify-center gap-8 md:gap-12 bg-black p-4 md:p-8">
      <div className="w-full max-w-2xl aspect-video">
        <LiquidLogo
          imageUrl="/svrn-wordmark.svg"
          patternScale={patternScale}
          refraction={refraction}
          edge={edge}
          patternBlur={patternBlur}
          liquid={liquid}
          speed={speed}
        />
      </div>

      <div className="w-full max-w-xs space-y-6">
        <div className="space-y-2">
          <Label className="text-white/80">
            Pattern Scale: <span className="text-white font-mono">{patternScale.toFixed(1)}</span>
          </Label>
          <Slider
            value={[patternScale]}
            onValueChange={([v]) => setPatternScale(v)}
            min={0.1}
            max={10}
            step={0.1}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">
            Refraction: <span className="text-white font-mono">{refraction.toFixed(3)}</span>
          </Label>
          <Slider
            value={[refraction]}
            onValueChange={([v]) => setRefraction(v)}
            min={0}
            max={0.1}
            step={0.001}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">
            Edge: <span className="text-white font-mono">{edge.toFixed(2)}</span>
          </Label>
          <Slider
            value={[edge]}
            onValueChange={([v]) => setEdge(v)}
            min={0}
            max={1}
            step={0.01}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">
            Pattern Blur: <span className="text-white font-mono">{patternBlur.toFixed(3)}</span>
          </Label>
          <Slider
            value={[patternBlur]}
            onValueChange={([v]) => setPatternBlur(v)}
            min={0}
            max={0.05}
            step={0.001}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">
            Liquid: <span className="text-white font-mono">{liquid.toFixed(2)}</span>
          </Label>
          <Slider
            value={[liquid]}
            onValueChange={([v]) => setLiquid(v)}
            min={0}
            max={0.5}
            step={0.01}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">
            Speed: <span className="text-white font-mono">{speed.toFixed(2)}</span>
          </Label>
          <Slider
            value={[speed]}
            onValueChange={([v]) => setSpeed(v)}
            min={0}
            max={2}
            step={0.01}
          />
        </div>
      </div>
    </main>
  )
}
