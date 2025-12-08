import { useEffect, useRef, useState } from 'react'
import { Game } from './engine/Game'
import { BuildingMenu } from './components/BuildingMenu'
import { ProductionMenu } from './components/ProductionMenu'
import { BuildingType } from './engine/data/BuildingRules'
import { Building } from './engine/entities/Building'

function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gameRef = useRef<Game | null>(null)
    const [resources, setResources] = useState({ gold: 0, wood: 0, food: 0 })
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)

    useEffect(() => {
        if (!canvasRef.current) return

        // Init Game
        const game = new Game(canvasRef.current)
        gameRef.current = game
        game.start()

        // Prevent context menu on right click
        const handleContextMenu = (e: MouseEvent) => e.preventDefault()
        canvasRef.current.addEventListener('contextmenu', handleContextMenu)

        // Sync Loop for UI
        let animationFrameId: number
        const syncUI = () => {
            if (gameRef.current) {
                // We create a new object to ensure React detects the change
                setResources({ ...gameRef.current.state.resources })

                // Handle Selection for UI
                const selection = gameRef.current.state.selection
                if (selection.length === 1) {
                    const id = selection[0]
                    const entity = gameRef.current.state.entities.find(e => e.id === id)
                    if (entity && entity instanceof Building) {
                        setSelectedBuilding(entity)
                    } else {
                        setSelectedBuilding(null)
                    }
                } else {
                    setSelectedBuilding(null)
                }
            }
            animationFrameId = requestAnimationFrame(syncUI)
        }
        syncUI()

        return () => {
            game.stop()
            cancelAnimationFrame(animationFrameId)
            if (canvasRef.current) {
                canvasRef.current.removeEventListener('contextmenu', handleContextMenu)
            }
        }
    }, [])

    const handleBuild = (type: BuildingType) => {
        if (gameRef.current) {
            gameRef.current.setPlacementMode(type)
        }
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-900 text-white select-none">
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full block touch-none"
            />

            {/* Top Bar - Resources */}
            <div className="absolute top-0 left-0 w-full bg-slate-900/80 p-2 flex gap-6 justify-center pointer-events-none">
                <div className="flex items-center gap-2">
                    <span className="text-yellow-400 font-bold">Gold:</span>
                    <span>{Math.floor(resources.gold)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-amber-600 font-bold">Wood:</span>
                    <span>{Math.floor(resources.wood)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">Food:</span>
                    <span>{Math.floor(resources.food)}</span>
                </div>
            </div>

            {/* Bottom Left - Build Menu */}
            <BuildingMenu
                onBuild={handleBuild}
                resources={resources}
            />

            {/* Bottom Right / Center - Selection Details / Production */}
            {selectedBuilding && gameRef.current && (
                <ProductionMenu
                    building={selectedBuilding}
                    game={gameRef.current}
                />
            )}

            {/* Help Text */}
            <div className="absolute top-2 right-2 text-xs text-slate-500 pointer-events-none">
                <p>WASD / Arrows to Move Camera</p>
                <p>Left Click to Select / Place</p>
                <p>Right Click to Move / Gather</p>
            </div>
        </div>
    )
}

export default App
