/**
 * Drawing Worker Hook
 * 
 * Manages Web Worker lifecycle for canvas operations.
 * Provides fallback to main thread if Worker API unavailable.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import type { DrawingWorkerInput, DrawingWorkerOutput } from '@/workers/drawingWorker'

interface UseDrawingWorkerOptions {
  onProcessed?: (data: DrawingWorkerOutput) => void
  onError?: (error: Error) => void
}

export function useDrawingWorker(options: UseDrawingWorkerOptions = {}) {
  const workerRef = useRef<Worker | null>(null)
  const [isWorkerSupported, setIsWorkerSupported] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Initialize worker on mount
  useEffect(() => {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') {
      console.warn('[DrawingWorker] Web Workers or OffscreenCanvas not supported, using fallback')
      setIsWorkerSupported(false)
      return
    }

    try {
      workerRef.current = new Worker(
        new URL('../workers/drawingWorker.ts', import.meta.url),
        { type: 'module' }
      )

      workerRef.current.onmessage = (event: MessageEvent<DrawingWorkerOutput>) => {
        setIsProcessing(false)
        
        if (event.data.type === 'ERROR' && event.data.error) {
          const error = new Error(event.data.error)
          console.error('[DrawingWorker] Worker error:', error)
          options.onError?.(error)
        } else {
          console.log(
            `[DrawingWorker] Processed in ${event.data.processingTime?.toFixed(2)}ms`
          )
          options.onProcessed?.(event.data)
        }
      }

      workerRef.current.onerror = (error) => {
        setIsProcessing(false)
        console.error('[DrawingWorker] Worker error:', error)
        options.onError?.(new Error(error.message))
      }

      console.log('[DrawingWorker] Worker initialized successfully')
    } catch (error) {
      console.error('[DrawingWorker] Failed to initialize worker:', error)
      setIsWorkerSupported(false)
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
        console.log('[DrawingWorker] Worker terminated')
      }
    }
  }, [options.onProcessed, options.onError])

  /**
   * Process drawing in worker (convert canvas to data URL)
   */
  const processDrawing = useCallback(
    async (
      canvas: HTMLCanvasElement,
      format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png',
      quality: number = 0.92
    ): Promise<DrawingWorkerOutput | null> => {
      if (isProcessing) {
        console.warn('[DrawingWorker] Already processing, skipping request')
        return null
      }

      setIsProcessing(true)

      // Fallback to main thread if worker unavailable
      if (!isWorkerSupported || !workerRef.current) {
        console.log('[DrawingWorker] Using main thread fallback')
        
        try {
          const startTime = performance.now()
          const dataURL = canvas.toDataURL(format, quality)
          const processingTime = performance.now() - startTime
          
          const result: DrawingWorkerOutput = {
            type: 'DRAWING_PROCESSED',
            dataURL,
            processingTime
          }
          
          setIsProcessing(false)
          return result
        } catch (error) {
          setIsProcessing(false)
          const err = error instanceof Error ? error : new Error('Unknown error')
          options.onError?.(err)
          return null
        }
      }

      // Process in worker using OffscreenCanvas
      return new Promise((resolve) => {
        const handler = (event: MessageEvent<DrawingWorkerOutput>) => {
          if (workerRef.current) {
            workerRef.current.removeEventListener('message', handler)
          }
          resolve(event.data)
        }

        workerRef.current!.addEventListener('message', handler)

        // Transfer canvas to OffscreenCanvas
        const offscreen = canvas.transferControlToOffscreen()

        const input: DrawingWorkerInput = {
          type: 'PROCESS_DRAWING',
          canvas: offscreen,
          format,
          quality
        }

        workerRef.current!.postMessage(input, [offscreen])
      })
    },
    [isWorkerSupported, isProcessing, options]
  )

  /**
   * Compress image in worker
   */
  const compressImage = useCallback(
    async (
      imageData: ImageData,
      format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/jpeg',
      quality: number = 0.8
    ): Promise<DrawingWorkerOutput | null> => {
      if (isProcessing) {
        console.warn('[DrawingWorker] Already processing, skipping request')
        return null
      }

      setIsProcessing(true)

      if (!isWorkerSupported || !workerRef.current) {
        console.log('[DrawingWorker] Using main thread fallback for compression')
        
        try {
          const startTime = performance.now()
          const canvas = document.createElement('canvas')
          canvas.width = imageData.width
          canvas.height = imageData.height
          const ctx = canvas.getContext('2d')
          
          if (!ctx) throw new Error('Failed to get canvas context')
          
          ctx.putImageData(imageData, 0, 0)
          const dataURL = canvas.toDataURL(format, quality)
          const processingTime = performance.now() - startTime
          
          const result: DrawingWorkerOutput = {
            type: 'IMAGE_COMPRESSED',
            dataURL,
            processingTime
          }
          
          setIsProcessing(false)
          return result
        } catch (error) {
          setIsProcessing(false)
          const err = error instanceof Error ? error : new Error('Unknown error')
          options.onError?.(err)
          return null
        }
      }

      return new Promise((resolve) => {
        const handler = (event: MessageEvent<DrawingWorkerOutput>) => {
          if (workerRef.current) {
            workerRef.current.removeEventListener('message', handler)
          }
          resolve(event.data)
        }

        workerRef.current!.addEventListener('message', handler)

        const input: DrawingWorkerInput = {
          type: 'COMPRESS_IMAGE',
          imageData,
          format,
          quality
        }

        workerRef.current!.postMessage(input)
      })
    },
    [isWorkerSupported, isProcessing, options]
  )

  /**
   * Terminate worker manually if needed
   */
  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
      console.log('[DrawingWorker] Worker manually terminated')
    }
  }, [])

  return {
    processDrawing,
    compressImage,
    terminateWorker,
    isWorkerSupported,
    isProcessing
  }
}
