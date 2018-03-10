import * as $ from "jquery";
import { Color } from "./color";
import { GameData } from "./data";
import { DungeonGenerator } from "./dungeongen";
import { Creature, Furniture, Item, Player, PuzzleRoom, SlotType } from "./entity";
import { ITile } from "./interface/entity-schema";
import { IPuzzleList, IPuzzleRoom } from "./interface/puzzle-schema";
import { ICreatureset, IFurnitureset, IItemset, ITileset } from "./interface/set-schema";
import { Level, TileVisibility } from "./level";
import { MessageBuffer } from "./messagebuffer";
import { PixiRenderer } from "./pixirenderer";
import { IMouseEvent, Renderer } from "./renderer";
import { CharCreation, ICharCreation } from "./windows/charcreation";
import { Game } from "./windows/game";
import { LoadingWindow } from "./windows/loading";
import { MainMenu } from "./windows/mainmenu";
import { IGameWindow } from "./windows/window";


export class App {
    public data: GameData;
    public renderer: Renderer;

    private window: IGameWindow = null;
    private keyDownCallBack: any;

    public start(): void {
        this.keyDownCallBack = this.handleKeyPress.bind(this);
        window.addEventListener("keydown", this.keyDownCallBack);

        this.data = new GameData();
        this.renderer = new Renderer();
        this.renderer.addClickListener(this.handleClick.bind(this));

        this.window = new LoadingWindow(this.renderer.renderer);
        this.renderer.loadGraphics().then(this.graphicsLoaded.bind(this));
    }

    public setWindow(window: IGameWindow): void {
        this.window.stopWindow();
        this.window = window;
        this.window.startWindow();
        this.window.draw();
    }

    public goToMainMenu(): void {
        const mainmenu = new MainMenu(this.renderer.renderer);
        this.setWindow(mainmenu);
    }

    public goToCharCreation(): void {
        const player = new Player();
        player.dataRef  = this.data.player;
        const charcreation = new CharCreation(this.renderer.renderer, this.data, player);
        this.setWindow(charcreation);
    }

    private graphicsLoaded(): void {
        this.window.startWindow();
        this.loadData().then(this.dataLoaded.bind(this));
    }

    private dataLoaded(): void {
        console.log("Game data loaded.");
        this.goToMainMenu();
    }

    private handleKeyPress(e: KeyboardEvent): void {
        this.window.handleKeyPress(this, e);
    }

    private handleClick(mouseEvent: IMouseEvent): void {
        this.window.handleClick(this, mouseEvent);
    }

    private async loadData(): Promise<void> {
        const tileset = await this.loadJSON<ITileset>("data/tileset.json");
        const creatureset = await this.loadJSON<ICreatureset>("data/creatureset.json");
        const itemset = await this.loadJSON<IItemset>("data/itemset.json");
        const furnitureset = await this.loadJSON<IFurnitureset>("data/furnitureset.json");
        const puzzleList = await this.loadJSON<IPuzzleList>("data/puzzlelist.json");

        const questions = await this.loadJSON<ICharCreation>("data/charcreation.json");
        this.data.charcreation = questions;

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

        // console.log(this.data);

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
            cre.defence = getProp(cre, "defence", 0, convertInt);
            cre.flying = getProp(cre, "flying", false, convertBool);
            cre.offensiveslot = getProp(cre, "offensiveslot", false, convertBool);
            cre.defenciveslot = getProp(cre, "defenciveslot", false, convertBool);
            if (!("name" in cre)) { this.data.creatures[cre.id].category = "nameless creature"; }
            if (!("category" in cre)) { this.data.creatures[cre.id].category = "default"; }
            if (!("inventoryslots" in cre)) { this.data.creatures[cre.id].inventoryslots = null; }
            if (!("inventory" in cre)) { this.data.creatures[cre.id].inventory = null; }
            // console.log(cre);
        }

        // Load item data
        for (const item of itemset.items) {
            this.data.items[item.id] = item;
            item.attack = getProp(item, "attack", 0, convertInt);
            item.defence = getProp(item, "defence", 0, convertInt);
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
            if (!("lootlist" in furry)) { this.data.furnitures[furry.icon].lootlist = []; }
            if (!("activation" in furry)) { this.data.furnitures[furry.icon].activation = null; }
            if (!("useractivation" in furry)) { this.data.furnitures[furry.icon].useractivation = null; }
            if (!("useractivationtext" in furry)) { this.data.furnitures[furry.icon].useractivationtext = null; }
            if (!("requireitem" in furry)) { this.data.furnitures[furry.icon].requireitem = null; }
            if (!("activationtarget" in furry)) { this.data.furnitures[furry.icon].activationtarget = null; }
            // console.log(furry);
        }
    }

    private loadJSON<T>(path: string): Promise<T> {
        return new Promise((resolve, reject) => {
            $.getJSON(path, (data: any, textStatus: string, jqXHR: JQueryXHR) => {
                resolve(data);
            }).fail((jqXHR: JQueryXHR, textStatus, errorThrown) => {
                console.error("loadJSON(" + path + ") failed: " + JSON.stringify(textStatus));
            });
        });
    }
}

$(document).ready(() => {
    const app = new App();
    app.start();
});
