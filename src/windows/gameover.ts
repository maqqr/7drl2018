import { App } from "..";
import { Color } from "../color";
import { PixiRenderer } from "../pixirenderer";
import { IMouseEvent } from "../renderer";
import { ICharCreation } from "./charcreation";
import { IGameWindow } from "./window";

export class GameOver implements IGameWindow {
    private renderer: PixiRenderer;

    private canContinue: boolean;
    private canContinueTime: number = 2000;

    private texts: string[] = [
        "You failed to get your revenge. Your spirit couldn't keep maintaining its form in the world of the",
        "living and because of your curse and all the lingering hatred in your soul, your spirit couldn't pass",
        "on to the spirit world. You are now doomed to exist between worlds, for all eternity.",
    ];

    constructor(renderer: PixiRenderer) {
        this.renderer = renderer;
    }

    public startWindow(): void {
        setTimeout(() => {
            this.draw();
        }, 200);

        setTimeout(() => {
            this.canContinue = true;
            this.draw();
        }, this.canContinueTime);
    }

    public stopWindow(): void {
        //
    }

    public handleKeyPress(app: App, e: KeyboardEvent): void {
        if (this.canContinue) {
            app.goToMainMenu();
        }
    }

    public handleClick(app: App, mouseEvent: IMouseEvent): void {
        //
    }

    public draw(): void {
        this.renderer.clear();
        this.renderer.drawString(280, 100, "GAME OVER", Color.white);
        let y = 0;
        for (const line of this.texts) {
            this.renderer.drawString(45, 150 + y, line, Color.lightgray);
            y += 23;
        }
        if (this.canContinue) {
            this.renderer.drawString(220, 300, " - Press any key to continue -", Color.white);
        }
        this.renderer.render();
    }
}
