import { Game } from "./index";
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
            this.renderer.loadAssets(["font.png"], resolve);
        });
    }

    public renderGame() {
        this.renderer.clear();
        this.renderer.drawTexture(30, 30);
        this.renderer.drawTexture(60, 60);
        this.renderer.drawTexture(90, 90);
        this.renderer.render();

        this.renderer.clear();
        this.renderer.drawTexture(250, 30);
        this.renderer.drawRect(0, 0, 64, 64, true);
        this.renderer.render();
    }
}
