import { App } from "..";
import { Color } from "../color";
import { Player } from "../entity";
import { PixiRenderer } from "../pixirenderer";
import { IMouseEvent } from "../renderer";
import { Game } from "./game";
import { IGameWindow } from "./window";
import { GameData } from "../data";

export interface IQuestion {
    question: string;
    willpower: string;
    power: string;
    stability: string;
}

export interface ICharCreation {
    questions: IQuestion[];
}

type CharGenDoneCallback = (player: Player) => void;

export class CharCreation implements IGameWindow {
    private data: GameData;
    private renderer: PixiRenderer;

    private player: Player;

    constructor(renderer: PixiRenderer, data: GameData, player: Player) {
        this.player = player;
        this.renderer = renderer;
        this.data = data;
    }

    public startWindow(): void {
        this.player.currentbody = null;
        this.player.spiritstability = 8;
        this.player.currentstability = this.player.spiritstability;
        this.player.spiritpower = 0;
        this.player.willpower = 8;
        this.draw();
    }

    public stopWindow(): void {
        //
    }

    public draw(): void {
        this.renderer.clear();
        let y = 0;
        for (const line of this.data.introafter) {
            this.renderer.drawString(10, 50 + y, line, Color.white);
            y += 14;
        }
        this.renderer.drawString(20, Game.HEIGHT - 30, "Press space to continue", Color.white);
        this.renderer.render();
    }

    public handleKeyPress(app: App, e: KeyboardEvent): void {
        console.log(e.code);

        // TODO: Check pressed key

        // Advance to next question

        // Redraw everything
        this.draw();

        // TODO: remove this
        if (e.code === "Space") {
            const gameWindow = new Game(app.renderer, app.data, this.player);
            app.setWindow(gameWindow);
        }
    }

    public handleClick(app: App, mouseEvent: IMouseEvent): void {
        //
    }
}
