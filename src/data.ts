import { ICreature, IItem, ITile } from "./interface/entity-schema";
import { IPuzzleRoom } from "./interface/puzzle-schema";




export class GameData {
    public puzzleRooms: IPuzzleRoom[] = [];

    public tiles: { [id: number]: ITile } = {};

    public creatures: { [id: number]: ICreature } = {};

    public items: {[id: number]: IItem} = {};
}
