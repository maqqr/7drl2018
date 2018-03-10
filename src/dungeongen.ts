import { GameData } from "./data";
import { Furniture, LevelRooms, PuzzleRoom } from "./entity";
import { IPuzzleRoom } from "./interface/puzzle-schema";
import { Level } from "./level";
import { Game } from "./windows/game";

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
                                roomsY: number, depth: number): Level {
        const level = new Level(roomsX * 12 + 2, roomsY * 12 + 2, depth, game.data);

        // TODO: get correct rooms
        let levelStyle = 0;
        if (depth >= 4) {
            levelStyle = 1;
        }
        if (depth >= 7) {
            levelStyle = 2;
        }
        const rooms = game.data.predefinedRooms.level[levelStyle];

        // Allow all pregen rooms to appear again
        for (const room of rooms.pre) {
            room.hasAppeared = false;
        }

        const result = this.makeLevelPlan(roomsX, roomsY, rooms, depth, game.data);
        const generatedRooms = result[0];
        const up = result[1];
        const down = result[2];
        // console.log(result);

        for (const posRoom of generatedRooms) {
            level.placePuzzleAt(1 + 12 * posRoom.x, 1 + 12 * posRoom.y, posRoom.room);
        }

        // Place up stairs
        const upFur = new Furniture();
        upFur.dataRef = game.data.furnitures[92];
        upFur.x = up.x * 12 + 7;
        upFur.y = up.y * 12 + 6;
        level.addFurniture(upFur);

        // Place down stairs
        if (depth < 10) {
            const downFur = new Furniture();
            downFur.dataRef = game.data.furnitures[93];
            downFur.x = down.x * 12 + 6;
            downFur.y = down.y * 12 + 7;
            level.addFurniture(downFur);
        }

        return level;
    }

    public static bossroomTesting(game: Game, roomsX: number, roomsY: number, depth: number): Level {
        const level = new Level(24 + 2, 24 + 2, depth, game.data);

        level.placePuzzleAt(1 , 1, game.data.predefinedRooms.finalRoom.dataRef);

        return level;
    }

    private static makeLevelPlan(roomsX: number, roomsY: number, rooms: LevelRooms, depth: number, data: GameData):
            [PositionedRoom[], { x: number, y: number}, { x: number, y: number}] {

        const generatedRooms: PositionedRoom[] = [];
        const level: string[][] = [];
        const down: { x: number, y: number} = { x: 0, y: 0 };
        const up: { x: number, y: number} = { x: 0, y: 0 };

        // console.log(rooms);

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

        // Place at least one puzzle room
        const puzzlePos = randomFree2x2Position();
        const puzzle = this.getRandomRoom(rooms, "puzzles");
        generatedRooms.push(new PositionedRoom(puzzlePos.x, puzzlePos.y, puzzle.dataRef));
        console.log("Generated puzzle name: " + puzzle.dataRef.puzzlename);
        putTile2x2(puzzlePos, "P");

        // Place start room and final boss room
        if (depth === 1) {
            const startPos = randomFreePosition();
            putTile(startPos, "S");
            generatedRooms.push(new PositionedRoom(startPos.x, startPos.y, data.predefinedRooms.startRoom.dataRef));
            Game.startRoomX = startPos.x;
            Game.startRoomY = startPos.y;
        }
        if (depth === 10) {
            const startPos = randomFree2x2Position();
            putTile2x2(startPos, "S");
            generatedRooms.push(new PositionedRoom(startPos.x, startPos.y, data.predefinedRooms.finalRoom.dataRef));
        }

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
            const room = this.getRandomRoom(rooms, "pre");
            const bigRoom = room.dataRef.width === 24;
            const pos = bigRoom ? randomFree2x2Position() : randomFreePosition();
            if (pos !== null) {
                (bigRoom ? putTile2x2 : putTile)(pos, bigRoom ? "G" : "g");
                generatedRooms.push(new PositionedRoom(pos.x, pos.y, room.dataRef));
            }
        }

        // Place base tiles and stair at empty spaces
        const stairdownPos = randomFreePosition();
        const stairUpPos = randomFreePosition();
        for (let y = 0; y < roomsY; y++) {
            for (let x = 0; x < roomsX; x++) {
                if (level[y][x] === "+") {
                    const room = this.getRandomRoom(rooms, "base", false);
                    generatedRooms.push(new PositionedRoom(x, y, room.dataRef));
                }

                if (x === stairdownPos.x && y === stairdownPos.y) {
                    down.x = stairdownPos.x;
                    down.y = stairdownPos.y;
                }

                if (x === stairUpPos.x && y === stairUpPos.y) {
                    up.x = stairUpPos.x;
                    up.y = stairUpPos.y;
                }
            }
        }

        // Print the level layout
        console.log("Generated depth " + depth);
        for (let y = 0; y < roomsY; y++) {
            console.log("" + y + " " + level[y]);
        }

        return [generatedRooms, up, down];
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
