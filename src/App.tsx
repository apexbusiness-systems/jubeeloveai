import { Suspense, lazy, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { JubeeMascot } from './core/jubee/JubeeMascot'
import { useGameStore } from './store/useGameStore'
import { useJubeeStore } from './store/useJubeeStore'

const WritingCanvas = lazy(() => import('./modules/writing/WritingCanvas'))
const ShapeSorter = lazy(() => import('./modules/shapes/ShapeSorter'))

const queryClient = new QueryClient()

export default function App() {
  const { currentTheme, updateTheme } = useGameStore()
  const { position: jubeePosition, currentAnimation: jubeeAnimation } = useJubeeStore()

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) updateTheme('morning')
    else if (hour >= 12 && hour < 17) updateTheme('afternoon')
    else if (hour >= 17 && hour < 20) updateTheme('evening')
    else updateTheme('night')
  }, [updateTheme])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="app" data-theme={currentTheme}>
          <div className="jubee-container">
            <Canvas camera={{ position: [0, 0, 5] }}>
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} />
              <Suspense fallback={null}>
                <JubeeMascot position={[jubeePosition.x, jubeePosition.y, jubeePosition.z]} animation={jubeeAnimation} />
              </Suspense>
            </Canvas>
          </div>

          <main className="main-content">
            <Suspense fallback={<div className="loading-screen">Loading...</div>}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/write" element={<WritingCanvas />} />
                <Route path="/shapes" element={<ShapeSorter />} />
              </Routes>
            </Suspense>
          </main>

          <nav className="tab-bar">
            <TabButton path="/" icon="🏠" label="Home" />
            <TabButton path="/write" icon="✏️" label="Write" />
            <TabButton path="/shapes" icon="⭐" label="Shapes" />
          </nav>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function HomePage() {
  return (
    <div className="home-page">
      <h1 className="text-5xl font-extrabold text-center mt-8 mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-lg">
        Welcome to Jubee's World!
      </h1>
      <p className="text-center text-xl font-semibold text-foreground/80 mb-4">Let's Learn and Play!</p>
      <div className="grid grid-cols-2 gap-6 p-8">
        <GameCard title="Writing" icon="✏️" path="/write" />
        <GameCard title="Shapes" icon="⭐" path="/shapes" />
      </div>
    </div>
  )
}

function GameCard({ title, icon, path }: { title: string; icon: string; path: string }) {
  const navigate = useNavigate()
  const { triggerAnimation } = useJubeeStore()

  return (
    <button onClick={() => { triggerAnimation('excited'); navigate(path) }} className="game-card">
      <span className="text-7xl mb-3 drop-shadow-lg">{icon}</span>
      <span className="text-2xl font-bold text-foreground">{title}</span>
    </button>
  )
}

function TabButton({ path, icon, label }: { path: string; icon: string; label: string }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(path)} className="tab-item">
      <span className="text-3xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </button>
  )
}
