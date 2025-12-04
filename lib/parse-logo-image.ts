export function parseLogoImage(imageUrl: string): Promise<{ imageData: ImageData }> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  return new Promise((resolve, reject) => {
    if (!imageUrl || !ctx) {
      reject(new Error('Invalid image URL or context'))
      return
    }

    const isSvg = imageUrl.toLowerCase().endsWith('.svg') || imageUrl.startsWith('data:image/svg')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const TARGET_SIZE = 1200
      let width: number
      let height: number
      const aspectRatio = img.naturalWidth / img.naturalHeight

      // For SVGs, ignore naturalWidth/Height (which come from viewBox) and render at target size
      // For raster images, scale based on actual dimensions
      if (isSvg) {
        if (aspectRatio >= 1) {
          width = TARGET_SIZE
          height = Math.round(TARGET_SIZE / aspectRatio)
        } else {
          height = TARGET_SIZE
          width = Math.round(TARGET_SIZE * aspectRatio)
        }
      } else {
        width = img.naturalWidth
        height = img.naturalHeight
        const MAX_SIZE = 1500
        const MIN_SIZE = 800

        if (width > MAX_SIZE || height > MAX_SIZE || width < MIN_SIZE || height < MIN_SIZE) {
          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width)
              width = MAX_SIZE
            } else if (width < MIN_SIZE) {
              height = Math.round((height * MIN_SIZE) / width)
              width = MIN_SIZE
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height)
              height = MAX_SIZE
            } else if (height < MIN_SIZE) {
              width = Math.round((width * MIN_SIZE) / height)
              height = MIN_SIZE
            }
          }
        }
      }

      canvas.width = width
      canvas.height = height

      const shapeCanvas = document.createElement('canvas')
      shapeCanvas.width = width
      shapeCanvas.height = height
      const shapeCtx = shapeCanvas.getContext('2d')!

      // Enable high-quality image smoothing for better anti-aliasing
      shapeCtx.imageSmoothingEnabled = true
      shapeCtx.imageSmoothingQuality = 'high'

      shapeCtx.fillStyle = 'white'
      shapeCtx.fillRect(0, 0, width, height)
      shapeCtx.drawImage(img, 0, 0, width, height)

      const shapeImageData = shapeCtx.getImageData(0, 0, width, height)
      const data = shapeImageData.data
      const shapeMask = new Array(width * height).fill(false)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx4 = (y * width + x) * 4
          const r = data[idx4]
          const g = data[idx4 + 1]
          const b = data[idx4 + 2]
          const a = data[idx4 + 3]
          const brightness = (r + g + b) / 3
          shapeMask[y * width + x] = brightness < 200 && a > 50
        }
      }

      function inside(x: number, y: number) {
        if (x < 0 || x >= width || y < 0 || y >= height) return false
        return shapeMask[y * width + x]
      }

      const boundaryMask = new Array(width * height).fill(false)
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x
          if (!shapeMask[idx]) continue
          let isBoundary = false
          for (let ny = y - 1; ny <= y + 1 && !isBoundary; ny++) {
            for (let nx = x - 1; nx <= x + 1 && !isBoundary; nx++) {
              if (!inside(nx, ny)) {
                isBoundary = true
              }
            }
          }
          if (isBoundary) {
            boundaryMask[idx] = true
          }
        }
      }

      const u = new Float32Array(width * height).fill(0)
      const newU = new Float32Array(width * height).fill(0)
      const C = 0.01
      const ITERATIONS = 500

      function getU(x: number, y: number, arr: Float32Array) {
        if (x < 0 || x >= width || y < 0 || y >= height) return 0
        if (!shapeMask[y * width + x]) return 0
        return arr[y * width + x]
      }

      for (let iter = 0; iter < ITERATIONS; iter++) {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x
            if (!shapeMask[idx] || boundaryMask[idx]) {
              newU[idx] = 0
              continue
            }
            const sumN =
              getU(x + 1, y, u) + getU(x - 1, y, u) + getU(x, y + 1, u) + getU(x, y - 1, u)
            newU[idx] = (C + sumN) / 4
          }
        }
        u.set(newU)
      }

      let maxVal = 0
      for (let i = 0; i < width * height; i++) {
        if (u[i] > maxVal) maxVal = u[i]
      }

      const alpha = 0.8
      const outImg = ctx.createImageData(width, height)

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x
          const px = idx * 4
          if (!shapeMask[idx]) {
            outImg.data[px] = 255
            outImg.data[px + 1] = 255
            outImg.data[px + 2] = 255
            outImg.data[px + 3] = 255
          } else {
            const raw = maxVal > 0 ? u[idx] / maxVal : 0
            const remapped = Math.pow(raw, alpha)
            const gray = Math.min(200, 255 * (1 - remapped))
            outImg.data[px] = gray
            outImg.data[px + 1] = gray
            outImg.data[px + 2] = gray
            outImg.data[px + 3] = 255
          }
        }
      }
      resolve({
        imageData: outImg,
      })
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}
