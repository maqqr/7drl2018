import { Renderer } from "./renderer";

export class Game {
    public static readonly WIDTH: number = 600;
    public static readonly HEIGHT: number = 400;

    private renderer: Renderer;

    public start(): void {
        this.renderer = new Renderer(this);
        this.renderer.loadGraphics().then(this.assetsLoaded.bind(this));
    }

    public assetsLoaded(): void {
        console.log("loaded");
        this.refreshDisplay();
    }

    public refreshDisplay() {
        this.renderer.renderGame();
    }
}

// TODO: start after DOM has been loaded
const game = new Game();
game.start();
