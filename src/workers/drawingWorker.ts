/**
 * Drawing Worker
 * 
 * Handles heavy canvas operations off the main thread:
 * - Image data URL generation
 * - Image compression
 * - Filter applications
 * - Export operations
 */

export interface DrawingWorkerInput {
  type: 'PROCESS_DRAWING' | 'APPLY_FILTER' | 'COMPRESS_IMAGE'
  imageData?: ImageData
  canvas?: OffscreenCanvas
  quality?: number
  format?: 'image/png' | 'image/jpeg' | 'image/webp'
  filter?: 'grayscale' | 'sepia' | 'invert' | 'brightness' | 'contrast'
  filterValue?: number
}

export interface DrawingWorkerOutput {
  type: 'DRAWING_PROCESSED' | 'FILTER_APPLIED' | 'IMAGE_COMPRESSED' | 'ERROR'
  dataURL?: string
  blob?: Blob
  processingTime?: number
  error?: string
}

self.onmessage = async (event: MessageEvent<DrawingWorkerInput>) => {
  const startTime = performance.now()
  const { type, imageData, canvas, quality = 0.92, format = 'image/png', filter, filterValue } = event.data

  try {
    switch (type) {
      case 'PROCESS_DRAWING': {
        if (!canvas) {
          throw new Error('Canvas required for PROCESS_DRAWING')
        }

        // Convert canvas to blob
        const blob = await canvas.convertToBlob({ type: format, quality })
        
        // Convert blob to data URL
        const dataURL = await blobToDataURL(blob)

        const processingTime = performance.now() - startTime

        self.postMessage({
          type: 'DRAWING_PROCESSED',
          dataURL,
          blob,
          processingTime
        } as DrawingWorkerOutput)
        break
      }

      case 'APPLY_FILTER': {
        if (!imageData) {
          throw new Error('ImageData required for APPLY_FILTER')
        }

        const filteredData = applyImageFilter(imageData, filter, filterValue)
        const processingTime = performance.now() - startTime

        self.postMessage({
          type: 'FILTER_APPLIED',
          imageData: filteredData,
          processingTime
        } as DrawingWorkerOutput)
        break
      }

      case 'COMPRESS_IMAGE': {
        if (!imageData) {
          throw new Error('ImageData required for COMPRESS_IMAGE')
        }

        // Create offscreen canvas for compression
        const offscreen = new OffscreenCanvas(imageData.width, imageData.height)
        const ctx = offscreen.getContext('2d')
        
        if (!ctx) {
          throw new Error('Failed to get 2d context')
        }

        ctx.putImageData(imageData, 0, 0)
        
        // Convert to blob with compression
        const blob = await offscreen.convertToBlob({ type: format, quality })
        const dataURL = await blobToDataURL(blob)

        const processingTime = performance.now() - startTime

        self.postMessage({
          type: 'IMAGE_COMPRESSED',
          dataURL,
          blob,
          processingTime
        } as DrawingWorkerOutput)
        break
      }

      default:
        throw new Error(`Unknown worker command: ${type}`)
    }
  } catch (error) {
    console.error('[DrawingWorker] Error:', error)
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as DrawingWorkerOutput)
  }
}

/**
 * Convert Blob to Data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Apply image filters
 */
function applyImageFilter(
  imageData: ImageData,
  filter?: string,
  value: number = 1
): ImageData {
  if (!filter) return imageData

  const data = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    switch (filter) {
      case 'grayscale': {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        data[i] = gray
        data[i + 1] = gray
        data[i + 2] = gray
        break
      }

      case 'sepia': {
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
        break
      }

      case 'invert': {
        data[i] = 255 - r
        data[i + 1] = 255 - g
        data[i + 2] = 255 - b
        break
      }

      case 'brightness': {
        data[i] = Math.min(255, r * value)
        data[i + 1] = Math.min(255, g * value)
        data[i + 2] = Math.min(255, b * value)
        break
      }

      case 'contrast': {
        const factor = (259 * (value + 255)) / (255 * (259 - value))
        data[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128))
        data[i + 1] = Math.min(255, Math.max(0, factor * (g - 128) + 128))
        data[i + 2] = Math.min(255, Math.max(0, factor * (b - 128) + 128))
        break
      }
    }
  }

  return new ImageData(data, width, height)
}

console.log('[DrawingWorker] Worker initialized')
