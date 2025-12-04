import { LiquidLogo } from "@/components/liquid-logo"

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-8">
      <div className="w-full max-w-2xl aspect-video">
        <LiquidLogo
          imageUrl="/svrn-wordmark.svg"
          patternScale={2}
          refraction={0.015}
          edge={0.4}
          patternBlur={0.005}
          liquid={0.07}
          speed={0.3}
        />
      </div>
    </main>
  )
}
