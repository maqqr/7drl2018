import { ICreature } from "./interface/creature-schema";
import { IPuzzleRoom } from "./interface/puzzle-schema";
import { ITile } from "./interface/tile-schema";


export class GameData {
    public puzzleRooms: IPuzzleRoom[] = [];

    public tiles: { [id: number]: ITile } = {};

    public creatureTypes: { [id: number]: ICreature } = {};
}
