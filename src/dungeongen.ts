import { Game } from ".";
import { LevelRooms, PuzzleRoom } from "./entity";
import { IPuzzleRoom } from "./interface/puzzle-schema";
import { Level } from "./level";

class PositionedRoom {
    public room: IPuzzleRoom;
    public x: number;
    public y: number;

    constructor(x: number, y: number, room: IPuzzleRoom) {
        this.x = x;
        this.y = y;
        this.room = room;
    }
}

export class DungeonGenerator {
    public static generateLevel(game: Game,
                                roomsX: number,
                                roomsY: number): Level {
        const level = new Level(roomsX * 12 + 2, roomsY * 12 + 2, game.data);

        const generatedRooms = this.makeLevelPlan(roomsX, roomsY, game.data.predefinedRooms.level[0]);
        console.log(generatedRooms);

        // const testpuzzle = game.data.predefinedRooms.level[0].base[0];
        // level.placePuzzleAt(1, 1, testpuzzle.dataRef);

        for (const posRoom of generatedRooms) {
            level.placePuzzleAt(1 + 12 * posRoom.x, 1 + 12 * posRoom.y, posRoom.room);
        }

        return level;
    }

    private static makeLevelPlan(roomsX: number, roomsY: number, rooms: LevelRooms): PositionedRoom[] {
        const generatedRooms: PositionedRoom[] = [];
        const level: string[][] = [];

        console.log(rooms);

        const randomFreePosition = () => {
            let attempt = 0;
            while (attempt < 10000) {
                attempt++;
                const rx = Math.floor(Math.random() * roomsX);
                const ry = Math.floor(Math.random() * roomsY);
                if (level[ry][rx] === "+") {
                    return { x: rx, y: ry };
                }
            }
            return null;
        };

        const randomFree2x2Position = () => {
            let attempt = 0;
            while (attempt < 10000) {
                attempt++;
                const rx = Math.floor(Math.random() * (roomsX - 1));
                const ry = Math.floor(Math.random() * (roomsY - 1));
                if (level[ry][rx] === "+" && level[ry][rx + 1] === "+" &&
                    level[ry + 1][rx] === "+" && level[ry + 1][rx + 1] === "+") {
                    return { x: rx, y: ry };
                }
            }
            return null;
        };

        const putTile = (pos, t) => {
            level[pos.y][pos.x] = t;
        };

        const putTile2x2 = (pos, t) => {
            level[pos.y][pos.x] = t;
            level[pos.y][pos.x + 1] = t;
            level[pos.y + 1][pos.x] = t;
            level[pos.y + 1][pos.x + 1] = t;
        };

        // Make an empty level
        for (let y = 0; y < roomsY; y++) {
            const row = [];
            for (let x = 0; x < roomsY; x++) {
                row.push("+");
            }
            level.push(row);
        }

        // Place one puzzle room
        const puzzlePos = randomFree2x2Position();
        const puzzle = this.getRandomRoom(rooms, "puzzles");
        generatedRooms.push(new PositionedRoom(puzzlePos.x, puzzlePos.y, puzzle.dataRef));
        putTile2x2(puzzlePos, "P");

        // Place potential "other" room
        if (Math.random() > 0.5) {
            const room = this.getRandomRoom(rooms, "other");
            if (room !== null) {
                const bigRoom = room.dataRef.width === 24;
                const pos = bigRoom ? randomFree2x2Position() : randomFreePosition();
                if (pos !== null) {
                    (bigRoom ? putTile2x2 : putTile)(pos, bigRoom ? "O" : "o");
                    generatedRooms.push(new PositionedRoom(pos.x, pos.y, room.dataRef));
                }
            }
        }

        // Place pregenerated rooms
        for (let index = 0; index < 8; index++) {
            const room = this.getRandomRoom(rooms, "pre", false);
            const bigRoom = room.dataRef.width === 24;
            const pos = bigRoom ? randomFree2x2Position() : randomFreePosition();
            if (pos !== null) {
                (bigRoom ? putTile2x2 : putTile)(pos, bigRoom ? "G" : "g");
                generatedRooms.push(new PositionedRoom(pos.x, pos.y, room.dataRef));
            }
        }

        // Place base tiles at empty spaces
        for (let y = 0; y < roomsY; y++) {
            for (let x = 0; x < roomsX; x++) {
                if (level[y][x] === "+") {
                    const room = this.getRandomRoom(rooms, "base", false);
                    generatedRooms.push(new PositionedRoom(x, y, room.dataRef));
                }
            }
        }

        // Print the level layout
        for (let y = 0; y < roomsY; y++) {
            console.log("" + y + " " + level[y]);
        }

        return generatedRooms;
    }

    private static getRandomRoom(rooms: LevelRooms, roomType: string, unique: boolean = true): PuzzleRoom {
        const possible = rooms[roomType].filter((room) => !room.hasAppeared || !unique);
        if (possible.length === 0) {
            return null;
        }
        const selectedRoom = possible[Math.floor(Math.random() * possible.length)];
        selectedRoom.hasAppeared = true;
        return selectedRoom;
    }
}
