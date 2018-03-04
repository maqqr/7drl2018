import { ICreature, IItem, ITile } from "./entity-schema";

export interface IItemset {
    items: IItem[];
}

export interface ICreatureset {
    creatures: ICreature[];
}

export interface ITileset {
    tiles: ITile[];
  }
