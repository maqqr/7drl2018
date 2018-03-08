import { LevelRooms, PuzzleRoom } from "./entity";
import { ICreature, IFurniture, IHasType, IItem, IPlayer, ITile } from "./interface/entity-schema";
import { IPuzzleList, IPuzzleRoom } from "./interface/puzzle-schema";

export class PredefinedRooms {
    public level: LevelRooms[] = [];

    public startRoom: PuzzleRoom;
    public finalRoom: PuzzleRoom;

    public addLevelRooms(index: number, roomType: any, roomDefs: IPuzzleRoom[]): void {
        if (index >= this.level.length) {
            this.level.push(new LevelRooms());
        }
        for (const roomDef of roomDefs) {
            this.level[index][roomType].push(new PuzzleRoom(roomDef));
        }
    }
}

export class GameData {
    public predefinedRooms: PredefinedRooms = new PredefinedRooms();

    public tiles: { [id: number]: ITile } = {};

    public creatures: { [id: number]: ICreature } = {};

    public items: {[id: number]: IItem} = {};

    public furnitures: {[id: number]: IFurniture} = {};

    public player: IPlayer = {
        description: "This is me.",
        id: 255,
        speed: 10,
        type: "player"};

    public getByType<T extends IHasType>(collection: {[id: number]: T}, searchedType: string): T {
        const key = this.getIdByType(collection, searchedType);
        return collection[key];
    }

    public getIdByType(collection: {[id: number]: IHasType}, searchedType: string): number {
        for (const key in collection) {
            if (collection.hasOwnProperty(key)) {
                const item = collection[key];
                if (item.type === searchedType) {
                    return parseInt(key, 10);
                }
            }
        }

        console.error("GameData.getIdByType unknown type: \"" + searchedType + "\"");
        return 0;
    }
}
