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

    public wintext: string[] = [
        "You have now succeeded in exacting your revenge. The man who cursed your soul to",
        "eternal punishment of existing between the world of living and the world of the",
        "spirits is now dead. Your soul can now pass on to the spirit world and continue the cycle.",
    ];

    public wintexts: {[id: string]: string[]} = {
        beast: ["Vitalius is devoured by the beast's maw that gnaws on his bones!"],
        boss: ["In the chaos of the fight, one cultist takes his knife and lunges it to",
            "the Vitalius' back, breaking his spine and ending his former master!"],
        demonic: ["Demonic laughter echoes through the crypt as the last drop of life drains from Vitalius' body!"],
        floor: ["Vitalius jumps on the spikes and bleeds to death."],
        humanoid: ["Vitalius trips and breaks his neck."],
        lava: ["Vitalius is thrown into the lava and dies burning while he slowly sinks."],
        magic: ["Vitalius is mauled by the might of the magical creature!"],
        other: ["Well, that's awkward...",
            "You feel that Vitalius is no longer alive and you think that's that then..."],
        undead: ["The undead creature rips Vitalius' limbs apart and starts feasting on his bone marrow!"],
    };

    public player: IPlayer = {
        description: "This is me.",
        id: 255,
        speed: 10,
        type: "player"};

    public getByType<T extends IHasType>(collection: {[id: number]: T}, searchedType: string): T {
        const key = this.getIdByType(collection, searchedType);
        return collection[key];
    }

    // public getByIcon<T extends IHasType>(collection: {[id: number]: T}, searchedType: string): T {
    public getByIcon(collection: any, searchedType: string): any {
        for (const key in collection) {
            if (collection.hasOwnProperty(key)) {
                const item = collection[key];
                if (item.icon === searchedType) {
                    return item;
                }
            }
        }

        console.error("GameData.getByIcon unknown type: \"" + searchedType + "\"");
        return null;
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
