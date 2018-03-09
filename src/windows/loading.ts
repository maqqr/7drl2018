import { App } from "..";
import { PixiRenderer } from "../pixirenderer";
import { IMouseEvent } from "../renderer";
import { Game } from "./game";
import { IGameWindow } from "./window";

export class LoadingWindow implements IGameWindow {
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
        this.renderer.clear();
        this.renderer.drawString(Game.WIDTH / 2 - 40, Game.HEIGHT / 2,
            "Loading game data...");
        this.renderer.render();
    }

    public stopWindow(): void {
        //
    }
}
