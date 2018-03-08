import * as $ from "jquery";
import * as ROT from "rot-js";
import { Color } from "./color";
import { GameData } from "./data";
import { DungeonGenerator } from "./dungeongen";
import { Creature, Furniture, Player } from "./entity";
import { ITile } from "./interface/entity-schema";
import { IPuzzleList, IPuzzleRoom } from "./interface/puzzle-schema";
import { ICreatureset, IFurnitureset, IItemset, ITileset } from "./interface/set-schema";
import { Level } from "./level";
import { IMouseEvent, Renderer } from "./renderer";

export class Game {
    public static readonly WIDTH: number = 600;
    public static readonly HEIGHT: number = 400;

    public data: GameData;
    public player: Player;

    public testX: number;
    public testY: number;

    public indexForTestPuzzle: number = 0;
    public testPuzzleName: string = "";
    public waitForPushKey: boolean = false;

    // Animation variables
    public spiritFadeTimer: number = 0;
    public spiritTintColors: number[] = [0xFFFFFF, Color.white, 0x7777FF];
    public currentTintColor: number = 0xFFFFFF;

    public spiritAnimationIndex: 0 = 0;
    public spiritAnimationIndices: number[] = [255, 239, 255, 223, 207, 255, 191];

    public mapOffsetX: number;
    public mapOffsetY: number;

    private renderer: Renderer;
    private currentLevel: Level;

    private handlers: { [id: number]: (e: KeyboardEvent) => void } = {};

    private keyDownCallBack: any;


    public get mapOffsetTargetX(): number {
        return 19 - this.player.x;
    }

    public get mapOffsetTargetY(): number {
        return 12 - this.player.y;
    }

    public start(): void {
        this.keyDownCallBack = this.handleKeyPress.bind(this);
        this.data = new GameData();
        this.renderer = new Renderer(this);
        this.renderer.addClickListener(this.handleClick.bind(this));

        Promise.all([this.loadData(), this.renderer.loadGraphics()])
          .then(this.assetsLoaded.bind(this));

        this.player = new Player();
        this.player.dataRef  = this.data.player;
        this.player.x = 10;
        this.player.y = 10;
        this.player.currentbody = null;
        this.player.currentstability = this.player.spiritstability;
        this.player.spiritpower = 10;
        this.player.willpower = 10;
    }

    public async loadData(): Promise<void> {
        console.log("Started loadData");
        const tileset = await this.loadJSON<ITileset>("data/tileset.json");
        const creatureset = await this.loadJSON<ICreatureset>("data/creatureset.json");
        const itemset = await this.loadJSON<IItemset>("data/itemset.json");
        const furnitureset = await this.loadJSON<IFurnitureset>("data/furnitureset.json");
        const puzzleList = await this.loadJSON<IPuzzleList>("data/puzzlelist.json");

        // console.log(puzzleList);

        const roomLoader = async (roomType: "puzzles"|"other"|"pre"|"base") => {
            for (let index = 0; index < puzzleList[roomType].length; index++) {
                const roomLevels = puzzleList[roomType][index];
                const rooms = [];
                for (const levelName of roomLevels) {
                    // console.log("loading " + levelName);
                    const puzzle = await this.loadJSON<IPuzzleRoom>("data/puzzles/" + levelName);
                    puzzle.puzzlename = levelName;
                    rooms.push(puzzle);
                }
                this.data.predefinedRooms.addLevelRooms(index, roomType, rooms);
            }
        };

        await roomLoader("puzzles");
        await roomLoader("other");
        await roomLoader("pre");
        await roomLoader("base");
        console.log(this.data);

        const convertInt = (x: string): number => {
            const value = parseInt(x, 10);
            if (value !== value) {
                console.error("Failed to convert prop '" + x + "' to integer");
                return 0;
            }
            return value;
        };

        const convertBool = (x: any): boolean => {
            if (x === "true") { return true; }
            if (x === "false") { return false; }
            if (x === true) { return true; }
            if (x === false) { return false; }
            console.error("Failed to convert prop '" + x + "' to boolean");
            return false;
        };

        const getProp = (object, name, defaultValue, converter: any): any => {
            if (name in object) {
                const value = object[name];
                return converter(value);
            }
            return defaultValue;
        };

        // Load the creatures to data
        for (const ent of creatureset.creatures) {
            this.data.creatures[ent.id] = ent;
            if (!("inventoryslots" in ent)) { this.data.creatures[ent.id].inventoryslots = null; }
            if (!("inventory" in ent)) { this.data.creatures[ent.id].inventory = null; }
        }

        for (const ent of itemset.items) {
            this.data.items[ent.id] = ent;
        }

        // Fill empty fields with default values
        for (const tile of tileset.tiles) {
            tile.damage = getProp(tile, "damage", 0, convertInt);
            tile.maxsize = getProp(tile, "maxsize", 0, convertInt);
            tile.transparent = getProp(tile, "transparent", true, convertBool);
            this.data.tiles[tile.id] = tile;
            // this.data.tiles[tile.id] = tile;
            // if (!("damage" in tile)) { this.data.tiles[tile.id].damage = 0; }
            // if (!("maxsize" in tile)) { this.data.tiles[tile.id].maxsize = 0; }
            // if (!("transparent" in tile)) { this.data.tiles[tile.id].transparent = true; }
            if (!("activation" in tile)) { this.data.tiles[tile.id].activation = null; }
            if (!("requireitem" in tile)) { this.data.tiles[tile.id].requireitem = null; }
            if (!("useractivation" in tile)) { this.data.tiles[tile.id].useractivation = null; }
            if (!("useractivationtext" in tile)) { this.data.tiles[tile.id].useractivationtext = null; }
            // console.log(tile);
        }

        for (const furry of furnitureset.furnitures) {
            furry.movable = getProp(furry, "movable", 21, convertInt);
            furry.size = getProp(furry, "size", 21, convertInt);
            furry.movable = getProp(furry, "movable", 21, convertInt);
            // furry.maxsize = getProp(furry, "maxsize", 0, convertInt);
            furry.damage = getProp(furry, "damage", 0, convertInt);
            furry.transparent = getProp(furry, "transparent", true, convertBool);
            furry.draworder = getProp(furry, "draworder", 0, convertInt);
            this.data.furnitures[furry.icon] = furry;
            // if (!("movable" in furry)) { this.data.furnitures[furry.icon].movable = 21; }
            // if (!("maxsize" in furry)) { this.data.furnitures[furry.icon].maxsize = 0; }
            // if (!("size" in furry)) { this.data.furnitures[furry.icon].size = 21; }
            // if (!("damage" in furry)) { this.data.furnitures[furry.icon].damage = 0; }
            if (!("activation" in furry)) { this.data.furnitures[furry.icon].activation = null; }
            if (!("useractivation" in furry)) { this.data.furnitures[furry.icon].useractivation = null; }
            if (!("useractivationtext" in furry)) { this.data.furnitures[furry.icon].useractivationtext = null; }
            if (!("requireitem" in furry)) { this.data.furnitures[furry.icon].requireitem = null; }
            if (!("activationtarget" in furry)) { this.data.furnitures[furry.icon].activationtarget = null; }
            // console.log(furry);
        }

        this.loadLevel();
    }

    public loadLevel(): void {
        const testMode = false;

        if (!testMode) {
            this.currentLevel = DungeonGenerator.generateLevel(this, 5, 5);
        } else {
            this.currentLevel = new Level(25, 25, this.data);
        }

        this.player.x = 6;
        this.player.y = 6;

        // Place test puzzle map into current level
        if (testMode) {
            const testpuzzle = this.data.predefinedRooms.level[0].puzzles[0];
            console.log("Loading puzzle " + testpuzzle.dataRef.puzzlename);
            this.testPuzzleName = testpuzzle.dataRef.puzzlename;
            this.currentLevel.placePuzzleAt(1, 1, testpuzzle.dataRef);
        }

        this.mapOffsetX = this.mapOffsetTargetX;
        this.mapOffsetY = this.mapOffsetTargetY;

        // Create test creature
        this.currentLevel.createCreatureAt(this.data.creatures[253], this.player.x + 1, this.player.y, 10);

        // Transfer player's current body
        if (this.player.currentbody !== null) {
            this.currentLevel.addCreatureAt(this.player.currentbody, this.player.x, this.player.y);
        }

        this.indexForTestPuzzle++;
    }

    public assetsLoaded(): void {
        console.log("loaded");
        console.log(this.data.creatures);
        console.log(this.data.player);
        console.log(this.data.creatures[253]);
        setInterval(this.updateTinting.bind(this), 60);
        setInterval(this.updatePlayerAnimation.bind(this), 42 * 4);
        setInterval(this.updateScrollAnim.bind(this), 1 / 30.0);
        this.updateLoop(0);
    }

    public updateScrollAnim(): void {
        this.mapOffsetX += (this.mapOffsetTargetX - this.mapOffsetX) * (1 / 42.0);
        this.mapOffsetY += (this.mapOffsetTargetY - this.mapOffsetY) * (1 / 42.0);
        this.renderer.renderGame();
    }

    public updateTinting(): void {
        const playerInsideBody = this.player.currentbody === null;
        if (playerInsideBody) {
            this.spiritFadeTimer = Math.min(1.0, this.spiritFadeTimer + 0.2);
        } else {
            this.spiritFadeTimer = Math.max(0.0, this.spiritFadeTimer - 0.2);
        }
        const tintColor = this.spiritTintColors[Math.floor(this.spiritFadeTimer * (this.spiritTintColors.length - 1))];
        if (tintColor !== this.currentTintColor) {
            this.currentTintColor = tintColor;
            this.renderer.renderGame();
        }
    }
    public updatePlayerAnimation(): void {
        this.spiritAnimationIndex++;
        if (this.spiritAnimationIndex >= this.spiritAnimationIndices.length) {
            this.spiritAnimationIndex = 0;
        }
        this.renderer.renderGame();
    }

    public getCurrentLevel(): Level {
        return this.currentLevel;
    }

    // private isPassable(ownSize: number, x: number, y: number): boolean {
        // const plSize = this.player.currentbody === null ? 1 : this.player.currentbody.dataRef.size;
        // return ownSize <= this.data.tiles[this.currentLevel.get(x, y)].maxsize;
    // }

    private isCurrable(x: number, y: number): boolean {
        return this.currentLevel.getCreatureAt(x, y) === null;
    }

    private isFurrable(creSize: number, furs: Furniture[], tile: ITile, x: number, y: number): boolean {
        // let val = true;
        let pile = 0;
        // const playerSize = this.player.currentbody === null ? 1 : this.player.currentbody.dataRef.size;

        for (const fur of furs) {
            pile += fur.dataRef.size;
        }
        // console.log(furs);
        // console.log(tile);
        // console.log("pile: " + pile + " / " + tile.maxsize);
        // console.log("pile+player: " + (pile + playerSize) + " / " + tile.maxsize);
        return (pile + creSize) <= tile.maxsize;
    }

    private creatureCanMoveTo(creSize: number, x: number, y: number): boolean {
        let pile = 0;
        for (const fur of this.currentLevel.getFurnituresAt(x, y)) {
            pile += fur.dataRef.size;
        }
        const tile = this.currentLevel.getTile(x, y);
        return (pile + creSize) <= tile.maxsize;
    }

    private loadJSON<T>(path: string): Promise<T> {
        return new Promise((resolve, reject) => {
            $.getJSON(path, (data: any, textStatus: string, jqXHR: JQueryXHR) => {
                resolve(data);
            }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
                console.log("loadJSON(" + path + ") failed: " + JSON.stringify(textStatus));
            });
        });
    }

    private playerTurn(): void {
        window.addEventListener("keydown", this.keyDownCallBack);
    }

    private handleKeyPress(e: KeyboardEvent): void {
        const px = this.player.x;
        const py = this.player.y;
        let keyAccepted = false;

        const code = e.code;
        console.log(e.code);

        const dx = code === "ArrowRight" ? 1 : (code === "ArrowLeft") ? -1 : 0;
        const dy = code === "ArrowDown" ? 1 : (code === "ArrowUp") ? -1 : 0;
        const xx = px + dx;
        const yy = py + dy;
        let moving = !(dx === 0 && dy === 0);

        // let moving = code === "ArrowUp" || code === "ArrowDown" ||
        //  code === "ArrowLeft" || code === "ArrowRight" || code === "Space" ? true : false;
        // xx = code === "ArrowRight" ? xx += 1 : (code === "ArrowLeft") ? xx -= 1 : xx;
        // yy = code === "ArrowDown" ? yy += 1 : (code === "ArrowUp") ? yy -= 1 : yy;

        const creatureBlocking = !this.isCurrable(xx, yy);
        const spiritMode = this.player.currentbody === null;

        if (e.code === "KeyQ") {
            this.loadLevel();
        }

        if (e.code === "KeyP" && !spiritMode) {
            this.waitForPushKey = true;
            keyAccepted = true;
        }

        if (this.waitForPushKey && moving) {
            this.waitForPushKey = false;
            for (const fur of this.currentLevel.getFurnituresAt(xx, yy)) {
                const furTargetX = fur.x + dx;
                const furTargetY = fur.y + dy;
                const targetTile = this.data.tiles[this.currentLevel.get(furTargetX, furTargetY)];
                if (this.player.currentbody.dataRef.size >= fur.dataRef.movable) {
                    const furSizeAtTile = this.currentLevel.getTotalFurnitureSizeAt(furTargetX, furTargetY);
                    if (furSizeAtTile + fur.dataRef.size <= targetTile.maxsize) {
                        const oldX = fur.x;
                        const oldY = fur.y;
                        fur.x = xx + dx;
                        fur.y = yy + dy;
                        this.checkPressureDeactivation(oldX, oldY);
                        this.checkPressureActivation(fur.x, fur.y);
                        break;
                    }
                }
            }
            moving = false;
            keyAccepted = true;
        }

        // Player tries to move. Switch?
        // Tried to move into a tile with a creature
        // TODO fight?

        if (moving || code === "Space") {
            if (creatureBlocking && !spiritMode && !e.shiftKey && code !== "Space") {
                const action = "You try to hit the " + this.currentLevel.getCreatureAt(xx, yy).dataRef.type;
                console.log(action);
                keyAccepted = true;
            } else if (creatureBlocking && e.shiftKey && spiritMode) {
                // Possessing
                const action = "You try to possess the " + this.currentLevel.getCreatureAt(xx, yy).dataRef.type;
                console.log(action);
                if (this.player.spiritpower >= this.currentLevel.getCreatureAt(xx, yy).willpower) {
                    console.log("You were more potent and overcame the feeble creature.");
                    this.player.currentbody = this.currentLevel.getCreatureAt(xx, yy);
                    this.player.currentbody.willpower = 0;
                    this.player.x = xx;
                    this.player.y = yy;
                } else {
                    console.log("The creature did not submit to you.");
                    console.log(this.currentLevel.getCreatureAt(xx, yy).willpower);
                }
                keyAccepted = true;
            } else {

                if (spiritMode) {
                    if (this.creatureCanMoveTo(1, xx, yy)) {
                        this.player.x = xx;
                        this.player.y = yy;
                        keyAccepted = true;
                    }
                } else {
                    if (e.shiftKey && this.creatureCanMoveTo(1, xx, yy)) {
                        this.player.x = xx;
                        this.player.y = yy;
                        this.player.currentbody = null;
                        keyAccepted = true;
                    } else if (this.creatureCanMoveTo(this.player.currentbody.dataRef.size, xx, yy)) {
                        this.player.x = xx;
                        this.player.y = yy;
                        this.moveCreature(this.player.currentbody, xx, yy);
                        keyAccepted = true;
                    }
                }
            }
        }

        if (keyAccepted) {
            window.removeEventListener("keydown", this.keyDownCallBack);
            this.updateLoop(5);
        }
    }

    private moveCreature(cre: Creature, targetX: number, targetY: number): void {
        if (this.isFurrable(cre.dataRef.size, this.currentLevel.getFurnituresAt(targetX, targetY),
            this.currentLevel.getTile(targetX, targetY), targetX, targetY)) {
        const oldX = cre.x;
        const oldY = cre.y;
        cre.x = targetX;
        cre.y = targetY;
        this.checkPressureDeactivation(oldX, oldY);
        this.checkPressureActivation(targetX, targetY);
            }
    }

    private checkPressureActivation(x: number, y: number): void {
        this.currentLevel.checkPressureActivation(x, y, "pressureplate", "pressureplatedown", (size) => size >= 8);
    }

    private checkPressureDeactivation(x: number, y: number): void {
        this.currentLevel.checkPressureActivation(x, y, "pressureplatedown", "pressureplate", (size) => size < 8);
    }

    private handleClick(mouseEvent: IMouseEvent): void {
        this.testX = mouseEvent.tx - this.mapOffsetTargetX;
        this.testY = mouseEvent.ty - this.mapOffsetTargetY;
        console.log(mouseEvent);
        this.currentLevel.activate(mouseEvent.tx - this.mapOffsetTargetX, mouseEvent.ty - this.mapOffsetTargetY, true);
        this.renderer.renderGame();
    }

    private updateLoop(deltaTime: number): void {
        for (const cre of this.currentLevel.creatures) {
            console.log(cre);
            if (this.player.currentbody === cre) {
                continue;
            }
            cre.time += deltaTime;
            while (cre.time > cre.dataRef.speed) {
                cre.time -= cre.dataRef.speed;

                if (cre.willpower > 0) {
                    this.updateAI(cre);
                }
            }
        }
        this.renderer.renderGame();
        this.playerTurn();
    }

    private updateAI(cre: Creature): void {
        const passable = (x: number, y: number) => {
            let canMove = this.creatureCanMoveTo(cre.dataRef.size, x, y);
            if (!canMove && cre.dataRef.size >= 5) {
                for (const fur of this.currentLevel.getFurnituresAt(x, y)) {
                    if (fur.dataRef.useractivation) {
                        canMove = true;
                        break;
                    }
                }
            }
            return canMove;
        };

        const dijkstra = new ROT.Path.Dijkstra(this.testX, this.testY, passable, { topology: 4 });

        const path: Array<[number, number]> = [];
        dijkstra.compute(cre.x, cre.y, (x: number, y: number) => {
            path.push([x, y]);
        });

        // console.log(path);

        let dx = 0;
        let dy = 0;
        if (path.length > 1) {
            dx = path[1][0] - cre.x;
            dy = path[1][1] - cre.y;
        } else {
            dx = Math.floor(Math.random() * 3) - 1;
            dy = Math.floor(Math.random() * 3) - 1;
        }

        const targetX = cre.x + dx;
        const targetY = cre.y + dy;
        if (this.creatureCanMoveTo(cre.dataRef.size, targetX, targetY)) {
            // Move freely to target position
            this.moveCreature(cre, cre.x + dx, cre.y + dy);
        } else {
            // Attempt to activate tile if movement failed
            // TODO: suppress activation texts?
            this.currentLevel.activate(targetX, targetY, true);
        }
    }
}

// TODO: start after DOM has been loaded
const game = new Game();
game.start();
