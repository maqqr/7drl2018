type TileID = number;

export class Level {
    public readonly width: number;
    public readonly height: number;

    private tiles: TileID[] = [];

    private nextLevel: Level;
    private prevLevel: Level;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.nextLevel = null;
        this.prevLevel = null;
        this.tiles.fill(1, 0, width * height);
    }

    public get(x: number, y: number): TileID {
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
            const index = x + y * this.width;
            return this.tiles[index];
        }
        console.error("Level.get index out of bounds : " + JSON.stringify({ x, y }));
    }

    public set(x: number, y: number, tile: TileID): void {
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
            const index = x + y * this.width;
            this.tiles[index] = tile;
            return;
        }
        console.error("Level.set index out of bounds : " + JSON.stringify({ x, y }));
    }
}
