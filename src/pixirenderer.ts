import * as PIXI from "pixi.js";

abstract class RenderPool<T extends PIXI.DisplayObject> {
    protected drawn: number = 0;
    protected pool: T[] = [];
    protected stage: PIXI.Container;

    constructor(stage: PIXI.Container) {
        this.stage = stage;
    }

    public clear() {
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
    public clearElement(sprite: PIXI.Sprite) {
        sprite.visible = false;
    }

    public createElement(): PIXI.Sprite {
        return new PIXI.Sprite();
    }
}

class GraphicsPool extends RenderPool<PIXI.Graphics> {
    public clearElement(g: PIXI.Graphics) {
        g.clear();
        g.visible = false;
    }

    public createElement(): PIXI.Graphics {
        return new PIXI.Graphics();
    }
}

export class PixiRenderer {
    private stage: PIXI.Container;
    private pixirenderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;

    private readonly width: number;
    private readonly height: number;

    private spritePool: SpritePool;
    private grapgicsPool: GraphicsPool;

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

        this.spritePool = new SpritePool(this.stage);
        this.grapgicsPool = new GraphicsPool(this.stage);

        const app = document.getElementById("app");
        app.appendChild(this.pixirenderer.view);
        this.pixirenderer.backgroundColor = 0x140c1c;
    }

    public loadAssets(paths, doneCallback): void {
        PIXI.loader.add(paths).load(doneCallback);
    }

    public resize(): void {
        const ratioW = Math.floor(window.innerWidth / this.width);
        const ratioH = Math.floor(window.innerHeight / this.height);
        const ratio = Math.max(1.0, Math.min(ratioW, ratioH));
        this.stage.scale.x = this.stage.scale.y = ratio;
        this.pixirenderer.resize(Math.ceil(this.width * ratio), Math.ceil(this.height * ratio));
        this.pixirenderer.render(this.stage);
    }

    public clear(): void {
        this.spritePool.clear();
        this.grapgicsPool.clear();
    }

    public drawTexture(x: number, y: number, tint = 0xFFFFFF): void {
        const fontTex = PIXI.utils.TextureCache["font.png"];
        const tex = new PIXI.Texture(fontTex, new PIXI.Rectangle(0, 0, 16, 16));

        const sprite = this.spritePool.get();
        sprite.texture = tex;
        sprite.x = x;
        sprite.y = y;
        sprite.tint = tint;
    }

    public drawRect(x: number, y: number, width: number, height: number, border = false): void {
        const rect = this.grapgicsPool.get();
        rect.beginFill(0x140c1c);
        if (border) {
            rect.lineStyle(2, 0xdeeed6);
        }
        rect.drawRect(x, y, width, height);
    }

    public render(): void {
        this.pixirenderer.render(this.stage);
    }
}
