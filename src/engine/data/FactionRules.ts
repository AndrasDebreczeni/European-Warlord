export enum FactionType {
    WesternKingdom = 'Western Kingdom',
    SteppeKhaganate = 'Steppe Khaganate',
    NorthernClans = 'Northern Clans'
}

export interface FactionData {
    name: string;
    description: string;
    color: string;
    bonus: string;
}

export const FactionRules: Record<FactionType, FactionData> = {
    [FactionType.WesternKingdom]: {
        name: 'Western Kingdom',
        description: 'Heavily armored knights and strong fortifications.',
        color: '#1e40af', // Blue-800
        bonus: 'Knights have +2 Armor.'
    },
    [FactionType.SteppeKhaganate]: {
        name: 'Steppe Khaganate',
        description: 'Masters of the open plains with fast cavalry.',
        color: '#b45309', // Amber-700
        bonus: 'Cavalry units move 20% faster.'
    },
    [FactionType.NorthernClans]: {
        name: 'Northern Clans',
        description: 'Fierce infantry and aggressive shock troops.',
        color: '#115e59', // Teal-800
        bonus: 'Infantry deal +2 Damage.'
    }
};
