import * as $ from "jquery";
import * as ROT from "rot-js";
import { Color } from "./color";
import { GameData } from "./data";
import { DungeonGenerator } from "./dungeongen";
import { Creature, Furniture, Player } from "./entity";
import { ITile } from "./interface/entity-schema";
import { IPuzzleList, IPuzzleRoom } from "./interface/puzzle-schema";
import { ICreatureset, IFurnitureset, IItemset, ITileset } from "./interface/set-schema";
import { Level, TileVisibility } from "./level";
import { MessageBuffer } from "./messagebuffer";
import { IMouseEvent, Renderer } from "./renderer";

export class Game {
    public static readonly WIDTH: number = 600;
    public static readonly HEIGHT: number = 400;

    public data: GameData;
    public player: Player;
    public messagebuffer: MessageBuffer = new MessageBuffer(10);

    public testX: number = 0;
    public testY: number = 0;

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
            ent.willpower = getProp(ent, "willpower", 5, convertInt);
            if (!("category" in ent)) { this.data.creatures[ent.id].category = "default"; }
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
            this.currentLevel = new Level(26, 26, this.data);
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

        // Create test creatures
        const graveRobber = this.currentLevel.createCreatureAt(this.data.creatures[252],
                                                               this.player.x + 1, this.player.y);
        graveRobber.willpower = 1;
        this.currentLevel.createCreatureAt(this.data.creatures[253], this.player.x + 1, this.player.y + 2);
        this.currentLevel.createCreatureAt(this.data.creatures[254], this.player.x + 2, this.player.y + 2);

        // Transfer player's current body
        if (this.player.currentbody !== null) {
            this.currentLevel.addCreatureAt(this.player.currentbody, this.player.x, this.player.y);
        }

        this.indexForTestPuzzle++;
    }

    public assetsLoaded(): void {
        console.log("loaded");
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

    private isCurrable(x: number, y: number): boolean {
        return this.currentLevel.getCreatureAt(x, y) === null;
    }

    private creatureCanMoveTo(creSize: number, x: number, y: number): boolean {
        if (!this.currentLevel.isInLevelBounds(x, y)) {
            return false;
        }
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

        if (moving || code === "Space") {
            if (creatureBlocking && e.shiftKey && (spiritMode || code !== "Space")) {
                // Possession
                const cre = this.currentLevel.getCreatureAt(xx, yy);
                const playerWp = this.player.willpower;
                const creWp = cre.willpower;
                const baseChance =
                    (1.0 - (cre.currenthp / cre.dataRef.maxhp)) + ((playerWp - creWp) / (playerWp + creWp));
                const chance = Math.max(0.0, Math.min(1.0, baseChance));
                const creatureName = cre.dataRef.type;

                if (chance < 1.0) {
                    const action = "You try to possess the " + creatureName +
                                   " (" + Math.floor(chance * 100) + "%)";
                    this.messagebuffer.add(action);
                }

                if (Math.random() < chance) {
                    this.messagebuffer.add(chance < 1.0
                        ? "You were more potent and overcame the feeble creature."
                        : "You return to the body of " + creatureName + ".");
                    this.player.currentbody = cre;
                    this.player.currentbody.willpower = 0;
                    this.player.x = xx;
                    this.player.y = yy;
                } else {
                    this.messagebuffer.add("The creature did not submit to you.");
                }
                keyAccepted = true;
            } else {

                if (this.player.currentbody === null) {
                    if (this.creatureCanMoveTo(1, xx, yy)) {
                        this.player.x = xx;
                        this.player.y = yy;
                        keyAccepted = true;
                    }
                } else {
                    if (e.shiftKey && this.creatureCanMoveTo(1, xx, yy)) {
                        // Unpossess
                        this.player.x = xx;
                        this.player.y = yy;
                        this.messagebuffer.add("You detach from the " + this.player.currentbody.dataRef.type + ".");
                        this.player.currentbody = null;
                        keyAccepted = true;
                    } else if (this.creatureCanMoveTo(this.player.currentbody.dataRef.size, xx, yy)) {
                        // Control possessed body
                        const body = this.player.currentbody;
                        this.moveCreature(body, xx, yy);
                        this.player.x = body.x;
                        this.player.y = body.y;
                        keyAccepted = true;
                    }
                }
            }
        }

        // Check descriptions
        for (const desc of this.currentLevel.descriptions) {
            if (desc.isInside(this.player.x, this.player.y) && !desc.isRead) {
                desc.isRead = true;
                this.messagebuffer.add(desc.text);
            }
        }

        if (keyAccepted) {
            window.removeEventListener("keydown", this.keyDownCallBack);
            const speed = this.player.currentbody === null ? 5 : this.player.currentbody.dataRef.speed;
            this.updateLoop(speed);
        }
    }

    private creatureFight(attacker: Creature, defender: Creature): void {
        console.log("Fight " + attacker.dataRef.type + " vs. " + defender.dataRef.type);
        console.log(attacker);
        console.log(defender);
        const damage = attacker.dataRef.strength;
        defender.currenthp -= damage;
        const attackerName = attacker === this.player.currentbody ? "you" : attacker.dataRef.type;
        const defenderName = defender === this.player.currentbody ? "you" : "the " + defender.dataRef.type;
        console.log("hp left " + defender.currenthp);
        const color = defender === this.player.currentbody ? Color.red : Color.skin;

        const extraS = attacker === this.player.currentbody ? "" : "s";
        this.messagebuffer.add(
            attackerName + " hit" + extraS + " " + defenderName +
            " and deal" + extraS + " " + damage + " damage.", color);

        if (defender.currenthp <= 0) {
            this.messagebuffer.add(defender.dataRef.type + " died.");
            this.currentLevel.removeCreature(defender);
            if (this.player.currentbody === defender) {
                this.player.currentbody = null;
            }
        }
    }

    private moveCreature(cre: Creature, targetX: number, targetY: number): void {
        if (!this.isCurrable(targetX, targetY) && !(targetX === cre.x && targetY === cre.y)) {
            // Prevent creatures of same category fighting each other
            const defender = this.currentLevel.getCreatureAt(targetX, targetY);
            const playerControlled = cre === this.player.currentbody || defender === this.player.currentbody;
            if (playerControlled || cre.dataRef.category !== defender.dataRef.category) {
                this.creatureFight(cre, defender);
            }
        } else if (this.creatureCanMoveTo(cre.dataRef.size, targetX, targetY)) {
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
        const msg = this.currentLevel.activate(
                        mouseEvent.tx - this.mapOffsetTargetX,
                        mouseEvent.ty - this.mapOffsetTargetY, true);

        if (msg) {
            this.messagebuffer.add(msg);
        }
        this.renderer.renderGame();
    }

    private updateLoop(deltaTime: number): void {
        for (const cre of this.currentLevel.creatures) {
            if (this.player.currentbody === cre || cre.currenthp <= 0) {
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

        const path: Array<[number, number]> = [];

        // Follow the player
        const playerBody = this.player.currentbody;
        const tileState = this.currentLevel.getTileState(cre.x, cre.y).state;
        if (playerBody !== null && (tileState === TileVisibility.Visible || tileState === TileVisibility.Remembered)) {
            const dijkstra = new ROT.Path.Dijkstra(playerBody.x, playerBody.y, passable, { topology: 4 });
            dijkstra.compute(cre.x, cre.y, (x: number, y: number) => {
                path.push([x, y]);
            });
        }

        console.log(path);

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
            this.currentLevel.activate(targetX, targetY, true);
        }
    }
}

// TODO: start after DOM has been loaded
const game = new Game();
game.start();
