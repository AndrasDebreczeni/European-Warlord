import { Building } from '../engine/entities/Building';
import { UnitType, UnitCosts } from '../engine/data/UnitRules';
import { Game } from '../engine/Game';
import { TownCenter } from '../engine/entities/TownCenter';
import { Barracks } from '../engine/entities/Barracks';

interface ProductionMenuProps {
    building: Building;
    game: Game;
}

export function ProductionMenu({ building, game }: ProductionMenuProps) {
    const availableUnits: UnitType[] = [];

    // Determine what units this building can produce
    if (building instanceof TownCenter) {
        availableUnits.push(UnitType.Villager);
    } else if (building instanceof Barracks) {
        // West
        availableUnits.push(UnitType.Swordsman);
        availableUnits.push(UnitType.Archer);
        availableUnits.push(UnitType.Knight);
        // East
        availableUnits.push(UnitType.Lancer);
        availableUnits.push(UnitType.HorseArcher);
        availableUnits.push(UnitType.Marauder);
        // North
        availableUnits.push(UnitType.Huscarl);
        availableUnits.push(UnitType.Axethrower);
        availableUnits.push(UnitType.Berserker);
    }

    // Always render if building is selected (User requested UI for every building)
    // We will show stats if no production available or default content.

    return (
        <div className="absolute bottom-4 right-4 bg-slate-800 p-4 rounded-lg text-white shadow-lg border border-slate-600">
            <h3 className="font-bold mb-2 border-b border-slate-600 pb-1">
                {building.buildingType}
            </h3>

            <div className="text-sm mb-4">
                <div className="flex justify-between">
                    <span className="text-slate-400">Health:</span>
                    <span>{Math.ceil(building.health)}/{building.maxHealth}</span>
                </div>
            </div>

            {/* Production Buttons */}
            <div className="flex gap-2 mb-4">
                {availableUnits.map(unit => {
                    const cost = UnitCosts[unit];
                    const canAfford = game.state.resources.gold >= cost.gold &&
                        game.state.resources.wood >= cost.wood &&
                        game.state.resources.food >= cost.food;

                    return (
                        <button
                            key={unit}
                            onClick={() => game.trainUnit(building, unit)}
                            disabled={!canAfford}
                            className={`
                                flex flex-col items-center p-2 rounded border border-slate-600 min-w-[80px]
                                ${canAfford
                                    ? 'bg-slate-700 hover:bg-slate-600 active:bg-slate-500'
                                    : 'bg-slate-900 opacity-50 cursor-not-allowed'}
                            `}
                            title={`Cost: Gold ${cost.gold}, Wood ${cost.wood}, Food ${cost.food}`}
                        >
                            <span className="font-semibold text-sm">{unit}</span>
                            <span className="text-xs text-slate-400 mt-1">{cost.time}s</span>
                        </button>
                    );
                })}
            </div>

            {/* Queue Display - Always visible with fixed height */}
            {availableUnits.length > 0 && (
                <div className="mt-2 min-h-[60px]">
                    <h4 className="text-xs font-semibold text-slate-400 mb-1">Queue:</h4>
                    <div className="flex gap-1 overflow-x-auto min-h-[32px]">
                        {building.productionQueue.length > 0 ? (
                            building.productionQueue.map((unit, index) => (
                                <div
                                    key={index}
                                    className={`
                                        px-2 py-1 rounded text-xs border border-slate-600
                                        ${index === 0 ? 'bg-blue-600 border-blue-400' : 'bg-slate-700'}
                                    `}
                                >
                                    {unit}
                                    {index === 0 && (
                                        <span className="ml-1 text-[10px] opacity-75">
                                            ({Math.max(0, UnitCosts[unit].time - building.productionTimer).toFixed(1)}s)
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-xs text-slate-500 italic">No units in queue</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
