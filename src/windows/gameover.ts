import { App } from "..";
import { Color } from "../color";
import { PixiRenderer } from "../pixirenderer";
import { IMouseEvent } from "../renderer";
import { ICharCreation } from "./charcreation";
import { IGameWindow } from "./window";

export class GameOver implements IGameWindow {
    private renderer: PixiRenderer;

    constructor(renderer: PixiRenderer) {
        this.renderer = renderer;
    }

    public startWindow(): void {
        this.draw();
    }

    public stopWindow(): void {
        //
    }

    public handleKeyPress(app: App, e: KeyboardEvent): void {
        // throw new Error("Method not implemented.");
        app.goToMainMenu();
    }

    public handleClick(app: App, mouseEvent: IMouseEvent): void {
        // throw new Error("Method not implemented.");
    }

    public draw(): void {
        this.renderer.clear();
        this.renderer.drawString(280, 200, "YOU DIED", Color.white);
        this.renderer.render();
    }
}
