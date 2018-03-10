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

    private title: string;
    private texts: string[];

    constructor(renderer: PixiRenderer, title: string, texts: string[]) {
        this.renderer = renderer;
        this.title = title;
        this.texts = texts;
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
        this.renderer.drawString(280, 100, this.title, Color.white);
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
