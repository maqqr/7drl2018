import { ICreature, IFurniture, IHasType, IItem, ITile } from "./interface/entity-schema";
import { IPuzzleRoom } from "./interface/puzzle-schema";




export class GameData {
    public puzzleRooms: IPuzzleRoom[] = [];

    public tiles: { [id: number]: ITile } = {};

    public creatures: { [id: number]: ICreature } = {};

    public items: {[id: number]: IItem} = {};

    public furnitures: {[id: number]: IFurniture} = {};

    public getIdByType(collection: {[id: number]: IHasType}, searchedType: string): number {
        for (const key in collection) {
            if (collection.hasOwnProperty(key)) {
                const item = collection[key];
                if (item.type === searchedType) {
                    return parseInt(key, 10);
                }
            }
        }

        console.error("GameData.getByType unknown type: \"" + searchedType + "\"");
        return 0;
    }

    public getByType(collection: {[id: number]: IHasType}, searchedType: string): IHasType {
        const key = this.getIdByType(collection, searchedType);
        return collection[key];
    }
}
