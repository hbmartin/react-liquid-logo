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

export default function Home() {
  const [patternScale, setPatternScale] = useState(2)
  const [refraction, setRefraction] = useState(0.015)
  const [edge, setEdge] = useState(0.2)
  const [patternBlur, setPatternBlur] = useState(0.005)
  const [liquid, setLiquid] = useState(0.07)
  const [speed, setSpeed] = useState(0.1)
  const [timeScale, setTimeScale] = useState(0.0005)
  const [noiseSlowWeight, setNoiseSlowWeight] = useState(0.65)
  const [noiseMediumWeight, setNoiseMediumWeight] = useState(0.28)
  const [noiseFastWeight, setNoiseFastWeight] = useState(0.07)
  const [shimmerPower, setShimmerPower] = useState(4)
  const [shimmerIntensity, setShimmerIntensity] = useState(0.05)
  const [causticIntensity, setCausticIntensity] = useState(0.12)
  const [edgeBase, setEdgeBase] = useState(0.9)
  const [edgeRange, setEdgeRange] = useState(0.2)
  const [edgeFadeLow, setEdgeFadeLow] = useState(0.07)
  const [edgeFadeHigh, setEdgeFadeHigh] = useState(0.02)
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
      timeScale,
      noise: {
        slow: { weight: noiseSlowWeight },
        medium: { weight: noiseMediumWeight },
        fast: { weight: noiseFastWeight },
      },
      shimmer: {
        power: shimmerPower,
        intensity: shimmerIntensity,
      },
      caustics: {
        intensity: causticIntensity,
      },
      edge: {
        base: edgeBase,
        range: edgeRange,
        fadeLow: edgeFadeLow,
        fadeHigh: edgeFadeHigh,
      },
    }),
    [
      timeScale,
      noiseSlowWeight,
      noiseMediumWeight,
      noiseFastWeight,
      shimmerPower,
      shimmerIntensity,
      causticIntensity,
      edgeBase,
      edgeRange,
      edgeFadeLow,
      edgeFadeHigh,
    ]
  )

  const usageSnippet = useMemo(
    () => `<LiquidLogo
  imageUrl="/svrn-wordmark.svg"
  patternScale={${patternScale}}
  refraction={${refraction}}
  edge={${edge}}
  patternBlur={${patternBlur}}
  liquid={${liquid}}
  speed={${speed}}
  shaderConfig={{
    timeScale: ${timeScale},
    noise: {
      slow: { weight: ${noiseSlowWeight} },
      medium: { weight: ${noiseMediumWeight} },
      fast: { weight: ${noiseFastWeight} },
    },
    shimmer: {
      power: ${shimmerPower},
      intensity: ${shimmerIntensity},
    },
    caustics: {
      intensity: ${causticIntensity},
    },
    edge: {
      base: ${edgeBase},
      range: ${edgeRange},
      fadeLow: ${edgeFadeLow},
      fadeHigh: ${edgeFadeHigh},
    },
  }}
/>`,
    [
      patternScale,
      refraction,
      edge,
      patternBlur,
      liquid,
      speed,
      timeScale,
      noiseSlowWeight,
      noiseMediumWeight,
      noiseFastWeight,
      shimmerPower,
      shimmerIntensity,
      causticIntensity,
      edgeBase,
      edgeRange,
      edgeFadeLow,
      edgeFadeHigh,
    ]
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
    } catch {
      setCopied(false)
    }
  }, [usageSnippet])

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
                value={patternScale}
                displayValue={patternScale.toFixed(1)}
                min={0.1}
                max={10}
                step={0.1}
                onChange={setPatternScale}
              />
              <ControlSlider
                label="Pattern Blur"
                value={patternBlur}
                displayValue={patternBlur.toFixed(3)}
                min={0}
                max={0.05}
                step={0.001}
                onChange={setPatternBlur}
              />
              <ControlSlider
                label="Refraction"
                value={refraction}
                displayValue={refraction.toFixed(3)}
                min={0}
                max={0.1}
                step={0.001}
                onChange={setRefraction}
              />
              <ControlSlider
                label="Edge Detection"
                value={edge}
                displayValue={edge.toFixed(2)}
                min={0}
                max={1}
                step={0.01}
                onChange={setEdge}
              />
              <ControlSlider
                label="Liquid Distortion"
                value={liquid}
                displayValue={liquid.toFixed(2)}
                min={0}
                max={0.5}
                step={0.01}
                onChange={setLiquid}
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
                value={speed}
                displayValue={speed.toFixed(2)}
                min={0}
                max={2}
                step={0.01}
                onChange={setSpeed}
              />
              <ControlSlider
                label="Time Scale"
                value={timeScale}
                displayValue={timeScale.toFixed(4)}
                min={0.0001}
                max={0.001}
                step={0.00005}
                onChange={setTimeScale}
              />
              <ControlSlider
                label="Slow Noise Weight"
                value={noiseSlowWeight}
                displayValue={noiseSlowWeight.toFixed(2)}
                min={0}
                max={1}
                step={0.01}
                onChange={setNoiseSlowWeight}
              />
              <ControlSlider
                label="Medium Noise Weight"
                value={noiseMediumWeight}
                displayValue={noiseMediumWeight.toFixed(2)}
                min={0}
                max={1}
                step={0.01}
                onChange={setNoiseMediumWeight}
              />
              <ControlSlider
                label="Fast Noise Weight"
                value={noiseFastWeight}
                displayValue={noiseFastWeight.toFixed(2)}
                min={0}
                max={0.5}
                step={0.01}
                onChange={setNoiseFastWeight}
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
                value={shimmerPower}
                displayValue={shimmerPower.toFixed(1)}
                min={1}
                max={6}
                step={0.1}
                onChange={setShimmerPower}
              />
              <ControlSlider
                label="Shimmer Intensity"
                value={shimmerIntensity}
                displayValue={shimmerIntensity.toFixed(3)}
                min={0}
                max={0.15}
                step={0.001}
                onChange={setShimmerIntensity}
              />
              <ControlSlider
                label="Caustic Intensity"
                value={causticIntensity}
                displayValue={causticIntensity.toFixed(3)}
                min={0}
                max={0.3}
                step={0.005}
                onChange={setCausticIntensity}
              />
              <ControlSlider
                label="Edge Base"
                value={edgeBase}
                displayValue={edgeBase.toFixed(2)}
                min={0.7}
                max={1}
                step={0.01}
                onChange={setEdgeBase}
              />
              <ControlSlider
                label="Edge Range"
                value={edgeRange}
                displayValue={edgeRange.toFixed(2)}
                min={0}
                max={0.4}
                step={0.01}
                onChange={setEdgeRange}
              />
              <ControlSlider
                label="Edge Fade (Inner)"
                value={edgeFadeLow}
                displayValue={edgeFadeLow.toFixed(3)}
                min={0}
                max={0.2}
                step={0.001}
                onChange={setEdgeFadeLow}
              />
              <ControlSlider
                label="Edge Fade (Outer)"
                value={edgeFadeHigh}
                displayValue={edgeFadeHigh.toFixed(3)}
                min={0}
                max={0.2}
                step={0.001}
                onChange={setEdgeFadeHigh}
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
