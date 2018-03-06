import { Color } from "./color";
import { Game } from "./index";
import { Level, TileVisibility } from "./level";
import { PixiRenderer } from "./pixirenderer";

export interface IMouseEvent {
    mx: number; // Mouse X
    my: number; // Mouse Y
    tx: number; // Tile X
    ty: number; // Tile Y
}

export class Renderer {
    private game: Game;
    private renderer: PixiRenderer;

    constructor(game: Game) {
        this.game = game;
        this.renderer = new PixiRenderer(Game.WIDTH, Game.HEIGHT);
        this.renderer.initialize();

        window.addEventListener("resize", this.renderer.resize.bind(this.renderer));
        this.renderer.resize();
    }

    public addClickListener(callback: (e: IMouseEvent) => void): void {
        this.renderer.getCanvas().addEventListener("click", (event) => {
            const rect = this.renderer.getCanvas().getBoundingClientRect();
            const mx = Math.floor(((event.clientX - rect.left) / rect.width) * Game.WIDTH);
            const my = Math.floor(((event.clientY - rect.top) / rect.height) * Game.HEIGHT);
            const tx = Math.floor(mx / 16);
            const ty = Math.floor(my / 16);
            callback({ mx, my, tx, ty });
        });
    }

    public async loadGraphics(): Promise<{}> {
        return new Promise((resolve, reject) => {
            this.renderer.loadAssets(["font.png", "tileset.png"], resolve);
        });
    }

    public renderGame(): void {
        const level = this.game.getCurrentLevel();
        const visionRadius = 7;

        level.calculateFov(this.game.player.x, this.game.player.y, visionRadius);

        // const playerInsideBody = this.game.player.currentbody === null;
        // const colorTint = playerInsideBody ? Color.blue : 0xFFFFFF;

        this.renderer.clear();
        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {
                const tile = level.get(x, y);
                const tileState = level.getTileState(x, y);
                const drawX = (this.game.mapOffsetX + x) * 16;
                const drawY = (this.game.mapOffsetY + y) * 16;
                if (tileState.state === TileVisibility.Visible) {
                    this.renderer.drawTexture(drawX, drawY, tile, this.game.currentTintColor);
                } else if (tileState.state === TileVisibility.Remembered) {
                    const rememberTint = 0x4444AA;
                    this.renderer.drawTexture(drawX, drawY, tileState.rememberedTile, rememberTint);
                    if (tileState.rememberedFurniture !== 0) {
                        this.renderer.drawTexture(drawX, drawY, tileState.rememberedFurniture, rememberTint);
                    }
                } else {
                    this.renderer.drawTexture(drawX, drawY, tile, 1);
                }
            }
        }

        const furnitures = this.game.getCurrentLevel().furnitures;
        for (const furniture of furnitures) {
            const tileState = level.getTileState(furniture.x, furniture.y);
            // const furId = this.game.data.getByType(this.game.data.furnitures, furniture.dataType);
            // const furDef = this.game.data.furnitures[furId];
            if (tileState.state === TileVisibility.Visible) {
                this.renderer.drawTexture(
                    (this.game.mapOffsetX + furniture.x) * 16,
                    (this.game.mapOffsetY + furniture.y) * 16,
                    furniture.dataRef.icon, this.game.currentTintColor);
            }
        }

        // Draw descriptions (for debugging purposes)
        // for (const desc of this.game.getCurrentLevel().descriptions) {
        //     this.renderer.drawRect(desc.x * 16, desc.y * 16, desc.w * 16, desc.h * 16, true, Color.red);
        // }

        const creatures = this.game.getCurrentLevel().creatures;
        for (const furry of creatures) {
            const tileState = level.getTileState(furry.x, furry.y);
            if (tileState.state === TileVisibility.Visible) {
                this.renderer.drawTexture((this.game.mapOffsetX + furry.x) * 16, (this.game.mapOffsetY + furry.y) * 16,
                    furry.dataRef.id, this.game.currentTintColor);
            }
        }

        const player = this.game.player;
        const playerDrawX = (this.game.mapOffsetX + this.game.player.x) * 16;
        const playerDrawY = (this.game.mapOffsetY + this.game.player.y) * 16;
        if (player.currentbody === null) {
            const playerIcon = this.game.spiritAnimationIndices[this.game.spiritAnimationIndex];
            this.renderer.drawTexture(playerDrawX, playerDrawY, playerIcon);
            this.renderer.drawCircle(playerDrawX + 8, playerDrawY + 4, 30, Color.blue, 0.08);
            this.renderer.drawCircle(playerDrawX + 8, playerDrawY + 4, 15, Color.blue, 0.10);
            this.renderer.drawCircle(playerDrawX + 8, playerDrawY + 4, 9, Color.blue, 0.15);
        } else {
            this.renderer.drawTexture(playerDrawX, playerDrawY, player.currentbody.dataRef.id);
        }

        this.renderer.render();

        level.markRememberedTiles(this.game.player.x, this.game.player.y, visionRadius);
    }
}
