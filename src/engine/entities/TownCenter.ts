import { Building } from './Building';

export class TownCenter extends Building {
    constructor(x: number, y: number) {
        super(x, y);
        this.buildingType = 'Town Center';
        this.size = 64;
        this.color = '#2563eb'; // Blue 600
    }
}
