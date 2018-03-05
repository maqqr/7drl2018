import { ICreature, IFurniture, IHasType, IItem, IPlayer, ITile } from "./interface/entity-schema";

export class Entity {
    public x: number;
    public y: number;
    public dataRef: IHasType;
}

export class Furniture extends Entity {

}
export class Item extends Entity {

}
export class Character extends Entity {

}
