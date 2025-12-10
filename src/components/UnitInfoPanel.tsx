import { Entity, EntityType } from '../engine/entities/Entity';
import { Unit } from '../engine/entities/Unit';
import { ResourceNode, ResourceType } from '../engine/entities/ResourceNode';

interface UnitInfoPanelProps {
    entity: Entity;
}

export const UnitInfoPanel: React.FC<UnitInfoPanelProps> = ({ entity }) => {

    if (entity instanceof Unit) {
        return (
            <div className="absolute bottom-4 right-4 bg-slate-800 p-4 rounded-lg text-white shadow-lg border border-slate-600 w-64">
                <h3 className="font-bold text-lg mb-2 border-b border-slate-600 pb-1 flex justify-between items-center">
                    {entity.unitType}
                    <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                        Lvl 1
                    </span>
                </h3>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-400">Health:</span>
                        <span className={entity.health < entity.maxHealth / 3 ? "text-red-400 font-bold" : "text-green-400"}>
                            {Math.ceil(entity.health)} / {entity.maxHealth}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-slate-700/50 p-1 rounded px-2">
                            <span className="block text-xs text-slate-500">Attack</span>
                            <span className="font-semibold text-red-300">{entity.attack}</span>
                        </div>
                        <div className="bg-slate-700/50 p-1 rounded px-2">
                            <span className="block text-xs text-slate-500">Armor</span>
                            <span className="font-semibold text-blue-300">{entity.armor}</span>
                        </div>
                        <div className="bg-slate-700/50 p-1 rounded px-2">
                            <span className="block text-xs text-slate-500">Range</span>
                            <span className="font-semibold text-yellow-300">{entity.range}</span>
                        </div>
                        <div className="bg-slate-700/50 p-1 rounded px-2">
                            <span className="block text-xs text-slate-500">Speed</span>
                            <span className="font-semibold text-cyan-300">{entity.speed}</span>
                        </div>
                    </div>

                    {entity.carryCapacity > 0 && (
                        <div className="mt-2 border-t border-slate-700 pt-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Inventory:</span>
                                <span>{entity.currentLoad} / {entity.carryCapacity}</span>
                            </div>
                            {entity.carriedResourceType !== null && (
                                <div className="text-xs text-yellow-500 text-right">
                                    {ResourceType[entity.carriedResourceType]}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-2 text-xs text-slate-500 italic">
                        State: {['Idle', 'Moving', 'Gathering', 'Returning', 'Attacking'][entity.state]}
                    </div>
                </div>
            </div>
        );
    } else if (entity instanceof ResourceNode) {
        return (
            <div className="absolute bottom-4 right-4 bg-slate-800 p-4 rounded-lg text-white shadow-lg border border-slate-600 w-64">
                <h3 className="font-bold text-lg mb-2 border-b border-slate-600 pb-1 flex justify-between items-center text-yellow-500">
                    {ResourceType[entity.resourceType]}
                </h3>
                <div className="space-y-4 text-sm">
                    <div>
                        <span className="text-slate-400 block mb-1">Remaining Amount</span>
                        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-yellow-500 h-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (entity.amount / 1000) * 100)}%` }}
                            />
                        </div>
                        <div className="text-right text-xs mt-1 text-slate-300">{entity.amount}</div>
                    </div>
                </div>
            </div>
        )
    }

    return null;
};
