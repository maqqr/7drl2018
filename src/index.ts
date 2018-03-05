import * as $ from "jquery";
import { GameData } from "./data";
import { Furniture, Player } from "./entity";
import { IPuzzleRoom } from "./interface/puzzle-schema";
import { ICreatureset, IFurnitureset, IItemset, ITileset } from "./interface/set-schema";
import { Level } from "./level";
import { IMouseEvent, Renderer } from "./renderer";






export class Game {
    public static readonly WIDTH: number = 600;
    public static readonly HEIGHT: number = 400;

    public data: GameData;
    public player: Player;

    private renderer: Renderer;
    private currentLevel: Level;

    private handlers: { [id: number]: (e: KeyboardEvent) => void } = {};


    private keyDownCallBack;


    public start(): void {

        this.keyDownCallBack = this.handleKeyPress.bind(this);
        this.data = new GameData();
        this.renderer = new Renderer(this);
        this.renderer.addClickListener(this.handleClick.bind(this));
        this.currentLevel = new Level(28, 28, this.data);
        Promise.all([this.loadData(), this.renderer.loadGraphics()])
          .then(this.assetsLoaded.bind(this));
        this.player = new Player();
        this.player.dataRef  = this.data.player;
        this.player.x = 10;
        this.player.y = 10;
        this.player.currentbody = null;
        this.player.currenthp = this.player.dataRef.maxhp;
        this.player.currentstability = this.player.dataRef.spiritstability;
    }

    public async loadData(): Promise<void> {
        const tileset = await this.loadJSON<ITileset>("data/tileset.json");
        // const tilesetSchema = await this.loadJSON<ITileset>("data/creatureset-schema.json");
        const creatureset = await this.loadJSON<ICreatureset>("data/creatureset.json");
        // const creaturesetSchema = await this.loadJSON<ICreatureset>("data/itemset-schema.json");
        const itemset = await this.loadJSON<IItemset>("data/itemset.json");
        // const itemsetSchema = await this.loadJSON<IItemset>("data/tileset-schema.json");
        const furnitureset = await this.loadJSON<IFurnitureset>("data/furnitureset.json");


        const testmap = await this.loadJSON<IPuzzleRoom>("data/testmap.json");

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
            this.data.tiles[tile.id] = tile;
            if (!("damage" in tile)) { this.data.tiles[tile.id].damage = 0; }
            if (!("maxsize" in tile)) { this.data.tiles[tile.id].maxsize = 0; }
            if (!("transparent" in tile)) { this.data.tiles[tile.id].transparent = false; }
            if (!("activation" in tile)) { this.data.tiles[tile.id].activation = null; }
            if (!("requireitem" in tile)) { this.data.tiles[tile.id].requireitem = null; }
            if (!("useractivation" in tile)) { this.data.tiles[tile.id].useractivation = null; }
            if (!("useractivationtext" in tile)) { this.data.tiles[tile.id].useractivationtext = null; }
        }

        for (const furry of furnitureset.furnitures) {
            this.data.furnitures[furry.icon] = furry;
            if (!("movable" in furry)) { this.data.furnitures[furry.icon].movable = 21; }
            if (!("maxsize" in furry)) { this.data.furnitures[furry.icon].maxsize = 0; }
            if (!("size" in furry)) { this.data.furnitures[furry.icon].size = 21; }
            if (!("damage" in furry)) { this.data.furnitures[furry.icon].damage = 0; }
            if (!("activation" in furry)) { this.data.furnitures[furry.icon].activation = null; }
            if (!("useractivation" in furry)) { this.data.furnitures[furry.icon].useractivation = null; }
            if (!("useractivationtext" in furry)) { this.data.furnitures[furry.icon].useractivationtext = null; }
            if (!("requireitem" in furry)) { this.data.furnitures[furry.icon].requireitem = null; }
            if (!("activationtarget" in furry)) { this.data.furnitures[furry.icon].activationtarget = null; }
        }

        // Place test puzzle map into current level
        this.currentLevel.placePuzzleAt(2, 2, testmap);
    }

    public assetsLoaded(): void {
        console.log("loaded");
        console.log(this.data.creatures);
        console.log(this.data.player);
        console.log(this.data.creatures[253]);
        this.currentLevel.addCreatureAt(this.data.creatures[253], 9, 9);
        this.updateLoop();

    }

    public getCurrentLevel(): Level {
        return this.currentLevel;
    }

    private isPassable(x: number, y: number): boolean {
        const plSize = this.player.currentbody === null ? 10 : this.player.currentbody.dataRef.size;
        return plSize <= this.data.tiles[this.currentLevel.get(x, y)].maxsize;
    }
    private isCurrable(x: number, y: number): boolean {
        return this.currentLevel.getCreatureAt(x, y) === null;
    }
    private isFurrable(furs: Furniture[], x: number, y: number): boolean {
        let val = true;
        let pile = 0;
        const plSize = this.player.currentbody === null ? 10 : this.player.currentbody.dataRef.size;
        for (const fur of furs) {
            // if (fur === null) { continue; }
            val = fur.dataRef.maxsize >= plSize ? true : false;
            pile += fur.dataRef.size;
        }
        console.log(pile + plSize);
        console.log(this.data.tiles[this.currentLevel.get(x, y)].maxsize);
        return val && ((pile + plSize) <= this.data.tiles[this.currentLevel.get(x, y)].maxsize);
    }

    private loadJSON<T>(path: string): Promise<T> {
        return new Promise((resolve, reject) => {
            $.getJSON(path, (data: any, textStatus: string, jqXHR: JQueryXHR) => {
                resolve(data);
            });
        });
    }

    private playerTurn() {
        window.addEventListener("keydown", this.keyDownCallBack);
    }
    private handleKeyPress(e: KeyboardEvent): void {
        const xx = this.player.x;
        const yy = this.player.y;
        const code = e.keyCode;
        console.log(code);
        if (code === 87 && this.isPassable(xx, yy - 1) && this.isCurrable(xx, yy - 1)
                && (this.isFurrable(this.currentLevel.getFurnituresAt(xx, yy - 1), xx, yy - 1))) {
            this.player.y -= 1;
        }
        if (code === 68 && this.isPassable(xx + 1, yy) && this.isCurrable(xx + 1, yy)
            && (this.isFurrable(this.currentLevel.getFurnituresAt(xx + 1, yy), xx + 1, yy))) {
            this.player.x += 1;
        }
        if (code === 83 && this.isPassable(xx, yy + 1) && this.isCurrable(xx, yy + 1)
            && (this.isFurrable(this.currentLevel.getFurnituresAt(xx, yy + 1), xx, yy + 1))) {
            this.player.y += 1;
        }
        if (code === 65 && this.isPassable(xx - 1, yy) && this.isCurrable(xx - 1, yy)
            && (this.isFurrable(this.currentLevel.getFurnituresAt(xx - 1, yy), xx - 1, yy))) {
            this.player.x -= 1;
        }
        window.removeEventListener("keydown", this.keyDownCallBack);
        this.updateLoop();
    }
    private handleClick(mouseEvent: IMouseEvent) {
        console.log(mouseEvent);
        this.currentLevel.activate(mouseEvent.tx, mouseEvent.ty, true);
        this.renderer.renderGame();
    }
    private updateLoop() {
        // for (const char of this.currentLevel.characters) {
            // this.updateAI(char)
        // }
        this.renderer.renderGame();
        this.playerTurn();
    }
}

// TODO: start after DOM has been loaded
const game = new Game();
game.start();
