import { LevelRooms, PuzzleRoom } from "./entity";
import { ICreature, IEnemyPrefixSet, IFurniture, IHasType, IItem, IPlayer, ITile } from "./interface/entity-schema";
import { IPuzzleList, IPuzzleRoom } from "./interface/puzzle-schema";
import { ICharCreation } from "./windows/charcreation";

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

    public prefixes: IEnemyPrefixSet = null;

    public tiles: { [id: number]: ITile } = {};

    public creatures: { [id: number]: ICreature } = {};

    public items: {[id: number]: IItem} = {};

    public furnitures: {[id: number]: IFurniture} = {};

    public charcreation: ICharCreation;

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

    public introtexts: string[] = [
        "Long after your death, the Grimwin noble family has come to an end. Even though you weren't keenly",
        "liked by most of your relatives, you were buried in your family's crypt. But even in death you were",
        "not given peace and something prevented you from passing on to the spirit world...",
        "",
        "You see a group of hooded men standing around you. Your body doesn't move. You see a man dressed in",
        "dark amethyst gown and hood standing in front of you. He is chanting something in a language, that",
        "you have never heard before. Suddenly feel like you are on fire and your entire being is in pain.",
        "You sense that something is trying cut your link to the spirit world and denying your right to pass",
        "on. After a while, the chanting ends and your world starts turning black.",
        "",
        "You fall into a deep slumber...",
    ];

    public introafter: string[] = [
        "One day, something wakes you up from your slumber... First thing you see is an oddly clothed man,",
        "staring down to you, holding a lantern and searching through your remains. You stand up, but it",
        "seems that the man doesn't see you. Then you look down and see your own mummified remains, laying",
        "in the coffin. Then you notice that world around you looks a little different, like all the colors",
        "except shades of blue have vanished and then you remember your curse and what must be done.",
        "",
        "Use everything and everyone to exact your revenge upon the man who cursed you. You sense that the",
        "man who cursed you, resides somewhere below you...",
    ];

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
