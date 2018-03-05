import { ICreature, IFurniture, IHasType, IItem, IPlayer, ITile } from "./interface/entity-schema";

export class Entity<T extends IHasType> {
    public x: number;
    public y: number;
    public dataRef: T;
}

export class Furniture extends Entity<IFurniture> {

}
export class Item extends Entity<IItem> {

}
export class Creature extends Entity<ICreature> {

}
