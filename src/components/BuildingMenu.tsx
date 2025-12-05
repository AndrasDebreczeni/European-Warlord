import React from 'react';
import { BuildingType, BuildingCosts } from '../engine/data/BuildingRules';

interface BuildingMenuProps {
    onBuild: (type: BuildingType) => void;
    resources: { gold: number; wood: number; food: number };
}

export const BuildingMenu: React.FC<BuildingMenuProps> = ({ onBuild, resources }) => {
    return (
        <div className="absolute bottom-4 left-4 bg-slate-800 p-2 rounded-lg border border-slate-600 flex gap-2">
            {Object.keys(BuildingCosts).map((key) => {
                const type = key as BuildingType;
                const cost = BuildingCosts[type];
                const canAfford = resources.gold >= cost.gold && resources.wood >= cost.wood && resources.food >= cost.food;

                return (
                    <button
                        key={type}
                        onClick={() => onBuild(type)}
                        disabled={!canAfford}
                        className={`flex flex-col items-center p-2 rounded border ${canAfford
                                ? 'bg-slate-700 hover:bg-slate-600 border-slate-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        <span className="font-bold text-sm">{type}</span>
                        <div className="text-xs flex gap-1 mt-1">
                            {cost.gold > 0 && <span className="text-yellow-400">G:{cost.gold}</span>}
                            {cost.wood > 0 && <span className="text-amber-600">W:{cost.wood}</span>}
                            {cost.food > 0 && <span className="text-red-400">F:{cost.food}</span>}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
