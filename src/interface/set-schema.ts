import { ICreature, IFurniture, IItem, ITile } from "./entity-schema";

export interface IItemset {
    items: IItem[];
}

export interface ICreatureset {
    creatures: ICreature[];
}

export interface ITileset {
    tiles: ITile[];
  }

export interface IFurnitureset {
  furnitures: IFurniture[];
}
