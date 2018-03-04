import { ICreature } from "./interface/creature-schema";
import { IItem } from "./interface/item-schema";
import { IPuzzleRoom } from "./interface/puzzle-schema";
import { ITile } from "./interface/tile-schema";



export class GameData {
    public puzzleRooms: IPuzzleRoom[] = [];

    public tiles: { [id: number]: ITile } = {};

    public creatures: { [id: number]: ICreature } = {};

    public items: {[id: number]: IItem} = {};
}
