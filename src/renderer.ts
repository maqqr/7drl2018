import { Color } from "./color";
import { SlotType } from "./entity";
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
    public renderer: PixiRenderer;
    private game: Game;

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
        if (level === null) {
            return;
        }

        const visionRadius = 7;

        level.calculateFov(this.game.player.x, this.game.player.y, visionRadius);

        // const playerInsideBody = this.game.player.currentbody === null;
        // const colorTint = playerInsideBody ? Color.blue : 0xFFFFFF;
        const toScreen = (x: number) => Math.floor(x * 16);

        this.renderer.clear();
        for (let y = 0; y < level.height; y++) {
            for (let x = 0; x < level.width; x++) {
                const tile = level.get(x, y);
                const tileState = level.getTileState(x, y);
                const drawX = toScreen(this.game.mapOffsetX + x);
                const drawY = toScreen(this.game.mapOffsetY + y);
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
            if (tileState.state === TileVisibility.Visible) {
                this.renderer.drawTexture(
                    toScreen(this.game.mapOffsetX + furniture.x),
                    toScreen(this.game.mapOffsetY + furniture.y),
                    furniture.dataRef.icon, this.game.currentTintColor);
            }
        }

        // Draw descriptions (for debugging purposes)
        // for (const desc of this.game.getCurrentLevel().descriptions) {
        //     this.renderer.drawRect(
        //         toScreen(this.game.mapOffsetX + desc.x),
        //         toScreen(this.game.mapOffsetY + desc.y),
        //         desc.w * 16, desc.h * 16, true, Color.red);
        // }

        const items = this.game.getCurrentLevel().items;
        for (const item of items) {
            const tileState = level.getTileState(item.x, item.y);
            if (tileState.state === TileVisibility.Visible) {
                this.renderer.drawTexture(
                    toScreen(this.game.mapOffsetX + item.x), toScreen(this.game.mapOffsetY + item.y),
                    item.dataRef.icon, this.game.currentTintColor);
            }
        }

        const creatures = this.game.getCurrentLevel().creatures;
        for (const cre of creatures) {
            const tileState = level.getTileState(cre.x, cre.y);
            if (tileState.state === TileVisibility.Visible) {
                const drawX = toScreen(this.game.mapOffsetX + cre.x);
                const drawY = toScreen(this.game.mapOffsetY + cre.y);
                this.renderer.drawTexture(drawX, drawY, cre.dataRef.id, this.game.currentTintColor);
                // Draw creature hp bar
                const width = Math.floor(12 * (cre.currenthp / cre.dataRef.maxhp));
                this.renderer.drawRect(drawX + 2, drawY - 2, width, 2, false, Color.green, 0.7);
                this.renderer.drawRect(drawX + 2 + width, drawY - 2, 12 - width, 2, false, Color.red, 0.7);
            }
        }

        const player = this.game.player;
        const playerDrawX = toScreen(this.game.mapOffsetX + this.game.player.x);
        const playerDrawY = toScreen(this.game.mapOffsetY + this.game.player.y);
        if (player.currentbody === null) {
            const playerIcon = this.game.spiritAnimationIndices[this.game.spiritAnimationIndex];
            this.renderer.drawTexture(playerDrawX, playerDrawY, playerIcon);
            this.renderer.drawCircle(playerDrawX + 8, playerDrawY + 4, 30, Color.blue, 0.08);
            this.renderer.drawCircle(playerDrawX + 8, playerDrawY + 4, 15, Color.blue, 0.10);
            this.renderer.drawCircle(playerDrawX + 8, playerDrawY + 4, 9, Color.blue, 0.15);
        } else {
            this.renderer.drawCircle(playerDrawX + 8, playerDrawY + 8, 20, Color.blue, 0.08);
            this.renderer.drawCircle(playerDrawX + 8, playerDrawY + 8, 7, Color.blue, 0.15);
            this.renderer.drawTexture(playerDrawX, playerDrawY, player.currentbody.dataRef.id, 0xAAAAFF);
        }

        if (this.game.waitForDirCallback !== null || this.game.waitForItemCallback !== null) {
            for (let i = 0; i < this.game.waitForMessage.length; i++) {
                const line = this.game.waitForMessage[i];
                this.renderer.drawString(2, 16 + 12 * i, line);
            }
        } else {
            if (this.game.helpToggledOn) {
                // TODO: write help texts
                this.renderer.drawString(2, 16, "LOL U NEED SUM HELP??");
            } else {
                this.renderer.drawString(2, 16, "H - Toggle help");
            }
        }

        this.renderer.drawString(0, 0, this.game.testPuzzleName);

        // Draw messagebuffer
        const lines = this.game.messagebuffer.getLines();
        let msgY = Game.HEIGHT - lines.length * 12;
        for (let index = 0; index < lines.length; index++) {
            const msg = lines[index];
            const line = msg[0];
            let color = msg[1];
            if (index === 0 && lines.length >= this.game.messagebuffer.getMaxLines()) {
                color = Color.gray;
            }
            if (index === 1 && lines.length >= this.game.messagebuffer.getMaxLines() - 1) {
                color = Color.lightgray;
            }
            this.renderer.drawString(0, msgY, line, color);
            msgY += 12;
        }

        const spiritStatsX = Game.WIDTH - 130;
        const spiritStatsY = 10;
        const stabilityColor =
            (this.game.player.currentstability / this.game.player.spiritstability) > 0.5 ? Color.lightblue : Color.red;
        this.renderer.drawString(
            spiritStatsX + 1, spiritStatsY, "Spirit stability: " +
            Math.ceil(this.game.player.currentstability) + "/" + this.game.player.spiritstability, stabilityColor);
        this.renderer.drawString(spiritStatsX, spiritStatsY + 12, "    Spirit power: " + this.game.player.spiritpower);
        this.renderer.drawString(
            spiritStatsX + 2, spiritStatsY + 24, "        Willpower: " + this.game.player.willpower);

        let invX = 4;
        const invY = 230;
        let itemIndex = 1;
        const offSlotIcon = 176;
        const defSlotIcon = 177;
        const bagSlotIcon = 178;
        const slotBackgroundIcon = 179;
        if (this.game.player.currentbody !== null) {
            const playerBody = this.game.player.currentbody;
            // Draw hp and stats
            const hpColor = (playerBody.currenthp / playerBody.dataRef.maxhp) > 0.5 ? Color.lightgreen : Color.red;
            const statsX = Game.WIDTH - 100;
            const statsY = 60;
            this.renderer.drawString(
                statsX - 1, statsY, "   HP: " + playerBody.currenthp + "/" + playerBody.dataRef.maxhp, hpColor);
            this.renderer.drawString(statsX, statsY + 12, " STR: " + playerBody.dataRef.strength);
            this.renderer.drawString(statsX, statsY + 12 * 2, " DEF: " + playerBody.dataRef.defence);
            this.renderer.drawString(statsX, statsY + 12 * 3, " SPD: " + (10 - playerBody.dataRef.speed));
            this.renderer.drawString(statsX - 1, statsY + 12 * 4, "SIZE: " + playerBody.dataRef.size);

            // Draw item slots
            for (const slot of playerBody.inventory) {
                const slotNumberColor = slot.item === "" ? Color.gray : Color.lightblue;
                this.renderer.drawTexture(invX, invY, slotBackgroundIcon); // Slot background
                this.renderer.drawString(invX + 5, invY + 20, "" + itemIndex, slotNumberColor); // Slot number

                let slotTypeIcon = bagSlotIcon;
                if (slot.type === SlotType.Offensive) { slotTypeIcon = offSlotIcon; }
                if (slot.type === SlotType.Defensive) { slotTypeIcon = defSlotIcon; }

                // Draw slot icon on top of the slot
                this.renderer.drawTexture(invX, invY - 16, slotTypeIcon); // Slot background

                // Draw item on the slot
                if (slot.item !== "") {
                    const item = this.game.data.getByType(this.game.data.items, slot.item);
                    this.renderer.drawTexture(invX, invY, item.icon);

                    // Draw bonus
                    let bonus = 0;
                    if (slot.type === SlotType.Offensive) { bonus = item.attack; }
                    if (slot.type === SlotType.Defensive) { bonus = item.defence; }
                    // if (bonus > 0) {
                    this.renderer.drawString(invX + 1, invY - 13, "+" + bonus, Color.white);
                    // }
                }
                itemIndex++;
                invX += 20;
            }
        }

        this.renderer.render();

        level.markRememberedTiles(this.game.player.x, this.game.player.y, visionRadius);
    }
}
