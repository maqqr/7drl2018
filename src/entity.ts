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

export enum SlotType {
    Offensive = 0,
    Defensive = 1,
    Other = 2,
}

export class ItemSlot {
    public type: SlotType = SlotType.Other;
    public item: string = "";
}

export class Creature extends Entity<ICreature> {
    public currenthp: number;
    public willpower: number;
    public time: number;
    public inventory: ItemSlot[];

    public pickup(item: string): boolean {
       for (const slot of this.inventory) {
           if (slot.item === "") {
               slot.item = item;
               return true;
           }
       }
       return false;
    }
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
