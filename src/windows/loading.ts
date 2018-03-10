import { App } from "..";
import { PixiRenderer } from "../pixirenderer";
import { IMouseEvent } from "../renderer";
import { Game } from "./game";
import { IGameWindow } from "./window";

export class LoadingWindow implements IGameWindow {
    private renderer: PixiRenderer;
    private progress: number = 0;

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
        this.renderer.drawString(Game.WIDTH / 2 - 60, Game.HEIGHT / 2, "Loading game data... (" + this.progress + "%)");
        this.renderer.render();
    }

    public setProgress(progress: number): void {
        this.progress = progress;
        this.draw();
    }
}
