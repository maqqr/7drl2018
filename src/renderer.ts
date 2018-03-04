import { Game } from "./index";
import { Level } from "./level";
import { PixiRenderer } from "./pixirenderer";

export class Renderer {
    private game: Game;
    private renderer: PixiRenderer;

    constructor(game: Game) {
        this.game = game;
        this.renderer = new PixiRenderer(Game.WIDTH, Game.HEIGHT);
        this.renderer.initialize();

        window.addEventListener("resize", this.renderer.resize.bind(this.renderer));
        this.renderer.resize();
    }

    public async loadGraphics() {
        return new Promise((resolve, reject) => {
            this.renderer.loadAssets(["font.png", "tileset.png"], resolve);
        });
    }

    public renderGame() {
        const level = this.game.getCurrentLevel();

        this.renderer.clear();
        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {
                const tile = level.get(x, y);
                this.renderer.drawTexture(x * 16, y * 16, tile);
            }
        }

        const furnitures = this.game.getCurrentLevel().furnitures;
        for (const furniture of furnitures) {
            this.renderer.drawTexture(furniture.x * 16, furniture.y * 16, 53);
        }

        // this.renderer.drawRect(0, 0, 64, 64, true);
        this.renderer.render();
    }
}
