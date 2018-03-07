import * as PIXI from "pixi.js";
import { Color } from "./color";

abstract class RenderPool<T extends PIXI.DisplayObject> {
    protected drawn: number = 0;
    protected pool: T[] = [];
    protected stage: PIXI.Container;

    constructor(stage: PIXI.Container) {
        this.stage = stage;
    }

    public clear(): void {
        this.pool.forEach(this.clearElement.bind(this));
        this.drawn = 0;
    }

    public get(): T {
        let elem: T;
        if (this.drawn >= this.pool.length) {
            elem = this.createElement();
            this.stage.addChild(elem);
            this.pool.push(elem);
        } else {
            elem = this.pool[this.drawn];
        }
        elem.visible = true;
        this.drawn++;
        return elem;
    }

    protected abstract clearElement(elem: T): void;
    protected abstract createElement(): T;
}

class SpritePool extends RenderPool<PIXI.Sprite> {
    public clearElement(sprite: PIXI.Sprite): void {
        sprite.visible = false;
    }

    public createElement(): PIXI.Sprite {
        return new PIXI.Sprite();
    }
}

class GraphicsPool extends RenderPool<PIXI.Graphics> {
    public clearElement(g: PIXI.Graphics): void {
        g.clear();
        g.visible = false;
    }

    public createElement(): PIXI.Graphics {
        return new PIXI.Graphics();
    }
}

export class PixiRenderer {
    private stage: PIXI.Container;
    private spriteStage: PIXI.Container;
    private graphicsStage: PIXI.Container;
    private pixirenderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;

    private readonly width: number;
    private readonly height: number;

    private spritePool: SpritePool;
    private grapgicsPool: GraphicsPool;
    private zoomFactor: number;

    private letterSizes: object = {
        " ": 4, "!": 3, "\"": 5, "#": 7, "$": 7, "%": 8, "&": 7, "'": 3, "(": 5, ")": 5,
        "*": 7, "+": 7, ",": 4, "-": 7, ".": 3, "/": 6, "0": 6, "1": 5, "2": 6, "3": 6,
        "4": 6, "5": 6, "6": 6, "7": 6, "8": 6, "9": 6, ":": 3, ";": 4, "<": 6, "=": 6,
        ">": 6, "?": 7, "@": 7, "A": 7, "B": 6, "C": 6, "D": 6, "E": 6, "F": 6, "G": 6,
        "H": 6, "I": 5, "J": 6, "K": 6, "L": 6, "M": 7, "N": 7, "O": 6, "P": 6, "Q": 7,
        "R": 6, "S": 6, "T": 7, "U": 6, "V": 7, "W": 7, "X": 7, "Y": 7, "Z": 6, "[": 5,
        "\\": 6, "]": 5, "^": 7, "_": 6, "`": 5, "a": 6, "b": 6, "c": 6, "d": 6, "e": 6,
        "f": 5, "g": 6, "h": 6, "i": 3, "j": 4, "k": 6, "l": 3, "m": 7, "n": 6, "o": 6,
        "p": 6, "q": 7, "r": 6, "s": 6, "t": 6, "u": 6, "v": 7, "w": 7, "x": 7, "y": 7,
        "z": 6, "{": 5, "|": 3, "}": 5, "~": 7,
    };

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    public initialize(): void {
        this.pixirenderer = PIXI.autoDetectRenderer(this.width, this.height, {
            resolution: window.devicePixelRatio || 1,
            roundPixels: false,
        });
        this.pixirenderer.view.id = "pixi-canvas";
        PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
        this.stage = new PIXI.Container();
        this.spriteStage = new PIXI.Container();
        this.graphicsStage = new PIXI.Container();

        this.stage.addChild(this.spriteStage);
        this.stage.addChild(this.graphicsStage);

        this.spritePool = new SpritePool(this.spriteStage);
        this.grapgicsPool = new GraphicsPool(this.graphicsStage);

        const app = document.getElementById("app");
        app.appendChild(this.pixirenderer.view);
        this.pixirenderer.backgroundColor = 0x140c1c;
    }

    public getCanvas(): HTMLCanvasElement {
        return this.pixirenderer.view;
    }

    public loadAssets(paths: string[], doneCallback: () => void): void {
        PIXI.loader.add(paths).load(doneCallback);
    }

    public resize(): void {
        const ratioW = window.innerWidth / this.width;
        const ratioH = window.innerHeight / this.height;
        const ratio = Math.max(1.0, Math.min(ratioW, ratioH));
        this.stage.scale.x = this.stage.scale.y = ratio;
        // this.pixirenderer.resize(Math.ceil(this.width * ratio), Math.ceil(this.height * ratio));
        this.pixirenderer.resize(this.width * ratio, this.height * ratio);
        this.pixirenderer.render(this.stage);
    }

    public clear(): void {
        this.spritePool.clear();
        this.grapgicsPool.clear();
    }

    public drawTexture(x: number, y: number, index: number, tint: number = 0xFFFFFF): void {
        const fontTex = PIXI.utils.TextureCache["tileset.png"];
        const tx = Math.floor(index % 16) * 16;
        const ty = Math.floor(index / 16) * 16;
        const tex = new PIXI.Texture(fontTex, new PIXI.Rectangle(tx, ty, 16, 16));

        const sprite = this.spritePool.get();
        sprite.texture = tex;
        sprite.x = x;
        sprite.y = y;
        sprite.tint = tint;
    }

    public drawRect(x: number, y: number, width: number, height: number,
                    border: boolean = false, backgroundColor: number = Color.black, alpha: number = 1): void {
        const rect = this.grapgicsPool.get();
        rect.beginFill(backgroundColor, alpha);
        if (border) {
            rect.lineStyle(2, Color.white);
        }
        rect.drawRect(x, y, width, height);
    }

    public drawCircle(x: number, y: number, radius: number, color: number, alpha: number): void {
        const rect = this.grapgicsPool.get();
        rect.beginFill(color, alpha);
        rect.drawCircle(x, y, radius);
    }

    public drawString(x: number, y: number, str: string): void {
        for (const ch of str) {
            this.drawChar(x, y, ch);
            x += this.letterSizes[ch];
        }
    }

    public drawChar(x: number, y: number, ch: string, tint: number = Color.white): void {
        const index = ch.charCodeAt(0);
        const fontTex = PIXI.utils.TextureCache["font.png"];
        const tx = Math.floor((index - 32) % 16) * 8;
        const ty = Math.floor((index - 32) / 16) * 12;

        const tex = new PIXI.Texture(fontTex, new PIXI.Rectangle(tx, ty, 8, 12));

        const sprite = this.spritePool.get();
        sprite.texture = tex;
        sprite.x = x;
        sprite.y = y;
        // sprite.width = 12;
        // sprite.height = 8;
        sprite.tint = tint;
    }

    public render(): void {
        this.pixirenderer.render(this.stage);
    }
}
