import { App } from "..";
import { Color } from "../color";
import { GameData } from "../data";
import { Player } from "../entity";
import { PixiRenderer } from "../pixirenderer";
import { IMouseEvent } from "../renderer";
import { Game } from "./game";
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

enum Stage {
    Intro = 0,
    Questions = 1,
    Outro = 2,
    StartGame = 3,
}

export class CharCreation implements IGameWindow {
    private data: GameData;
    private renderer: PixiRenderer;

    private player: Player;
    private questionIndex: number = 0;
    private choices: string[] = [];

    private stage: Stage = Stage.Intro;

    constructor(renderer: PixiRenderer, data: GameData, player: Player) {
        this.player = player;
        this.renderer = renderer;
        this.data = data;
        this.stage = Stage.Intro;
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

        if (this.stage === Stage.Intro || this.stage === Stage.Outro) {
            let y = 0;
            const lines = this.stage === Stage.Intro ? this.data.introtexts : this.data.introafter;
            for (const line of lines) {
                this.renderer.drawString(10, 50 + y, line, Color.white);
                y += 14;
            }
            this.renderer.drawString(20, Game.HEIGHT - 30, "Press space to continue", Color.white);
        }

        if (this.stage === Stage.Questions) {
            const question = this.data.charcreation.questions[this.questionIndex];

            let y = 20;
            for (const lineText of this.splitLines(question.question, 100)) {
                this.renderer.drawString(20, y, lineText, Color.white);
                y += 14;
            }
            y += 30;

            this.choices = ["willpower", "power", "stability"];
            this.shuffle(this.choices);

            let index = 1;
            for (const ch of this.choices) {
                const txt = "" + index + ") " + question[ch];
                for (const lineText of this.splitLines(txt, 80)) {
                    this.renderer.drawString(40, y, lineText, Color.lightblue);
                    y += 14;
                }
                y += 14;
                index++;
            }
            this.renderer.drawString(20, Game.HEIGHT - 30, "Press number 1, 2 or 3", Color.white);
        }

        this.renderer.render();
    }

    public handleKeyPress(app: App, e: KeyboardEvent): void {
        if (e.code === "Space") {
            if (this.stage !== Stage.Questions) {
                this.stage++;
                this.draw();
            }

            if (this.stage === Stage.StartGame) {
                const gameWindow = new Game(app.renderer, app.data, this.player);
                app.setWindow(gameWindow);
            }
        }

        if (this.stage === Stage.Questions) {
            for (let index = 0; index < this.choices.length; index++) {
                if (e.code === "Digit" + (index + 1) || e.code === "Numpad" + (index + 1)) {
                    const stat = this.choices[index];
                    this.increaseAndNextQuestion(this.choices[index]);
                    this.draw();
                }
            }
        }
    }

    public handleClick(app: App, mouseEvent: IMouseEvent): void {
        //
    }

    private splitLines(msg: string, splitAt: number): string[] {
        const lines = [];
        let line = "";
        for (const char of msg) {
            line += char;
            if (line.length >= splitAt && char === " ") {
                lines.push(line);
                line = "";
            }
        }
        lines.push(line);
        return lines;
    }

    private shuffle<T>(a: T[]): void {
        let j;
        let x;
        let i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
    }

    private increaseAndNextQuestion(statName: string): void {
        if (statName === "willpower") {
            this.player.willpower++;
        }
        if (statName === "power") {
            this.player.spiritpower++;
        }
        if (statName === "stability") {
            this.player.spiritstability += 2;
            this.player.currentstability = this.player.spiritstability;
        }

        this.questionIndex++;
        if (this.questionIndex >= this.data.charcreation.questions.length) {
            this.stage++;
        }
    }
}
