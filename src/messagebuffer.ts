import { Color } from "./color";

type Buffer = Array<[string, number]>;

export class MessageBuffer {
    private maxLines: number;
    private buffer: Buffer;

    constructor(maxLines: number) {
        this.maxLines = maxLines;
        this.buffer = [];
    }

    public add(msg: string, color: number = Color.white): void {
        this.buffer.push([msg, color]);
        while (this.buffer.length > this.maxLines) {
            this.buffer.splice(0, 1);
        }
    }

    public getLines(): Buffer {
        return this.buffer;
    }

    public getMaxLines(): number {
        return this.maxLines;
    }
}
