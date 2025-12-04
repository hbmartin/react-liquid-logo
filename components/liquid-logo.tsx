"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import gsap from "gsap"
import { cn } from "@/lib/utils"
import { parseLogoImage } from "@/lib/parse-logo-image"
import { vertexShaderSource, liquidFragSource } from "@/lib/liquid-logo-shaders"

interface LiquidLogoProps {
  className?: string
  imageUrl: string
  patternScale?: number
  refraction?: number
  edge?: number
  patternBlur?: number
  liquid?: number
  speed?: number
  showProcessing?: boolean
}

export function LiquidLogo({
  className,
  imageUrl,
  patternScale = 2,
  refraction = 0.015,
  edge = 0.4,
  patternBlur = 0.005,
  liquid = 0.07,
  speed = 0.3,
  showProcessing = true,
}: LiquidLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGL2RenderingContext | null>(null)
  const uniformsRef = useRef<Record<string, WebGLUniformLocation>>({})
  const imageDataRef = useRef<ImageData | null>(null)
  const animationRef = useRef<{ time: number }>({ time: 0 })
  const cleanupTextureRef = useRef<(() => void) | null>(null)

  const [processing, setProcessing] = useState(false)

  // Create shader helper
  const createShader = useCallback((gl: WebGL2RenderingContext, sourceCode: string, type: number) => {
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, sourceCode)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader)
      return null
    }

    return shader
  }, [])

  // Get uniforms from program
  const getUniforms = useCallback((program: WebGLProgram, gl: WebGL2RenderingContext) => {
    const uniforms: Record<string, WebGLUniformLocation> = {}
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < uniformCount; i++) {
      const uniformName = gl.getActiveUniform(program, i)?.name
      if (!uniformName) continue
      const location = gl.getUniformLocation(program, uniformName)
      if (location) uniforms[uniformName] = location
    }
    return uniforms
  }, [])

  // Initialize WebGL shader
  const initShader = useCallback(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext("webgl2", {
      antialias: true,
      alpha: true,
    })
    if (!canvas || !gl) return

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const vertexShader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER)
    const fragmentShader = createShader(gl, liquidFragSource, gl.FRAGMENT_SHADER)
    const program = gl.createProgram()

    if (!program || !vertexShader || !fragmentShader) return

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return

    uniformsRef.current = getUniforms(program, gl)

    // Vertex position
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    const vertexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const positionLocation = gl.getAttribLocation(program, "a_position")
    gl.enableVertexAttribArray(positionLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    glRef.current = gl
  }, [createShader, getUniforms])

  // Update uniforms
  const updateUniforms = useCallback(() => {
    const gl = glRef.current
    const uniforms = uniformsRef.current
    if (!gl || !uniforms) return

    gl.uniform1f(uniforms.u_edge, edge)
    gl.uniform1f(uniforms.u_patternBlur, patternBlur)
    gl.uniform1f(uniforms.u_time, 0)
    gl.uniform1f(uniforms.u_patternScale, patternScale)
    gl.uniform1f(uniforms.u_refraction, refraction)
    gl.uniform1f(uniforms.u_liquid, liquid)
  }, [edge, patternBlur, patternScale, refraction, liquid])

  // Resize canvas
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const gl = glRef.current
    const uniforms = uniformsRef.current

    if (!canvas || !gl || !uniforms) return

    const imgRatio = imageDataRef.current ? imageDataRef.current.width / imageDataRef.current.height : 1

    const side = 1000
    canvas.width = side * devicePixelRatio
    canvas.height = side * devicePixelRatio
    gl.viewport(0, 0, canvas.height, canvas.height)
    gl.uniform1f(uniforms.u_ratio, 1)
    gl.uniform1f(uniforms.u_img_ratio, imgRatio)
  }, [])

  // Setup texture
  const setupTexture = useCallback(() => {
    const gl = glRef.current
    const uniforms = uniformsRef.current
    const imageData = imageDataRef.current

    if (!gl || !uniforms || !imageData) return

    // Delete existing texture
    const existingTexture = gl.getParameter(gl.TEXTURE_BINDING_2D)
    if (existingTexture) {
      gl.deleteTexture(existingTexture)
    }

    const imageTexture = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, imageTexture)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

    try {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        imageData.width,
        imageData.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        imageData.data,
      )
      gl.uniform1i(uniforms.u_image_texture, 0)
    } catch (e) {
      console.error("Failed to create texture", e)
    }

    return () => {
      if (imageTexture) {
        gl.deleteTexture(imageTexture)
      }
    }
  }, [])

  // Initialize and animate
  useEffect(() => {
    let gsapTicker: gsap.Callback

    const init = async () => {
      setProcessing(true)

      try {
        const { imageData } = await parseLogoImage(imageUrl)
        imageDataRef.current = imageData
      } catch (error) {
        console.error("Failed to process image", error)
        setProcessing(false)
        return
      }

      initShader()
      updateUniforms()
      cleanupTextureRef.current = setupTexture() || null

      setProcessing(false)
      resizeCanvas()

      // Use GSAP ticker for animation
      let lastTime = performance.now()
      gsapTicker = () => {
        const gl = glRef.current
        const uniforms = uniformsRef.current
        if (!gl || !uniforms) return

        const currentTime = performance.now()
        const deltaTime = currentTime - lastTime
        lastTime = currentTime

        animationRef.current.time += deltaTime * speed
        gl.uniform1f(uniforms.u_time, animationRef.current.time)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      }

      gsap.ticker.add(gsapTicker)
    }

    init()

    const handleResize = () => resizeCanvas()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      if (gsapTicker) {
        gsap.ticker.remove(gsapTicker)
      }
      if (cleanupTextureRef.current) {
        cleanupTextureRef.current()
      }
    }
  }, [imageUrl, speed, initShader, updateUniforms, setupTexture, resizeCanvas])

  // Update uniforms when props change
  useEffect(() => {
    updateUniforms()
  }, [updateUniforms])

  return (
    <>
      {processing && showProcessing && (
        <div className="flex size-full items-center justify-center text-2xl font-bold text-primary/50">
          <span>Processing Logo</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={cn("block size-full object-contain", className, {
          hidden: processing,
        })}
      />
    </>
  )
}
