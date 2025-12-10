import { useEffect, useRef, useState } from 'react'
import { Game } from './engine/Game'
import { BuildingMenu } from './components/BuildingMenu'
import { ProductionMenu } from './components/ProductionMenu'
import { BuildingType } from './engine/data/BuildingRules'
import { Building } from './engine/entities/Building'
import { Unit } from './engine/entities/Unit'
import { UnitInfoPanel } from './components/UnitInfoPanel'
import { Minimap } from './components/Minimap'

function App() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const gameRef = useRef<Game | null>(null)
    const [resources, setResources] = useState({ gold: 0, wood: 0, food: 0, iron: 0, stone: 0 })
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)

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
                        setSelectedUnit(null)
                    } else if (entity && entity instanceof Unit) {
                        setSelectedUnit(entity)
                        setSelectedBuilding(null)
                    } else {
                        setSelectedBuilding(null)
                        setSelectedUnit(null)
                    }
                } else {
                    setSelectedBuilding(null)
                    setSelectedUnit(null)
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
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">Iron:</span>
                    <span>{Math.floor(resources.iron)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-bold">Stone:</span>
                    <span>{Math.floor(resources.stone)}</span>
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

            {/* Unit Info Panel */}
            {selectedUnit && (
                <UnitInfoPanel entity={selectedUnit} />
            )}
            {/* Also show for generic Entity selection (e.g. Resources) if Unit is not selected but something else is */}
            {!selectedUnit && gameRef.current && gameRef.current.state.selection.length === 1 && (
                /* We need to extract the entity from game state since we don't have a state var for 'selectedEntity' other than building/unit split. 
                   Let's check if we can just use a helper or temporary state in App? 
                   Actually, let's just create a generic selectedEntity state to simplify. for now, let's just make it work with what we have. */
                (() => {
                    const id = gameRef.current.state.selection[0];
                    const ent = gameRef.current.state.entities.find(e => e.id === id);
                    if (ent && !(ent instanceof Unit) && !(ent instanceof Building)) {
                        return <UnitInfoPanel entity={ent} />;
                    }
                    return null;
                })()
            )}

            {/* Minimap (Replaces Help Text) */}
            {gameRef.current && (
                <Minimap game={gameRef.current} />
            )}
        </div>
    )
}

export default App
