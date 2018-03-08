import * as $ from "jquery";
import * as ROT from "rot-js";
import { Color } from "./color";
import { GameData } from "./data";
import { DungeonGenerator } from "./dungeongen";
import { Creature, Furniture, Player, PuzzleRoom } from "./entity";
import { ITile } from "./interface/entity-schema";
import { IPuzzleList, IPuzzleRoom } from "./interface/puzzle-schema";
import { ICreatureset, IFurnitureset, IItemset, ITileset } from "./interface/set-schema";
import { Level, TileVisibility } from "./level";
import { MessageBuffer } from "./messagebuffer";
import { IMouseEvent, Renderer } from "./renderer";

export class Game {
    public static readonly WIDTH: number = 600;
    public static readonly HEIGHT: number = 400;

    // TODO: this is bad
    public static startRoomX: number = 0;
    public static startRoomY: number = 0;

    public data: GameData;
    public player: Player;
    public messagebuffer: MessageBuffer = new MessageBuffer(10);

    public indexForTestPuzzle: number = 0;
    public testPuzzleName: string = "";

    public waitForDirCallback: (delta: [number, number]) => void = null;
    public waitForMessage: string = "";

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
        const startRoomDef = await this.loadJSON<IPuzzleRoom>("data/puzzles/other12_1_tombofplayer.json");
        const finalRoomDef =
            await this.loadJSON<IPuzzleRoom>("data/puzzles/other24_bossfloor_tombofceciliaandvictorii.json");
        this.data.predefinedRooms.startRoom = new PuzzleRoom(startRoomDef);
        this.data.predefinedRooms.finalRoom = new PuzzleRoom(finalRoomDef);

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
        for (const cre of creatureset.creatures) {
            this.data.creatures[cre.id] = cre;
            cre.willpower = getProp(cre, "willpower", 5, convertInt);
            cre.offensiveslot = getProp(cre, "offensiveslot", false, convertBool);
            cre.defenciveslot = getProp(cre, "defenciveslot", false, convertBool);
            if (!("category" in cre)) { this.data.creatures[cre.id].category = "default"; }
            if (!("inventoryslots" in cre)) { this.data.creatures[cre.id].inventoryslots = null; }
            if (!("inventory" in cre)) { this.data.creatures[cre.id].inventory = null; }
            // console.log(cre);
        }

        // Load item data
        for (const item of itemset.items) {
            this.data.items[item.id] = item;
            // console.log(item);
        }

        // Load tile data
        for (const tile of tileset.tiles) {
            tile.damage = getProp(tile, "damage", 0, convertInt);
            tile.maxsize = getProp(tile, "maxsize", 0, convertInt);
            tile.transparent = getProp(tile, "transparent", true, convertBool);
            this.data.tiles[tile.id] = tile;
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
            furry.damage = getProp(furry, "damage", 0, convertInt);
            furry.transparent = getProp(furry, "transparent", true, convertBool);
            furry.draworder = getProp(furry, "draworder", 0, convertInt);
            this.data.furnitures[furry.icon] = furry;
            if (!("activation" in furry)) { this.data.furnitures[furry.icon].activation = null; }
            if (!("useractivation" in furry)) { this.data.furnitures[furry.icon].useractivation = null; }
            if (!("useractivationtext" in furry)) { this.data.furnitures[furry.icon].useractivationtext = null; }
            if (!("requireitem" in furry)) { this.data.furnitures[furry.icon].requireitem = null; }
            if (!("activationtarget" in furry)) { this.data.furnitures[furry.icon].activationtarget = null; }
            // console.log(furry);
        }

        this.loadLevel();
    }

    public placePlayerAtFurniture(furType: string): void {
        for (const fur of this.currentLevel.furnitures) {
            if (fur.dataRef.type === furType) {
                this.player.x = fur.x;
                this.player.y = fur.y;
            }
        }
    }

    public nextLevel(): void {
        if (this.currentLevel.nextLevel === null) {
            this.currentLevel.nextLevel = DungeonGenerator.generateLevel(this, 5, 5, this.currentLevel.depth + 1);
            this.currentLevel.nextLevel.prevLevel = this.currentLevel;
        }
        this.currentLevel = this.currentLevel.nextLevel;

        this.placePlayerAtFurniture("stairsup");

        this.mapOffsetX = this.mapOffsetTargetX;
        this.mapOffsetY = this.mapOffsetTargetY;
    }

    public prevLevel(): void {
        if (this.currentLevel.prevLevel === null) {
            this.messagebuffer.add("Those stairs lead out of the crypt. You do not want to go there.");
            return;
        }
        this.currentLevel = this.currentLevel.prevLevel;

        this.placePlayerAtFurniture("stairsdown");

        this.mapOffsetX = this.mapOffsetTargetX;
        this.mapOffsetY = this.mapOffsetTargetY;
    }

    public loadLevel(): void {
        const testMode = false;

        if (!testMode) {
            this.currentLevel = DungeonGenerator.generateLevel(this, 5, 5, 1);
        } else {
            this.currentLevel = new Level(26, 26, 1, this.data);
        }

        this.player.x = Game.startRoomX * 12 + 9;
        this.player.y = Game.startRoomY * 12 + 4;

        // Place test puzzle map into current level
        if (testMode) {
            const testpuzzle = this.data.predefinedRooms.level[0].puzzles[0];
            console.log("Loading puzzle " + testpuzzle.dataRef.puzzlename);
            this.testPuzzleName = testpuzzle.dataRef.puzzlename;
            this.currentLevel.placePuzzleAt(1, 1, testpuzzle.dataRef);
        }

        this.mapOffsetX = this.mapOffsetTargetX;
        this.mapOffsetY = this.mapOffsetTargetY;

        // Create initial grave robber
        const graveRobber = this.currentLevel.createCreatureAt(this.data.creatures[252],
                                                               this.player.x - 1, this.player.y);
        graveRobber.willpower = 1;

        this.currentLevel.createItemAt(this.data.items[1], this.player.x, this.player.y + 1);
        this.currentLevel.createItemAt(this.data.items[2], this.player.x, this.player.y + 1);

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
        const moving = !(dx === 0 && dy === 0);
        const dirKeyPressed = moving || code === "Space";

        const creatureBlocking = !this.isCurrable(xx, yy);
        const spiritMode = this.player.currentbody === null;

        if (this.waitForDirCallback !== null && dirKeyPressed) {
            this.waitForDirCallback([dx, dy]);
            this.waitForDirCallback = null;
            keyAccepted = true;
        }

        // Debugging keys
        // if (e.code === "KeyQ") {
        //     this.loadLevel();
        // }
        if (e.code === "KeyP") {
            this.placePlayerAtFurniture("stairsup");
        }
        if (e.code === "KeyO") {
            this.placePlayerAtFurniture("stairsdown");
        }

        // A - activate
        if (e.code === "KeyA" && !spiritMode) {
            this.waitForDirCallback = this.activateTileCallback.bind(this);
            this.waitForMessage = "Press a direction where to activate (space = current tile)";
            keyAccepted = true;
        }
        if (e.code === "KeyA" && spiritMode) {
            this.messagebuffer.add("You can not activate objects as a spirit.");
        }

        // S - slide (push)
        if (e.code === "KeyS" && !spiritMode) {
            this.waitForDirCallback = this.pushObjectCallback.bind(this);
            this.waitForMessage = "Press a direction where to push";
            keyAccepted = true;
        }
        if (e.code === "KeyS" && spiritMode) {
            this.messagebuffer.add("You can not push up items as a spirit.");
        }

        // G - get item
        if (e.code === "KeyG" && !spiritMode) {
            const items = this.currentLevel.getItemsAt(this.player.x, this.player.y);
            if (items.length > 0) {
                // TODO: pick up
            } else {
                this.messagebuffer.add("Nothing to pick up here.");
            }
            keyAccepted = true;
        }
        if (e.code === "KeyG" && spiritMode) {
            this.messagebuffer.add("You can not pick up items as a spirit.");
        }

        // Z - use stairs
        if (e.code === "KeyZ") {
            const furs = this.currentLevel.getFurnituresAt(this.player.x, this.player.y);
            let movedir = 0;
            for (const fur of furs) {
                if (fur.dataRef.type === "stairsup") {
                    movedir = -1;
                    break;
                }
                if (fur.dataRef.type === "stairsdown") {
                    movedir = 1;
                    break;
                }
            }
            if (movedir === 1) {
                this.nextLevel();
            } else if (movedir === -1) {
                this.prevLevel();
            } else {
                this.messagebuffer.add("There are no stairs here.");
            }
        }

        // Movement
        if (!keyAccepted && dirKeyPressed) {
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
                    } else {
                        console.log(this.currentLevel.getTile(xx, yy).maxsize);
                        if (this.currentLevel.getTile(xx, yy).maxsize > 0) {
                            this.messagebuffer.add("You are too big to move there.");
                        }
                    }
                }
                this.reportItemsAt(this.player.x, this.player.y);
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

    private activateTileCallback(delta: [number, number]): void {
        const dx = delta[0];
        const dy = delta[1];
        const msg = this.currentLevel.activate(
            this.player.currentbody.x + dx,
            this.player.currentbody.y + dy, true);

        if (msg) {
            this.messagebuffer.add(msg);
        }
    }

    private pushObjectCallback(delta: [number, number]): void {
        const dx = delta[0];
        const dy = delta[1];
        const xx = this.player.currentbody.x + dx;
        const yy = this.player.currentbody.y + dy;
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
                    this.messagebuffer.add("You push the " + fur.dataRef.type + ".");
                    this.checkPressureDeactivation(oldX, oldY);
                    this.checkPressureActivation(fur.x, fur.y);
                    break;
                } else {
                    this.messagebuffer.add("Not enough space to push the " + fur.dataRef.type + " there.");
                }
            } else {
                this.messagebuffer.add("The " + fur.dataRef.type + " is too heavy for you to push.");
            }
        }
    }

    private checkDeath(cre: Creature): void {
        if (cre.currenthp <= 0) {
            const your = cre === this.player.currentbody ? "your " : "";
            this.messagebuffer.add(your + cre.dataRef.type + " died.");
            this.currentLevel.removeCreature(cre);
            if (this.player.currentbody === cre) {
                this.player.currentbody = null;
                this.messagebuffer.add("You detach from the corpse.", Color.red);
            }
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

        this.checkDeath(defender);
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

            const damage = this.currentLevel.getTileDamage(targetX, targetY);
            if (damage > 0) {
                cre.currenthp -= damage;
                if (cre === this.player.currentbody) {
                    const tileName = this.currentLevel.getTile(targetX, targetY).type;
                    this.messagebuffer.add("You take " + damage + " from the " + tileName + "!", Color.red);
                }
                this.checkDeath(cre);
            }
        }
    }

    private reportItemsAt(x: number, y: number): void {
        const items = this.currentLevel.getItemsAt(x, y);
        if (items.length > 0)  {
            const addedA = items.length === 1 ? "a " : "";
            let msg = "You see here " + addedA;
            for (let index = 0; index < items.length; index++) {
                const item = items[index];
                const comma = index === items.length - 1 ? "" : ", ";
                msg += item.dataRef.name + comma;
            }
            msg += ".";
            this.messagebuffer.add(msg);
        }

        const furs = this.currentLevel.getFurnituresAt(x, y);
        if (furs.length > 0)  {
            const addedA = furs.length === 1 ? "a " : "";
            let msg = "You see here " + addedA;
            for (let index = 0; index < furs.length; index++) {
                const fur = furs[index];
                const comma = index === furs.length - 1 ? "" : ", ";
                msg += fur.dataRef.name + comma;
            }
            msg += ".";
            this.messagebuffer.add(msg);
        }
    }

    private checkPressureActivation(x: number, y: number): void {
        this.currentLevel.checkPressureActivation(x, y, "pressureplate", "pressureplatedown", (size) => size >= 8);
    }

    private checkPressureDeactivation(x: number, y: number): void {
        this.currentLevel.checkPressureActivation(x, y, "pressureplatedown", "pressureplate", (size) => size < 8);
    }

    private handleClick(mouseEvent: IMouseEvent): void {
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
            this.currentLevel.activate(targetX, targetY, true);
        }
    }
}

// TODO: start after DOM has been loaded
const game = new Game();
game.start();
