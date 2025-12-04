'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LiquidLogo } from '@/components/liquid-logo'
import { ControlSlider } from '@/components/control-slider'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

type MaterialSettings = {
  patternScale: number
  patternBlur: number
  refraction: number
  liquid: number
  edge: number
}

type MotionSettings = {
  speed: number
  timeScale: number
}

type NoiseWeights = {
  slow: number
  medium: number
  fast: number
}

type LightingSettings = {
  shimmerPower: number
  shimmerIntensity: number
  causticIntensity: number
}

type EdgeParameters = {
  base: number
  range: number
  fadeLow: number
  fadeHigh: number
}

const DEFAULT_MATERIAL: MaterialSettings = {
  patternScale: 2,
  patternBlur: 0.005,
  refraction: 0.015,
  liquid: 0.07,
  edge: 0.2,
}

const DEFAULT_MOTION: MotionSettings = {
  speed: 0.1,
  timeScale: 0.0005,
}

const DEFAULT_NOISE_WEIGHTS: NoiseWeights = {
  slow: 0.65,
  medium: 0.28,
  fast: 0.07,
}

const DEFAULT_LIGHTING: LightingSettings = {
  shimmerPower: 4,
  shimmerIntensity: 0.05,
  causticIntensity: 0.12,
}

const DEFAULT_EDGE_PARAMETERS: EdgeParameters = {
  base: 0.9,
  range: 0.2,
  fadeLow: 0.07,
  fadeHigh: 0.02,
}

export default function Home() {
  const [material, setMaterial] = useState<MaterialSettings>(() => ({
    ...DEFAULT_MATERIAL,
  }))
  const [motion, setMotion] = useState<MotionSettings>(() => ({
    ...DEFAULT_MOTION,
  }))
  const [noiseWeights, setNoiseWeights] = useState<NoiseWeights>(() => ({
    ...DEFAULT_NOISE_WEIGHTS,
  }))
  const [lighting, setLighting] = useState<LightingSettings>(() => ({
    ...DEFAULT_LIGHTING,
  }))
  const [edgeParams, setEdgeParams] = useState<EdgeParameters>(() => ({
    ...DEFAULT_EDGE_PARAMETERS,
  }))
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const shaderConfig = useMemo(
    () => ({
      timeScale: motion.timeScale,
      noise: {
        slow: { weight: noiseWeights.slow },
        medium: { weight: noiseWeights.medium },
        fast: { weight: noiseWeights.fast },
      },
      shimmer: {
        power: lighting.shimmerPower,
        intensity: lighting.shimmerIntensity,
      },
      caustics: {
        intensity: lighting.causticIntensity,
      },
      edge: {
        base: edgeParams.base,
        range: edgeParams.range,
        fadeLow: edgeParams.fadeLow,
        fadeHigh: edgeParams.fadeHigh,
      },
    }),
    [motion.timeScale, noiseWeights, lighting, edgeParams]
  )

  const usageSnippet = useMemo(
    () => `<LiquidLogo
  imageUrl="/svrn-wordmark.svg"
  patternScale={${material.patternScale}}
  refraction={${material.refraction}}
  edge={${material.edge}}
  patternBlur={${material.patternBlur}}
  liquid={${material.liquid}}
  speed={${motion.speed}}
  shaderConfig={{
    timeScale: ${motion.timeScale},
    noise: {
      slow: { weight: ${noiseWeights.slow} },
      medium: { weight: ${noiseWeights.medium} },
      fast: { weight: ${noiseWeights.fast} },
    },
    shimmer: {
      power: ${lighting.shimmerPower},
      intensity: ${lighting.shimmerIntensity},
    },
    caustics: {
      intensity: ${lighting.causticIntensity},
    },
    edge: {
      base: ${edgeParams.base},
      range: ${edgeParams.range},
      fadeLow: ${edgeParams.fadeLow},
      fadeHigh: ${edgeParams.fadeHigh},
    },
  }}
/>`,
    [material, motion, noiseWeights, lighting, edgeParams]
  )

  const handleCopyUsage = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return
    }
    try {
      await navigator.clipboard.writeText(usageSnippet)
      setCopied(true)
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy: ', err)
      setCopied(false)
    }
  }, [usageSnippet])

  return (
    <main className="flex flex-col md:flex-row min-h-screen items-center justify-center gap-8 md:gap-12 bg-black p-4 md:p-8">
      <div className="w-full max-w-2xl aspect-video">
        <LiquidLogo
          imageUrl="/svrn-wordmark.svg"
          patternScale={material.patternScale}
          refraction={material.refraction}
          edge={material.edge}
          patternBlur={material.patternBlur}
          liquid={material.liquid}
          speed={motion.speed}
          shaderConfig={shaderConfig}
        />
      </div>

      <Accordion
        type="single"
        className="shadow-xs shadow-white/50 w-full max-w-xs divide-y divide-white/10 rounded-lg border border-white/10 bg-white/10 backdrop-blur"
      >
        <AccordionItem value="material">
          <AccordionTrigger className="text-white">Material</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              <ControlSlider
                label="Pattern Scale"
                value={material.patternScale}
                displayValue={material.patternScale.toFixed(1)}
                min={0.1}
                max={10}
                step={0.1}
                onChange={(value) => setMaterial((prev) => ({ ...prev, patternScale: value }))}
              />
              <ControlSlider
                label="Pattern Blur"
                value={material.patternBlur}
                displayValue={material.patternBlur.toFixed(3)}
                min={0}
                max={0.05}
                step={0.001}
                onChange={(value) => setMaterial((prev) => ({ ...prev, patternBlur: value }))}
              />
              <ControlSlider
                label="Refraction"
                value={material.refraction}
                displayValue={material.refraction.toFixed(3)}
                min={0}
                max={0.1}
                step={0.001}
                onChange={(value) => setMaterial((prev) => ({ ...prev, refraction: value }))}
              />
              <ControlSlider
                label="Edge Detection"
                value={material.edge}
                displayValue={material.edge.toFixed(2)}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => setMaterial((prev) => ({ ...prev, edge: value }))}
              />
              <ControlSlider
                label="Liquid Distortion"
                value={material.liquid}
                displayValue={material.liquid.toFixed(2)}
                min={0}
                max={0.5}
                step={0.01}
                onChange={(value) => setMaterial((prev) => ({ ...prev, liquid: value }))}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="motion">
          <AccordionTrigger className="text-white">Motion & Flow</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              <ControlSlider
                label="Playback Speed"
                value={motion.speed}
                displayValue={motion.speed.toFixed(2)}
                min={0}
                max={2}
                step={0.01}
                onChange={(value) => setMotion((prev) => ({ ...prev, speed: value }))}
              />
              <ControlSlider
                label="Time Scale"
                value={motion.timeScale}
                displayValue={motion.timeScale.toFixed(4)}
                min={0.0001}
                max={0.001}
                step={0.00005}
                onChange={(value) => setMotion((prev) => ({ ...prev, timeScale: value }))}
              />
              <ControlSlider
                label="Slow Noise Weight"
                value={noiseWeights.slow}
                displayValue={noiseWeights.slow.toFixed(2)}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => setNoiseWeights((prev) => ({ ...prev, slow: value }))}
              />
              <ControlSlider
                label="Medium Noise Weight"
                value={noiseWeights.medium}
                displayValue={noiseWeights.medium.toFixed(2)}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => setNoiseWeights((prev) => ({ ...prev, medium: value }))}
              />
              <ControlSlider
                label="Fast Noise Weight"
                value={noiseWeights.fast}
                displayValue={noiseWeights.fast.toFixed(2)}
                min={0}
                max={0.5}
                step={0.01}
                onChange={(value) => setNoiseWeights((prev) => ({ ...prev, fast: value }))}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="lighting">
          <AccordionTrigger className="text-white">Lighting & Tone</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              <ControlSlider
                label="Shimmer Power"
                value={lighting.shimmerPower}
                displayValue={lighting.shimmerPower.toFixed(1)}
                min={1}
                max={6}
                step={0.1}
                onChange={(value) => setLighting((prev) => ({ ...prev, shimmerPower: value }))}
              />
              <ControlSlider
                label="Shimmer Intensity"
                value={lighting.shimmerIntensity}
                displayValue={lighting.shimmerIntensity.toFixed(3)}
                min={0}
                max={0.15}
                step={0.001}
                onChange={(value) => setLighting((prev) => ({ ...prev, shimmerIntensity: value }))}
              />
              <ControlSlider
                label="Caustic Intensity"
                value={lighting.causticIntensity}
                displayValue={lighting.causticIntensity.toFixed(3)}
                min={0}
                max={0.3}
                step={0.005}
                onChange={(value) => setLighting((prev) => ({ ...prev, causticIntensity: value }))}
              />
              <ControlSlider
                label="Edge Base"
                value={edgeParams.base}
                displayValue={edgeParams.base.toFixed(2)}
                min={0.7}
                max={1}
                step={0.01}
                onChange={(value) => setEdgeParams((prev) => ({ ...prev, base: value }))}
              />
              <ControlSlider
                label="Edge Range"
                value={edgeParams.range}
                displayValue={edgeParams.range.toFixed(2)}
                min={0}
                max={0.4}
                step={0.01}
                onChange={(value) => setEdgeParams((prev) => ({ ...prev, range: value }))}
              />
              <ControlSlider
                label="Edge Fade (Inner)"
                value={edgeParams.fadeLow}
                displayValue={edgeParams.fadeLow.toFixed(3)}
                min={0}
                max={0.2}
                step={0.001}
                onChange={(value) => setEdgeParams((prev) => ({ ...prev, fadeLow: value }))}
              />
              <ControlSlider
                label="Edge Fade (Outer)"
                value={edgeParams.fadeHigh}
                displayValue={edgeParams.fadeHigh.toFixed(3)}
                min={0}
                max={0.2}
                step={0.001}
                onChange={(value) => setEdgeParams((prev) => ({ ...prev, fadeHigh: value }))}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="usage">
          <AccordionTrigger className="text-white">Code Usage</AccordionTrigger>
          <AccordionContent>
            <div className="relative">
              <button
                type="button"
                onClick={handleCopyUsage}
                className="absolute right-3 top-3 rounded border border-white/30 bg-white/10 px-2 py-1 text-xs font-medium uppercase tracking-wide text-white transition hover:bg-white/20 active:bg-white/30"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <pre className="whitespace-pre overflow-x-auto rounded-md bg-black/60 p-4 pr-16 font-mono text-xs text-white">
                {usageSnippet}
              </pre>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  )
}
