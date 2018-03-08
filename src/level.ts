import * as ROT from "rot-js";
import { Game } from ".";
import { GameData } from "./data";
import { Creature, Entity, Furniture } from "./entity";
import { ICreature, IFurniture, ITile } from "./interface/entity-schema";
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
        this.fov = new ROT.FOV.RecursiveShadowcasting(this.isTransparent.bind(this));
    }

    public addFurniture(fur: Furniture): void {
        let index = 0;
        for (; index < this.furnitures.length; index++) {
            const element = this.furnitures[index];
            if (fur.dataRef.draworder <= element.dataRef.draworder) {
                break;
            }
        }
        this.furnitures.splice(index, 0, fur);
    }

    public isInLevelBounds(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    public isTransparent(x: number, y: number): boolean {
        if (!this.isInLevelBounds(x, y)) {
            return false;
        }

        // Check tile transparency
        let transparentTile: boolean = false;
        const tile = this.data.tiles[this.get(x, y)];
        if (tile && tile.transparent) {
            transparentTile = tile.transparent;
        }

        // Check furniture transparency
        let transparentFurniture: boolean = true;
        for (const fur of this.getFurnituresAt(x, y)) {
            if (!fur.dataRef.transparent) {
                transparentFurniture = false;
                break;
            }
        }

        return transparentTile && transparentFurniture;
    }

    public calculateFov(px: number, py: number, visionRadius: number): void {
        this.fov.compute(px, py, 7, (x, y, radius, visibility) => {
            if (visibility && this.isInLevelBounds(x, y)) {
                const tileState = this.tilestate[x + y * this.width];
                tileState.state = TileVisibility.Visible;
                tileState.rememberedTile = this.get(x, y);

                const furries = this.getFurnituresAt(x, y);
                if (furries.length > 0) {
                    tileState.rememberedFurniture = furries[0].dataRef.icon;
                } else {
                    tileState.rememberedFurniture = 0;
                }
            }
        });
    }

    public markRememberedTiles(px: number, py: number, visionRadius: number): void {
        for (let yy = -visionRadius - 1; yy < visionRadius + 1; yy++) {
            for (let xx = -visionRadius - 1; xx < visionRadius + 1; xx++) {
                const tx = px + xx;
                const ty = py + yy;
                if (this.isInLevelBounds(tx, ty)) {
                    if (this.tilestate[tx + ty * this.width].state === TileVisibility.Visible) {
                        this.tilestate[tx + ty * this.width].state = TileVisibility.Remembered;
                    }
                }
            }
        }
    }

    public get(x: number, y: number): TileID {
        if (this.isInLevelBounds(x, y)) {
            const index = x + y * this.width;
            return this.tiles[index];
        }
        console.error("Level.get index out of bounds : " + JSON.stringify({ x, y }));
    }

    public getTile(x: number, y: number): ITile {
        x = Math.floor(x);
        y = Math.floor(y);
        const index = this.get(x, y);
        return this.data.tiles[index];
    }

    public getTileState(x: number, y: number): TileState {
        x = Math.floor(x);
        y = Math.floor(y);
        if (this.isInLevelBounds(x, y)) {
            const index = x + y * this.width;
            return this.tilestate[index];
        }
        console.error("Level.getTileState index out of bounds : " + JSON.stringify({ x, y }));
    }

    public getFurnituresAt(x: number, y: number): Furniture[] {
        x = Math.floor(x);
        y = Math.floor(y);
        const furs: Furniture[] = [];
        for (const fur of this.furnitures) {
            if (fur.x === x && fur.y === y) {
                furs.push(fur);
            }
        }
        return furs;
    }

    public getTotalFurnitureSizeAt(x: number, y: number): number {
        x = Math.floor(x);
        y = Math.floor(y);
        let sum = 0;
        this.getFurnituresAt(x, y).forEach((fur) => sum += fur.dataRef.size);
        return sum;
    }

    public getCreatureAt(x: number, y: number): Creature {
        x = Math.floor(x);
        y = Math.floor(y);
        for (const critter of this.creatures) {
            if (critter.x === x && critter.y === y) { return critter; }
        }
        return null;
    }

    public addCreatureAt(creature: Creature, x: number, y: number): void {
        creature.x = x;
        creature.y = y;
        this.creatures.push(creature);
    }

    public removeCreature(creature: Creature): void {
        //
    }

    public createCreatureAt(newCreature: ICreature, x: number, y: number, wp: number ): void {
        const addedCreature = new Creature();
        addedCreature.currenthp = newCreature.maxhp;
        addedCreature.dataRef = newCreature;
        addedCreature.willpower = newCreature.willpower;
        addedCreature.time = 0;
        this.addCreatureAt(addedCreature, x, y);
    }

    public set(x: number, y: number, tile: TileID): void {
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
            const index = x + y * this.width;
            this.tiles[index] = tile;
            return;
        }
        console.error("Level.set index out of bounds : " + JSON.stringify({ x, y }));
    }

    public checkPressureActivation(x: number, y: number, typeName: string, transformedName: string,
                                   isCorrectSize: (size: number) => boolean): void {
        let plate: Furniture = null;
        let sum = 0;
        for (const fur of this.getFurnituresAt(x, y)) {
            sum += fur.dataRef.size;
            if (fur.dataRef.type === typeName) {
                plate = fur;
            }
        }
        if (plate === null) {
            return;
        }
        sum += (this.getCreatureAt(x, y) || { dataRef: { size: 0 } }).dataRef.size;
        if (isCorrectSize(sum) && plate.dataRef.activationtarget) {
            // Press/release plate
            this.assignNewDataToFurniture(plate, this.data.getByType(this.data.furnitures, transformedName));

            // Activate targets
            for (const place of plate.dataRef.activationtarget) {
                const ax = place[0];
                const ay = place[1];
                this.activate(ax + plate.offsetX, ay + plate.offsetY, false);
            }
        }
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

                const canActivate = (userInitiated && fur.dataRef.useractivation) || !userInitiated;
                console.log(canActivate);

                // Handle activation targets
                if (canActivate && fur.dataRef.activationtarget) {
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

        // console.log(puzzle);

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
                this.addFurniture(furniture);
                // this.furnitures.push(furniture);
            }
        }
    }
}
