import * as $ from "jquery";
import { ITileset } from "./interface/tileset-schema";
import { Level } from "./level";
import { Renderer } from "./renderer";

export class Game {
    public static readonly WIDTH: number = 600;
    public static readonly HEIGHT: number = 400;

    private renderer: Renderer;
    private currentLevel: Level;

    public start(): void {
        this.renderer = new Renderer(this);
        this.currentLevel = new Level(12, 12);
        Promise.all([this.loadData(), this.renderer.loadGraphics()])
          .then(this.assetsLoaded.bind(this));
    }

    public async loadData(): Promise<void> {
        const tileset = await this.loadJSON<ITileset>("data/tileset.json");
        const tilesetSchema = await this.loadJSON<ITileset>("data/tileset-schema.json");
        const creatureSchema = await this.loadJSON<ITileset>("data/creature-schema.json");
    }

    public assetsLoaded(): void {
        console.log("loaded");
        this.refreshDisplay();
    }

    public refreshDisplay() {
        this.renderer.renderGame();
    }

    public getCurrentLevel(): Level {
        return this.currentLevel;
    }

    private loadJSON<T>(path: string): Promise<T> {
        return new Promise((resolve, reject) => {
            $.getJSON(path, (data: any, textStatus: string, jqXHR: JQueryXHR) => {
                resolve(data);
            });
        });
    }
}

// TODO: start after DOM has been loaded
const game = new Game();
game.start();
