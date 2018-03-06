import * as ROT from "rot-js";
import { Game } from ".";
import { GameData } from "./data";
import { Creature, Entity, Furniture } from "./entity";
import { ICreature, IFurniture } from "./interface/entity-schema";
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

export enum TileVisibility {
    Unknown,
    Visible,
    Remembered,
}

export class TileState {
    public state: TileVisibility = TileVisibility.Unknown;
    public rememberedTile: number = 0;
    public rememberedFurniture: number = 0;
}

export class Level {
    public readonly width: number;
    public readonly height: number;

    public furnitures: Furniture[] = [];
    public descriptions: DescriptionObject[] = [];

    public creatures: Creature[] = [];
    public fov: ROT.FOV;

    private tiles: TileID[] = [];
    private tilestate: TileState[] = [];

    private nextLevel: Level;
    private prevLevel: Level;
    private readonly data: GameData;

    constructor(width: number, height: number, data: GameData) {
        this.data = data;
        this.width = width;
        this.height = height;
        this.nextLevel = null;
        this.prevLevel = null;
        for (let index = 0; index < width * height; index++) {
            this.tilestate.push(new TileState());
            this.tiles.push(1);
        }
        this.fov = new ROT.FOV.PreciseShadowcasting(this.isTransparent.bind(this));
    }

    public isInLevelBounds(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    public isTransparent(x: number, y: number): boolean {
        if (!this.isInLevelBounds(x, y)) {
            return false;
        }
        const tile = this.data.tiles[this.get(x, y)];
        if (tile) {
            return tile.transparent;
        }
        return false;
    }

    public calculateFov(px: number, py: number): void {
        // TODO: mark all nearby visible tiles as remembered before recalculating fov
        // TODO: set rememberedTile and furniture
        this.fov.compute(px, py, 7, (x, y, radius, visibility) => {
            if (this.isInLevelBounds(x, y)) {
                this.tilestate[x + y * this.width].state = TileVisibility.Visible;
            }
        });
    }

    public get(x: number, y: number): TileID {
        if (this.isInLevelBounds(x, y)) {
            const index = x + y * this.width;
            return this.tiles[index];
        }
        console.error("Level.get index out of bounds : " + JSON.stringify({ x, y }));
    }

    public getTileState(x: number, y: number): TileState {
        if (this.isInLevelBounds(x, y)) {
            const index = x + y * this.width;
            return this.tilestate[index];
        }
        console.error("Level.getTileState index out of bounds : " + JSON.stringify({ x, y }));
    }

    public getFurnituresAt(x: number, y: number): Furniture[] {
        const furs: Furniture[] = [];
        for (const fur of this.furnitures) {
            if (fur.x === x && fur.y === y) {
                furs.push(fur);
            }
        }
        console.log(furs);
        return furs;
    }

    public getCreatureAt(x: number, y: number): Creature {
        for (const critter of this.creatures) {
            if (critter.x === x && critter.y === y) { return critter; }
        }
        return null;
    }

    public addCreatureAt(newCreature: ICreature, x: number, y: number, wp: number ): void {
        const addedCreature = new Creature();
        addedCreature.x = x;
        addedCreature.y = y;
        addedCreature.dataRef = newCreature;
        addedCreature.willpower = wp;
        this.creatures.push(addedCreature);
    }

    public set(x: number, y: number, tile: TileID): void {
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
            const index = x + y * this.width;
            this.tiles[index] = tile;
            return;
        }
        console.error("Level.set index out of bounds : " + JSON.stringify({ x, y }));
    }

    public activate(x: number, y: number, userInitiated: boolean = true): void {
        console.log((userInitiated ? "user " : "") + "activation at " + JSON.stringify({ x, y }));
        const tileId = this.get(x, y);
        // const tile = this.game.

        for (const fur of this.furnitures) {
            if (fur.x === x && fur.y === y) {
                console.log(fur);

                // Inform the player with description texts
                if (userInitiated && fur.dataRef.useractivationtext) {
                    console.log(fur.dataRef.useractivationtext);
                }

                // Handle activation targets
                if (fur.dataRef.activationtarget) {
                    for (const coord of fur.dataRef.activationtarget) {
                        this.activate(coord[0] + fur.offsetX, coord[1] + fur.offsetY, false);
                    }
                }

                // Activate tile mechanically
                if (!userInitiated && fur.dataRef.activation) {
                    const newData = this.data.getByType(this.data.furnitures, fur.dataRef.activation);
                    this.assignNewDataToFurniture(fur, newData);
                }

                // User initiated tile activation
                if (userInitiated && fur.dataRef.useractivation) {
                    const newData = this.data.getByType(this.data.furnitures, fur.dataRef.useractivation);
                    this.assignNewDataToFurniture(fur, newData);
                }
            }
        }
    }

    public assignNewDataToFurniture(furniture: Furniture, newData: IFurniture): void {
        for (const prop in newData) {
            if (newData.hasOwnProperty(prop)) {
                if (prop !== "activationtarget") {
                    furniture.dataRef[prop] = newData[prop];
                }
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

                // Create copy of furniture data
                furniture.dataRef = Object.assign({}, data, {});

                // Copy properties that override default properties
                if ("properties" in furnitureDefinition) {
                    for (const prop in furnitureDefinition.properties) {
                        if (furnitureDefinition.properties.hasOwnProperty(prop)) {
                            if (prop === "activationtarget") {
                                const parsed = JSON.parse(furnitureDefinition.properties[prop]);
                                furniture.dataRef.activationtarget = parsed;
                            } else {
                                furniture.dataRef[prop] = furnitureDefinition.properties[prop];
                            }
                        }
                    }
                }

                furniture.offsetX = px;
                furniture.offsetY = py;
                this.furnitures.push(furniture);
            }
        }
    }
}
