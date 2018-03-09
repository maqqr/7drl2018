import { Color } from "./color";
import { Player } from "./entity";
import { PixiRenderer } from "./pixirenderer";
import { IMouseEvent, Renderer } from "./renderer";
import { IGameWindow } from "./window";

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
    private data: ICharCreation;
    private doneCallback: CharGenDoneCallback;
    private renderer: PixiRenderer;
    // private keyDownCallBack: any;

    private player: Player;

    constructor(renderer: PixiRenderer, data: ICharCreation,
                player: Player, done: CharGenDoneCallback) {
        this.player = player;
        this.renderer = renderer;
        this.data = data;
        this.doneCallback = done;
        // this.keyDownCallBack = this.handleKeyPress.bind(this);
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
        this.renderer.drawString(50, 50, "(char gen here)", Color.white);
        this.renderer.drawString(50, 100, "Press space", Color.white);
        this.renderer.render();
    }

    public handleKeyPress(e: KeyboardEvent): void {
        console.log("chargen");
        console.log(e.code);

        // TODO: Check pressed key

        // Advance to next question

        // Redraw everything
        this.draw();

        // TODO: remove this
        if (e.code === "Space") {
            this.doneCallback(this.player);
        }
    }

    public handleClick(mouseEvent: IMouseEvent): void {
        //
    }
}
