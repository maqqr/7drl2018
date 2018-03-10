import { App } from "..";
import { PixiRenderer } from "../pixirenderer";
import { IMouseEvent } from "../renderer";
import { Game } from "./game";
import { IGameWindow } from "./window";

export class LoadingWindow implements IGameWindow {
    public itemsLoaded: number = 0;
    public itemsToLoad: number = 1;

    private renderer: PixiRenderer;

    constructor(renderer: PixiRenderer) {
        this.renderer = renderer;
    }

    public handleKeyPress(app: App, e: KeyboardEvent): void {
        // console.log(e);
    }

    public handleClick(app: App, mouseEvent: IMouseEvent): void {
        // console.log(mouseEvent);
    }

    public startWindow(): void {
        this.draw();
    }

    public stopWindow(): void {
        //
    }

    public draw(): void {
        this.renderer.clear();
        const progress = Math.floor(100 * (this.itemsLoaded / this.itemsToLoad));
        this.renderer.drawString(Game.WIDTH / 2 - 60, Game.HEIGHT / 2, "Loading game data... (" + progress + "%)");
        this.renderer.render();
    }

    public itemLoaded(): void {
        this.itemsLoaded++;
        this.draw();
    }
}
