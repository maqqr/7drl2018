import { ICreature, IFurniture, IHasType, IItem, IPlayer, ITile } from "./interface/entity-schema";
import { IPuzzleRoom } from "./interface/puzzle-schema";

export class Entity<T extends IHasType> {
    public x: number;
    public y: number;
    public dataRef: T;
}

export class Furniture extends Entity<IFurniture> {
    public offsetX: number;
    public offsetY: number;
}

export class Item extends Entity<IItem> {

}

export class Creature extends Entity<ICreature> {
    public currenthp: number;
    public willpower: number;

}

export class Player extends Entity<IPlayer> {
    public currentstability: number;
    public currentbody: Creature;
    public spiritpower: number;
    public spiritstability: number;
    public willpower: number;
}

export class PuzzleRoom {
    public hasAppeared: boolean = false;
    public dataRef: IPuzzleRoom;

    constructor(ref: IPuzzleRoom) {
        this.dataRef = ref;
    }
}

export class LevelRooms {
    public puzzles: PuzzleRoom[] = [];
    public other: PuzzleRoom[] = [];
    public pre: PuzzleRoom[] = [];
    public base: PuzzleRoom[] = [];
}
