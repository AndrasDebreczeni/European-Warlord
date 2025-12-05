import { useEffect, useRef, useState } from 'react'
import { Game } from './engine/Game'
import { BuildingMenu } from './components/BuildingMenu'
import { BuildingType } from './engine/data/BuildingRules'

function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gameRef = useRef<Game | null>(null)
    const [resources, setResources] = useState({ gold: 0, wood: 0, food: 0 })

    useEffect(() => {
        if (!canvasRef.current) return

        // Init Game
        const game = new Game(canvasRef.current)
        gameRef.current = game
        game.start()

        // Sync Loop for UI
        let animationFrameId: number
        const syncUI = () => {
            if (gameRef.current) {
                // We create a new object to ensure React detects the change
                setResources({ ...gameRef.current.state.resources })
            }
            animationFrameId = requestAnimationFrame(syncUI)
        }
        syncUI()

        return () => {
            game.stop()
            cancelAnimationFrame(animationFrameId)
        }
    }, [])

    const handleBuild = (type: BuildingType) => {
        if (gameRef.current) {
            gameRef.current.setPlacementMode(type)
        }
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-900 text-white">
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full block touch-none"
            />

            <BuildingMenu
                onBuild={handleBuild}
                resources={resources}
            />
        </div>
    )
}

export default App
