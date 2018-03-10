import { App } from "..";
import { Color } from "../color";
import { PixiRenderer } from "../pixirenderer";
import { IMouseEvent } from "../renderer";
import { ICharCreation } from "./charcreation";
import { Game } from "./game";
import { IGameWindow } from "./window";

export class MainMenu implements IGameWindow {
    public static anim: string[];

    public static createFrameNames(): void {
        MainMenu.anim = [];
        for (let index = 0; index <= 14; index++) {
            const str = "" + index;
            const pad = "0000";
            const padded = pad.substring(0, pad.length - str.length) + str;
            MainMenu.anim.push("flame" + padded + ".png");
        }
    }

    private renderer: PixiRenderer;
    private animIndex: number = 0;
    private intervalId: number;

    private flameY: number = 200;
    private flameTargetY: number = 80;

    private fadeTimer: number = 0.0;
    private currentTintColor: number = Color.black;
    private tintColors: number[] = [
        Color.black,
        Color.black,
        Color.black,
        Color.black,
        Color.black,
        Color.black,
        Color.darkbrown,
        Color.darkbrown,
        Color.darkbrown,
        Color.darkbrown,
        Color.darkbrown,
        Color.darkbrown,
        Color.darkbrown,
        Color.darkbrown,
        Color.gray,
        Color.gray,
        Color.gray,
        Color.white,
        Color.white,
        Color.white,
        0xFFFFFF,
    ];

    private canContinueTime: number = 2000;
    private canContinue: boolean = false;

    constructor(renderer: PixiRenderer) {
        this.renderer = renderer;
    }

    public startWindow(): void {
        this.intervalId = setInterval(this.updateAnimation.bind(this), 80);
        this.draw();

        setTimeout(() => {
            this.canContinue = true;
            this.draw();
        }, this.canContinueTime);
    }

    public stopWindow(): void {
        clearInterval(this.intervalId);
    }

    public handleKeyPress(app: App, e: KeyboardEvent): void {
        if (this.canContinue) {
            app.goToCharCreation();
        }
    }

    public handleClick(app: App, mouseEvent: IMouseEvent): void {
        //
    }

    public draw(): void {
        this.renderer.clear();
        this.renderer.drawImage(0, 0, "bg.png", this.currentTintColor);
        this.renderer.drawImage(Game.WIDTH / 2 - 37, Math.floor(this.flameY),
                                MainMenu.anim[this.animIndex], this.currentTintColor);

        if (this.canContinue) {
            this.renderer.drawString(230, 350, "* Press any key to die *", Color.white);
        }
        this.renderer.render();
    }

    private updateAnimation(): void {
        this.fadeTimer = Math.min(1.0, this.fadeTimer + 0.1);
        this.currentTintColor = this.tintColors[Math.floor(this.fadeTimer * (this.tintColors.length - 1))];

        this.flameY += (this.flameTargetY - this.flameY) * (2 / 80);

        this.animIndex++;
        if (this.animIndex >= MainMenu.anim.length) {
            this.animIndex = 0;
        }
        this.draw();
    }
}
