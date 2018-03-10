import * as ROT from "rot-js";
import { App } from "..";
import { Color } from "../color";
import { GameData } from "../data";
import { DungeonGenerator } from "../dungeongen";
import { Creature, Item, Player, SlotType } from "../entity";
import { Level, TileVisibility } from "../level";
import { MessageBuffer } from "../messagebuffer";
import { IMouseEvent, Renderer } from "../renderer";
import { CharCreation } from "./charcreation";
import { GameOver } from "./gameover";
import { IGameWindow } from "./window";

export class Game implements IGameWindow {
    public static readonly WIDTH: number = 600;
    public static readonly HEIGHT: number = 400;

    public static debugMode: boolean = false;

    // TODO: this is bad
    public static startRoomX: number = 0;
    public static startRoomY: number = 0;

    public static showPossessTutorial: boolean = true;

    public helpToggledOn: boolean = false;

    public data: GameData;
    public player: Player;
    public messagebuffer: MessageBuffer = new MessageBuffer(10);

    public indexForTestPuzzle: number = 0;
    public testPuzzleName: string = "";

    public waitForDirCallback: (delta: [number, number]) => boolean = null;
    public waitForMessage: string[] = [];

    public waitForItemCallback: (keyCode: string) => boolean = null;
    public itemSlotToBeUsed: number = 0;

    // Animation variables
    public spiritFadeTimer: number = 1.0;
    public spiritTintColors: number[] = [0xFFFFFF, Color.white, 0x7777FF];
    public currentTintColor: number = 0xFFFFFF;

    public spiritAnimationIndex: 0 = 0;
    public spiritAnimationIndices: number[] = [255, 239, 255, 223, 207, 255, 191];

    public mapOffsetX: number;
    public mapOffsetY: number;

    private renderer: Renderer;
    private currentLevel: Level = null;

    private winReason: string = null;

    private handlers: { [id: number]: (e: KeyboardEvent) => void } = {};

    // private chargen: CharCreation = null;
    private intervalIds: number[] = [];

    constructor(renderer: Renderer, data: GameData, player: Player) {
        this.player = player;
        this.renderer = renderer;
        this.data = data;
    }

    public get mapOffsetTargetX(): number {
        return 19 - this.player.x;
    }

    public get mapOffsetTargetY(): number {
        return 12 - this.player.y;
    }

    public startWindow(): void {
        this.renderer.setGame(this);

        this.loadFirstLevel();

        this.intervalIds.push(setInterval(this.updateTinting.bind(this), 60));
        this.intervalIds.push(setInterval(this.updatePlayerAnimation.bind(this), 42 * 4));
        this.intervalIds.push(setInterval(this.updateScrollAnim.bind(this), 1 / 30.0));
        this.updateLoop(0);
    }

    public stopWindow(): void {
        this.intervalIds.forEach((interval) => { clearInterval(interval); });
    }

    public checkPlayerDeath(app: App): boolean {
        if (this.player.currentstability <= 0) {
            const gameover = new GameOver(this.renderer.renderer, "GAME OVER", [
                "You failed to get your revenge. Your spirit couldn't keep maintaining its form in the world of the",
                "living and because of your curse and all the lingering hatred in your soul, your spirit couldn't pass",
                "on to the spirit world. You are now doomed to exist between worlds, for all eternity.",
            ]);
            app.setWindow(gameover);
            return true;
        }
        return false;
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

        // Transfer player's current body
        if (this.player.currentbody !== null) {
            this.currentLevel.removeCreature(this.player.currentbody);
            this.currentLevel.addCreatureAt(this.player.currentbody, this.player.x, this.player.y);
        }

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

        // Transfer player's current body
        if (this.player.currentbody !== null) {
            this.currentLevel.removeCreature(this.player.currentbody);
            this.currentLevel.addCreatureAt(this.player.currentbody, this.player.x, this.player.y);
        }

        this.placePlayerAtFurniture("stairsdown");

        this.mapOffsetX = this.mapOffsetTargetX;
        this.mapOffsetY = this.mapOffsetTargetY;
    }

    public loadFirstLevel(): void {
        const testMode = false;

        if (!testMode) {
            this.currentLevel = DungeonGenerator.generateLevel(this, 5, 5, 1);
        } else {
            // this.currentLevel = new Level(26, 26, 1, this.data);
            this.currentLevel = DungeonGenerator.bossroomTesting(this, 1, 1, 10);
        }

        // Place test puzzle map into current level
        if (testMode) {
            // const testpuzzle = this.data.predefinedRooms.level[0].puzzles[0];
            // console.log("Loading puzzle " + testpuzzle.dataRef.puzzlename);
            // this.testPuzzleName = testpuzzle.dataRef.puzzlename;
            // this.currentLevel.placePuzzleAt(1, 1, testpuzzle.dataRef);
            this.player.x = 1;
            this.player.y = 1;
            const creSpawnlist = [224, 248, 243, 242];
            for (let index = 0; index < creSpawnlist.length; index++) {
                const element = creSpawnlist[index];
                const testcre = this.currentLevel.createCreatureAt(this.data.creatures[element],
                    this.player.x, this.player.y + 2 + index);
                testcre.willpower = 0;
            }
            for (let index = 0; index < 10; index++) {
                this.currentLevel.createItemAt(
                    this.data.items[14], this.player.x, this.player.y + creSpawnlist.length + index + 4);
            }
        } else {
            this.player.x = Game.startRoomX * 12 + 9;
            this.player.y = Game.startRoomY * 12 + 4;

            // Create initial grave robber
            const graveRobber = this.currentLevel.createCreatureAt(this.data.creatures[252],
                                                                   this.player.x - 1, this.player.y);
            graveRobber.willpower = 1;
            graveRobber.inventory.forEach((startItemSlot) => graveRobber.removeItem(startItemSlot.item));

            // Create rat in the lower room
            const rat = this.currentLevel.createCreatureAt(this.data.creatures[250], this.player.x, this.player.y + 5);
            rat.dataRef = Object.assign({}, rat.dataRef, {}); // Create copy of rat's data
            rat.dataRef.size = 2;
            rat.dataRef.description = "A very fat rat.";
        }

        this.mapOffsetX = this.mapOffsetTargetX;
        this.mapOffsetY = this.mapOffsetTargetY;

        // Testing items
        // this.currentLevel.createItemAt(this.data.items[14], this.player.x - 2, this.player.y + 1);
        // this.currentLevel.createItemAt(this.data.items[1], this.player.x - 1, this.player.y + 1);
        // this.currentLevel.createItemAt(this.data.items[2], this.player.x - 1, this.player.y + 1);

        this.indexForTestPuzzle++;
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

    public reduceStability(amount: number, app: App): void {
        if (!Game.debugMode) {
            this.player.currentstability -= amount;
            if (this.checkPlayerDeath(app)) {
                return;
            }
        } else {
            this.player.currentstability = this.player.spiritstability;
        }
    }

    public draw(): void {
        //
    }

    public handleKeyPress(app: App, e: KeyboardEvent): void {
        const px = this.player.x;
        const py = this.player.y;
        let keyAccepted = false;
        let advanceTime = false;

        const code = e.code;
        // console.log(e.code);

        const dx = code === "ArrowRight" ? 1 : (code === "ArrowLeft") ? -1 : 0;
        const dy = code === "ArrowDown" ? 1 : (code === "ArrowUp") ? -1 : 0;
        const xx = px + dx;
        const yy = py + dy;
        const moving = !(dx === 0 && dy === 0);
        const dirKeyPressed = moving || code === "Space";

        const creatureBlocking = !this.isCurrable(xx, yy);
        const spiritMode = this.player.currentbody === null;

        // Directional callbacks
        if (!keyAccepted && this.waitForDirCallback !== null && dirKeyPressed) {
            advanceTime = this.waitForDirCallback([dx, dy]);
            this.waitForDirCallback = null;
            keyAccepted = true;
        }

        // Item callbacks
        if (!keyAccepted && this.waitForItemCallback !== null) {
            const func = this.waitForItemCallback;
            this.waitForItemCallback = null;
            advanceTime = func(e.code);
            keyAccepted = true;
        }

        // Debugging keys
        if (e.code === "Home") {
            Game.debugMode = !Game.debugMode;
            if (Game.debugMode) {
                this.messagebuffer.add("Debug mode activated.");
            } else {
                this.messagebuffer.add("Debug mode deactivated.");
            }
        }
        if (Game.debugMode && e.code === "KeyP") {
            this.placePlayerAtFurniture("stairsup");
        }
        if (Game.debugMode && e.code === "KeyO") {
            this.placePlayerAtFurniture("stairsdown");
        }
        if (e.code === "KeyL") {
            this.currentLevel.nextLevel = undefined;
            this.currentLevel.prevLevel = undefined;
            const dump = { player: this.player, level: this.currentLevel };

            document.body.innerHTML = "";
            document.body.style.backgroundColor = "white";
            const textArea = document.createElement("p");
            textArea.innerHTML = "Dumping data...";
            document.body.appendChild(textArea);
            setTimeout(() => {
                textArea.innerHTML = JSON.stringify(dump);
            }, 100);
        }

        // 1-9 numbers - Use items
        if (!keyAccepted && this.player.currentbody !== null) {
            for (let index = 1; index < 10; index++) {
                if (e.code === "Digit" + index || e.code === "Numpad" + index) {
                    advanceTime = this.attemptToUseItem(this.player.currentbody, index - 1);
                    keyAccepted = true;
                }
            }
        }

        // H - toggle help
        if (!keyAccepted && e.code === "KeyH") {
            this.helpToggledOn = !this.helpToggledOn;
        }

        // A - activate
        if (!keyAccepted && e.code === "KeyA" && !spiritMode) {
            this.waitForDirCallback = this.activateTileCallback.bind(this);
            this.waitForMessage = ["Press a direction where to activate (space = current tile)"];
            keyAccepted = true;
        }
        if (!keyAccepted && e.code === "KeyA" && spiritMode) {
            this.messagebuffer.add("You can not activate objects as a spirit.");
        }

        // S - slide (push)
        if (!keyAccepted && e.code === "KeyS" && !spiritMode) {
            this.waitForDirCallback = this.pushObjectCallback.bind(this);
            this.waitForMessage = ["Press a direction where to push"];
            keyAccepted = true;
        }
        if (!keyAccepted && e.code === "KeyS" && spiritMode) {
            this.messagebuffer.add("You can not push up items as a spirit.");
        }

        // D - describe
        if (!keyAccepted && e.code === "KeyD") {
            this.waitForDirCallback = this.describeObjectCallback.bind(this);
            this.waitForMessage = ["Press a direction where to look"];
            keyAccepted = true;
        }

        // G - get item
        if (!keyAccepted && e.code === "KeyG" && !spiritMode) {
            const items = this.currentLevel.getItemsAt(this.player.x, this.player.y);
            if (items.length === 1) {
                this.pickupItem(items[0]);
            } else if (items.length > 0) {
                // Wait until player selects which item to pick up
                this.waitForMessage = ["Select which item to pick up"];
                let index = 0;
                for (const item of items) {
                    this.waitForMessage.push("  " + (index + 1) + ") " + item.dataRef.name);
                    index++;
                    if (index >= 10) {
                        break;
                    }
                }
                this.waitForItemCallback = (keyCode: string) => {
                    const pressedNumber = this.keyCodeToNumber(keyCode);
                    if (pressedNumber !== -1) {
                        this.pickupItem(items[pressedNumber - 1]);
                        return true;
                    }
                    return false;
                };
            } else {
                this.messagebuffer.add("Nothing to pick up here.");
            }
            keyAccepted = true;
        }
        if (e.code === "KeyG" && spiritMode) {
            this.messagebuffer.add("You can not pick up items as a spirit.");
        }

        // Z - use stairs
        if (!keyAccepted && e.code === "KeyZ") {
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
                const creatureName = cre.dataRef.name;

                if (chance < 1.0) {
                    const action = "You try to possess the " + creatureName +
                                   " (" + Math.floor(chance * 100) + "% chance)";
                    this.messagebuffer.add(action);
                }

                if (Game.showPossessTutorial || Game.debugMode || Math.random() < chance) {
                    this.messagebuffer.add(chance < 1.0
                        ? "You were more potent and overcame the feeble creature."
                        : "You return to the body of " + creatureName + ".");
                    this.player.currentbody = cre;
                    this.player.currentbody.willpower = 0;
                    this.player.currentstability = this.player.spiritstability;
                    this.player.x = xx;
                    this.player.y = yy;
                    Game.showPossessTutorial = false;
                } else {
                    const loseMsg = this.player.currentbody === null ? " You lose some of your stability." : "";
                    this.messagebuffer.add("The creature did not submit to you." + loseMsg);
                    if (this.player.currentbody === null) {
                        this.reduceStability(1.0, app);
                    }
                }
                advanceTime = true;
                keyAccepted = true;
            } else {

                if (this.player.currentbody === null) {
                    if (Game.debugMode || this.creatureCanMoveTo(1, xx, yy)) {
                        this.player.x = xx;
                        this.player.y = yy;
                        this.reduceStability(0.5, app);
                        advanceTime = true;
                        keyAccepted = true;
                    }
                } else {
                    if (e.shiftKey && this.creatureCanMoveTo(1, xx, yy)) {
                        // Unpossess
                        this.player.x = xx;
                        this.player.y = yy;
                        this.messagebuffer.add("You detach from the " + this.player.currentbody.dataRef.type + ".");
                        this.player.currentbody = null;
                        advanceTime = true;
                        keyAccepted = true;
                    } else if (this.creatureCanMoveTo(this.player.currentbody.dataRef.size, xx, yy)) {
                        // Control possessed body
                        const body = this.player.currentbody;
                        this.moveCreature(body, xx, yy);
                        this.player.x = body.x;
                        this.player.y = body.y;
                        this.currentLevel.cleanupDeadCreatures();
                        advanceTime = true;
                        keyAccepted = true;
                    } else {
                        if (this.currentLevel.getTile(xx, yy).maxsize > 0) {
                            this.messagebuffer.add("You are too big to move there.");
                        }
                    }
                }
                // Report itemb
                if (moving) {
                    this.reportItemsAt(this.player.x, this.player.y);
                }

                // Autocollect orb
                for (const item of this.currentLevel.getItemsAt(this.player.x, this.player.y)) {
                    if (item.dataRef.type === "orb") {
                        this.messagebuffer.add(
                            "You touch the orb. Press number keys 1, 2 or 3 to select which upgrade you want.");
                        this.collectOrb();
                        keyAccepted = true;
                    }
                }
            }
        }

        // Check descriptions
        for (const desc of this.currentLevel.descriptions) {
            if (desc.isInside(this.player.x, this.player.y) && !desc.isRead) {
                desc.isRead = true;
                this.messagebuffer.add(desc.text, Color.lightblue);
            }
        }

        // Check victory
        if (this.winReason !== null) {
            if (!(this.winReason in this.data.wintexts)) {
                this.winReason = "other";
            }
            const texts = this.data.wintext.slice();
            texts.push("");
            for (const line of this.data.wintexts[this.winReason]) {
                texts.push(line);
            }
            const gameover = new GameOver(this.renderer.renderer, "", texts);
            app.setWindow(gameover);
        }

        if (keyAccepted) {
            const speed = this.player.currentbody === null ? 3 : this.player.currentbody.dataRef.speed;
            this.updateLoop(advanceTime ? speed : 0);
        }
    }

    public handleClick(app: App, mouseEvent: IMouseEvent): void {
        if (this.currentLevel === null) {
            return;
        }

        // Describe furniture
        const mouseX = mouseEvent.tx - this.mapOffsetTargetX;
        const mouseY = mouseEvent.ty - this.mapOffsetTargetY;
        this.describePosition(mouseX, mouseY);
    }

    private pickupItem(item: Item): void {
        if (this.player.currentbody.pickup(item.dataRef.type)) {
            this.messagebuffer.add("You pick up the " + item.dataRef.name + ".");
            this.currentLevel.removeItem(item);
        } else {
            this.messagebuffer.add(
                "You do not have enough inventory slots to pick up the " + item.dataRef.name + ".");
        }
    }

    private keyCodeToNumber(keyCode: string): number {
        for (let index = 1; index <= 9; index++) {
            if (keyCode === "Digit" + index || keyCode === "Numpad" + index) {
                return index;
            }
        }
        return -1;
    }

    private describePosition(x: number, y: number): void {
        if (this.currentLevel.isInLevelBounds(x, y)) {
            const tileState = this.currentLevel.getTileState(x, y);
            if (tileState.state === TileVisibility.Remembered) {
                for (const fur of this.currentLevel.getFurnituresAt(x, y)) {
                    this.messagebuffer.add(fur.dataRef.description);
                }
                for (const item of this.currentLevel.getItemsAt(x, y)) {
                    this.messagebuffer.add(item.dataRef.description);
                }
                const cre = this.currentLevel.getCreatureAt(x, y);
                if (cre !== null) {
                    this.messagebuffer.add(cre.dataRef.description);
                }
            }
        }
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

    private useItemCallback(keyCode: string): boolean {
        const itemType = this.player.currentbody.inventory[this.itemSlotToBeUsed].item;
        const item = this.data.getByType(this.data.items, itemType);

        const playerBody = this.player.currentbody;

        // Use item
        if (keyCode === "KeyQ") {
            if (item.category === "key") {
                this.messagebuffer.add("You use keys automatically by activating doors.");
                return false;
            } else if (item.category === "potion") {
                playerBody.inventory[this.itemSlotToBeUsed].item = "";
                playerBody.currenthp = playerBody.dataRef.maxhp;
                this.messagebuffer.add("You drink the potion. Your wounds heal instantly.");
                return true;
            } else {
                this.messagebuffer.add("You can not use that.");
                return false;
            }
        }

        // Drop item
        if (keyCode === "KeyD") {
            playerBody.inventory[this.itemSlotToBeUsed].item = "";
            const newItem = new Item();
            newItem.dataRef = item;
            this.currentLevel.addItemAt(newItem, playerBody.x, playerBody.y);
            return true;
        }

        // Swap item slots
        if (keyCode === "KeyE") {
            this.waitForMessage = ["Press a slot number where to move the " + item.name + "."];
            this.waitForItemCallback = (otherKeyCode: string) => {
                for (let index = 1; index < 10; index++) {
                    if (otherKeyCode === "Digit" + index || otherKeyCode === "Numpad" + index) {
                        if (index <= playerBody.inventory.length) {
                            const sourceSlot = this.itemSlotToBeUsed;
                            const targetSlot = index - 1;
                            const temp = playerBody.inventory[targetSlot].item;
                            playerBody.inventory[targetSlot].item = playerBody.inventory[sourceSlot].item;
                            playerBody.inventory[sourceSlot].item = temp;
                        } else {
                            this.messagebuffer.add("Invalid item slot.");
                        }
                    }
                }
                return false;
            };
        }

        return false;
    }

    private attemptToUseItem(cre: Creature, slotNumber: number): boolean {
        if (slotNumber < cre.inventory.length) {
            if (cre.inventory[slotNumber].item !== "") {
                const item = this.data.getByType(this.data.items, cre.inventory[slotNumber].item);
                this.itemSlotToBeUsed = slotNumber;
                this.waitForMessage = ["Q - Use item", "D - Drop item", "E - Move item to another slot"];
                this.waitForItemCallback = this.useItemCallback.bind(this);
            } else {
                this.messagebuffer.add("You do not have an item on that slot.");
            }
        }
        return false;
    }

    private collectOrb(): void {
        this.waitForMessage = [
            "The orb gives you power and you can increase one of your stats:",
            "  1 - Increase spirit stability",
            "  2 - Increase spirit power",
            "  3 - Increase willpower",
        ];
        this.waitForItemCallback = this.useOrb.bind(this);
    }

    private useOrb(keyCode: string): boolean {
        const destroyOrb = () => {
            for (const item of this.currentLevel.getItemsAt(this.player.x, this.player.y)) {
                if (item.dataRef.type === "orb") {
                    this.currentLevel.removeItem(item);
                    break;
                }
            }
        };

        if (keyCode === "Digit1" || keyCode === "Numpad1") {
            this.player.spiritstability += 2;
            this.player.currentstability = this.player.spiritstability;
            this.messagebuffer.add("Your stability increases and can remain out of body longer. The orb vanishes.");
            destroyOrb();
            return true;
        }
        if (keyCode === "Digit2" || keyCode === "Numpad2") {
            this.player.spiritpower += 1;
            this.messagebuffer.add("You can now transfer more power to possessed creatures. The orb vanishes.");
            destroyOrb();
            return true;
        }
        if (keyCode === "Digit3" || keyCode === "Numpad3") {
            this.player.willpower += 1;
            this.messagebuffer.add("Your willpower increases and possession is easier. The orb vanishes.");
            destroyOrb();
            return true;
        }

        this.collectOrb();
        return false;
    }

    private activateTileCallback(delta: [number, number]): boolean {
        const dx = delta[0];
        const dy = delta[1];
        const msg = this.currentLevel.activate(
            this.player.currentbody.x + dx,
            this.player.currentbody.y + dy, true, this.player.currentbody);

        if (msg) {
            this.messagebuffer.add(msg);
        }
        return true;
    }

    private describeObjectCallback(delta: [number, number]): boolean {
        const dx = delta[0];
        const dy = delta[1];
        this.describePosition(this.player.x + dx, this.player.y + dy);
        return false;
    }

    private pushObjectCallback(delta: [number, number]): boolean {
        const dx = delta[0];
        const dy = delta[1];
        const xx = this.player.currentbody.x + dx;
        const yy = this.player.currentbody.y + dy;
        let advanceTime = false;

        // Push furniture
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
                    this.messagebuffer.add("You push the " + fur.dataRef.name + ".");
                    this.checkPressureDeactivation(oldX, oldY);
                    this.checkPressureActivation(fur.x, fur.y);
                    advanceTime = true;
                    break;
                } else {
                    this.messagebuffer.add("Not enough space to push the " + fur.dataRef.name + " there.");
                }
            } else {
                this.messagebuffer.add("The " + fur.dataRef.name + " is too heavy for you to push.");
            }
        }

        // Push creatures
        const cre = this.currentLevel.getCreatureAt(xx, yy);
        if (cre !== null) {
            if (this.player.currentbody.dataRef.size >= cre.dataRef.size) {
                const targetX = cre.x + dx;
                const targetY = cre.y + dy;
                if (this.isCurrable(targetX, targetY) &&
                        this.creatureCanMoveTo(cre.dataRef.size, targetX, targetY)) {
                    this.messagebuffer.add("You push the " + cre.dataRef.name + ".");
                    this.moveCreature(cre, targetX, targetY);
                    cre.time = -cre.dataRef.speed;
                    advanceTime = true;
                } else {
                    this.messagebuffer.add("Not enough space to push the " + cre.dataRef.name + " there.");
                }
            } else {
                this.messagebuffer.add("You are too weak to push the " + cre.dataRef.name + ".");
            }
        }

        return advanceTime;
    }

    private checkDeath(cre: Creature, reason: string = "other"): void {
        if (cre.currenthp <= 0 && !cre.dead) {
            cre.dead = true;

            // Prevent death in debug mode
            if (Game.debugMode && cre === this.player.currentbody) {
                cre.dead = false;
                cre.currenthp = 1;
                return;
            }

            const your = cre === this.player.currentbody ? "your " : "";
            if (this.currentLevel.lineOfSight(this.player.x, this.player.y, cre.x, cre.y)) {
                this.messagebuffer.add(your + cre.dataRef.type + " died.");
            }

            if (this.player.currentbody === cre) {
                this.player.currentbody = null;
                this.messagebuffer.add("You detach from the corpse.", Color.red);
            }

            // Drop inventory items
            for (const slot of cre.inventory) {
                if (slot.item !== "") {
                    const item = this.data.getByType(this.data.items, slot.item);
                    const newItem = new Item();
                    newItem.dataRef = item;
                    this.currentLevel.addItemAt(newItem, cre.x, cre.y);
                }
            }

            // Check victory condition
            if (cre.dataRef.type === "vitalius") {
                this.winReason = reason;
            }
        }
    }

    private creatureFight(attacker: Creature, defender: Creature): void {
        const getItemDefence = (cre: Creature) => {
            const itemType = cre.getFirstItemOfSlot(SlotType.Defensive);
            if (itemType !== "") {
                const item = this.data.getByType(this.data.items, itemType);
                return item.defence;
            }
            return 0;
        };
        const getItemAttack = (cre: Creature) => {
            const itemType = cre.getFirstItemOfSlot(SlotType.Defensive);
            if (itemType !== "") {
                const item = this.data.getByType(this.data.items, itemType);
                return item.defence;
            }
            return 0;
        };
        // console.log("Fight " + attacker.dataRef.type + " vs. " + defender.dataRef.type);
        const spiritPower = this.player.currentbody === attacker ? this.player.spiritpower : 0;
        const maxDamage = getItemAttack(attacker) + attacker.dataRef.strength + spiritPower;
        const minDamage = Math.ceil(maxDamage / 2);
        let damage = minDamage + Math.ceil(Math.random() * (maxDamage - minDamage));
        damage -= getItemDefence(defender) + defender.dataRef.defence;
        damage = Math.max(0, damage);
        defender.currenthp -= damage;
        const attackerName = attacker === this.player.currentbody ? "you" : attacker.dataRef.name;
        const defenderName = defender === this.player.currentbody ? "you" : "the " + defender.dataRef.name;
        const color = defender === this.player.currentbody ? Color.red : Color.skin;

        const extraS = attacker === this.player.currentbody ? "" : "s";

        if (this.currentLevel.lineOfSight(this.player.x, this.player.y, attacker.x, attacker.y)) {
            this.messagebuffer.add(attackerName + " hit" + extraS + " " + defenderName +
                " and deal" + extraS + " " + damage + " damage.", color);
        }

        this.checkDeath(defender, attacker.dataRef.category);
    }

    private moveCreature(cre: Creature, targetX: number, targetY: number): void {
        if (!this.isCurrable(targetX, targetY) && !(targetX === cre.x && targetY === cre.y)) {
            // Prevent creatures of same category fighting each other
            const defender = this.currentLevel.getCreatureAt(targetX, targetY);
            const playerControlled = cre === this.player.currentbody || defender === this.player.currentbody;
            const noWillpower = defender.willpower === 0;
            if (noWillpower || playerControlled || cre.dataRef.category !== defender.dataRef.category) {
                this.creatureFight(cre, defender);
            }
        } else if (this.isCurrable(targetX, targetY) && this.creatureCanMoveTo(cre.dataRef.size, targetX, targetY)) {
            if (targetX === this.player.x && targetY === this.player.y && this.player.currentbody !== null) {
                console.error("ERROR");
            }
            const oldX = cre.x;
            const oldY = cre.y;
            cre.x = targetX;
            cre.y = targetY;
            this.checkPressureDeactivation(oldX, oldY);
            this.checkPressureActivation(targetX, targetY);

            const damage = this.currentLevel.getTileDamage(targetX, targetY);
            if (damage > 0 && !cre.dataRef.flying) {
                cre.currenthp -= damage;
                const tileType = this.currentLevel.getTile(targetX, targetY).type;

                if (cre === this.player.currentbody) {
                    this.messagebuffer.add("You take " + damage + " from the " + tileType + "!", Color.red);
                }

                const reason = tileType;
                this.checkDeath(cre, reason);
            }
        }
    }

    private reportItemsAt(x: number, y: number): void {
        const furs = this.currentLevel.getFurnituresAt(x, y);
        if (furs.length > 0)  {
            const addedA = furs.length === 1 ? "a " : "";
            let msg = "Here is " + addedA;
            for (let index = 0; index < furs.length; index++) {
                const fur = furs[index];
                const comma = index === furs.length - 1 ? "" : ", ";
                msg += fur.dataRef.name + comma;
            }
            msg += ".";
            this.messagebuffer.add(msg);
        }

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
    }

    private checkPressureActivation(x: number, y: number): void {
        this.currentLevel.checkPressureActivation(x, y, "pressureplate", "pressureplatedown", (size) => size >= 8);
    }

    private checkPressureDeactivation(x: number, y: number): void {
        this.currentLevel.checkPressureActivation(x, y, "pressureplatedown", "pressureplate", (size) => size < 8);
    }

    private updateLoop(deltaTime: number): void {
        // console.log("deltaTime: " + deltaTime);
        if (deltaTime > 0) {
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
            this.currentLevel.cleanupDeadCreatures();
        }
        this.renderer.renderGame();
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

        // Follow the player if the creature can see it
        // TODO: move to last seen position
        const canSeePlayer =
            this.player.currentbody !== null && this.currentLevel.lineOfSight(
                this.player.currentbody.x, this.player.currentbody.y, cre.x, cre.y);

        if (canSeePlayer && this.player.currentbody !== null) { // TODO: REMOVE true
            const dijkstra = new ROT.Path.Dijkstra(
                this.player.currentbody.x, this.player.currentbody.y, passable, { topology: 4 });
            dijkstra.compute(cre.x, cre.y, (x: number, y: number) => {
                path.push([x, y]);
            });
        }

        let dx = 0;
        let dy = 0;
        if (path.length > 1) {
            dx = path[1][0] - cre.x;
            dy = path[1][1] - cre.y;
        } else {
            dx = Math.floor(Math.random() * 3) - 1;
            dy = Math.floor(Math.random() * 3) - 1;
        }

        // Fix long enemy queues
        if (path.length > 2 && canSeePlayer && !this.isCurrable(cre.x + dx, cre.y + dy)) {
            dx = Math.floor(Math.random() * 3) - 1;
            dy = Math.floor(Math.random() * 3) - 1;
        }

        const targetX = Math.floor(cre.x + dx);
        const targetY = Math.floor(cre.y + dy);

        if (this.creatureCanMoveTo(cre.dataRef.size, targetX, targetY)) {
            // Move freely to target position unless it causes damage
            const movingToPlayer =
                this.player.currentbody !== null && targetX === this.player.x && targetY === this.player.y;

            if (this.currentLevel.getTileDamage(targetX, targetY) === 0 || cre.dataRef.flying || movingToPlayer) {
                this.moveCreature(cre, targetX, targetY);
            }
        } else {
            // Attempt to activate tile if movement failed
            if (cre.dataRef.size >= 5) {
                this.currentLevel.activate(targetX, targetY, true);
            }
        }
    }
}
