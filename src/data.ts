import { ICreature, IFurniture, IHasType, IItem, IPlayer, ITile } from "./interface/entity-schema";
import { IPuzzleRoom } from "./interface/puzzle-schema";




export class GameData {
    public puzzleRooms: IPuzzleRoom[] = [];

    public tiles: { [id: number]: ITile } = {};

    public creatures: { [id: number]: ICreature } = {};

    public items: {[id: number]: IItem} = {};

    public furnitures: {[id: number]: IFurniture} = {};

    public player: IPlayer = {
        currentbody: null,
        currenthp: 20,
        currentstability: 10,
        description: "This is me.",
        id: 255,
        maxhp: 20,
        speed: 10,
        spiritpower: 10,
        spiritstability: 10,
        type: "player",
        willpower: 10};

    public getByType(collection: {[id: number]: IHasType}, searchedType: string): number {
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
}
