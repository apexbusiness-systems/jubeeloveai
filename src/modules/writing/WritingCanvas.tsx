import { useRef, useState, useEffect } from 'react'
import { useJubeeStore } from '../../store/useJubeeStore'
import { useGameStore } from '../../store/useGameStore'

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

export default function WritingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentLetter, setCurrentLetter] = useState('A')
  const [isDrawing, setIsDrawing] = useState(false)
  const { speak, triggerAnimation } = useJubeeStore()
  const { addScore } = useGameStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Draw guide letter
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 8
    ctx.font = 'bold 200px Arial'
    ctx.strokeText(currentLetter, 50, 250)
  }, [currentLetter])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.strokeStyle = '#FFD93D'
    ctx.lineWidth = 12
    ctx.lineCap = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Redraw guide
    ctx.strokeStyle = '#ddd'
    ctx.lineWidth = 8
    ctx.font = 'bold 200px Arial'
    ctx.strokeText(currentLetter, 50, 250)
  }

  const nextLetter = () => {
    const currentIndex = letters.indexOf(currentLetter)
    const nextIndex = (currentIndex + 1) % letters.length
    setCurrentLetter(letters[nextIndex])
    speak(`Great job! Now let's try ${letters[nextIndex]}!`)
    triggerAnimation('excited')
    addScore(10)
    clearCanvas()
  }

  return (
    <div className="writing-canvas-container">
      <h2 className="text-3xl font-bold text-center mb-4">Trace the Letter: {currentLetter}</h2>
      
      <canvas
        ref={canvasRef}
        className="writing-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      <div className="flex gap-4 justify-center mt-6">
        <button onClick={clearCanvas} className="action-btn bg-red-400 hover:bg-red-500">
          Clear
        </button>
        <button onClick={nextLetter} className="action-btn bg-green-400 hover:bg-green-500">
          Next Letter
        </button>
      </div>
    </div>
  )
}
