import * as $ from "jquery";
import { GameData } from "./data";
import { ICreatureset } from "./interface/creatureset-schema";
import { IPuzzleRoom, ITileLayer } from "./interface/puzzle-schema";
import { ITileset } from "./interface/tileset-schema";
import { Level } from "./level";
import { Renderer } from "./renderer";

export class Game {
    public static readonly WIDTH: number = 600;
    public static readonly HEIGHT: number = 400;

    private renderer: Renderer;
    private currentLevel: Level;
    private data: GameData;

    public start(): void {
        this.data = new GameData();
        this.renderer = new Renderer(this);
        this.currentLevel = new Level(12, 12);
        Promise.all([this.loadData(), this.renderer.loadGraphics()])
          .then(this.assetsLoaded.bind(this));
    }

    public async loadData(): Promise<void> {
        const tileset = await this.loadJSON<ITileset>("data/tileset.json");
        const tilesetSchema = await this.loadJSON<ITileset>("data/tileset-schema.json");
        const creatureset = await this.loadJSON<ICreatureset>("data/creatureset.json");
        const creaturesetSchema = await this.loadJSON<ICreatureset>("data/creatureset-schema.json");

        const testmap = await this.loadJSON<IPuzzleRoom>("data/testmap.json");

        // TODO: move this code somewhere else

        // Load the creatures to data
        for (const ent of creatureset.creatures) {
            this.data.creatures[ent.id] = ent;
        }

        for (const layer of testmap.layers) {
            if (layer.type === "tilelayer") {
                const tilelayer = layer as ITileLayer;
                for (let y = 0; y < testmap.height; y++) {
                    for (let x = 0; x < testmap.width; x++) {
                        const tile = tilelayer.data[x + y * testmap.width];
                        this.currentLevel.set(x, y, tile - 1);
                    }
                }
                return;
            }
        }
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
