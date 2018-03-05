import { Game } from ".";
import { GameData } from "./data";
import { Entity, Furniture } from "./entity";
import { IFurniture } from "./interface/entity-schema";
import { IObjectLayer, IPuzzleRoom, ITileLayer } from "./interface/puzzle-schema";


type TileID = number;

class DescriptionObject {
    public x: number;
    public y: number;
    public w: number;
    public h: number;
    public text: string;

    constructor(x: number, y: number, w: number, h: number, text: string) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.text = text;
    }
}

export class Level {
    public readonly width: number;
    public readonly height: number;

    public furnitures: Furniture[] = [];
    public descriptions: DescriptionObject[] = [];

    private tiles: TileID[] = [];
    private nextLevel: Level;
    private prevLevel: Level;
    private readonly data: GameData;

    constructor(width: number, height: number, data: GameData) {
        this.data = data;
        this.width = width;
        this.height = height;
        this.nextLevel = null;
        this.prevLevel = null;
        this.tiles.fill(1, 0, width * height);
    }

    public get(x: number, y: number): TileID {
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
            const index = x + y * this.width;
            return this.tiles[index];
        }
        console.error("Level.get index out of bounds : " + JSON.stringify({ x, y }));
    }

    public set(x: number, y: number, tile: TileID): void {
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
            const index = x + y * this.width;
            this.tiles[index] = tile;
            return;
        }
        console.error("Level.set index out of bounds : " + JSON.stringify({ x, y }));
    }

    public activate(x: number, y: number) {
        const tileId = this.get(x, y);
        // const tile = this.game.

        for (const fur of this.furnitures) {
            if (fur.x === x && fur.y === y) {
                // TODO
                // fur.dataRef.
                // console.log(fur);
            }
        }
    }

    public placePuzzleAt(px: number, py: number, puzzle: IPuzzleRoom): void {
        const getLayerByName = (name: string) => {
            for (const layer of puzzle.layers) {
                if (layer.name === name) {
                    return layer;
                }
            }
            console.error("Layer " + name + " not found in puzzle room");
        };

        console.log(puzzle);

        // Place tiles
        const tilelayer = getLayerByName("tile") as ITileLayer;
        for (let y = 0; y < puzzle.height; y++) {
            for (let x = 0; x < puzzle.width; x++) {
                const tile = tilelayer.data[x + y * puzzle.width];
                this.set(px + x, py + y, tile - 1);
            }
        }

        // Place descriptions
        const descLayer = getLayerByName("description");
        if ("objects" in descLayer) {
            for (const desc of descLayer.objects) {
                const convert = (x) => Math.floor(x / 16);
                this.descriptions.push(new DescriptionObject(
                    convert(desc.x) + px, convert(desc.y) + px,
                    convert(desc.width), convert(desc.height), desc.properties.text));
            }
        }

        // console.log(this.data.furnitures);

        // Place furniture
        const furnitureLayer = getLayerByName("furniture");
        if ("objects" in furnitureLayer) {
            for (const furnitureDefinition of furnitureLayer.objects) {
                const furniture = new Furniture();
                furniture.x = px + (furnitureDefinition.x / 16);
                furniture.y = py + (furnitureDefinition.y / 16 - 1);
                furniture.dataRef = null;

                // If type if missing, get type from the corresponding tile
                // (because Tiled editor leaves it empty if the furniture was created
                // using the "Insert Tile" tool)
                let foundType = furnitureDefinition.type;
                if (foundType === "") {
                    if ("gid" in furnitureDefinition) {
                        const tileIndex = furnitureDefinition.gid - 1;
                        const tile = this.data.tiles[tileIndex];
                        if (tile === undefined) {
                            console.error("Tile " + furnitureDefinition.gid + " not found.");
                            continue;
                        }
                        foundType = tile.type;
                    }
                }

                const data = this.data.getByType(this.data.furnitures, foundType);
                if (data === undefined) {
                    console.error("Furniture with type " + foundType + " not found.");
                    continue;
                }
                furniture.dataRef = data;

                // Copy properties that override default properties.
                // TODO
                // console.log(furnitureDefinition);

                this.furnitures.push(furniture);
            }
        }
    }
}
