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
        let line = "";
        for (let index = 0; index < msg.length; index++) {
            if (index === 0) {
                // Capitalize first letter.
                line += msg.charAt(index).toUpperCase();
            } else {
                line += msg.charAt(index);
            }
            if (msg.charAt(index) === " " && line.length > 90) {
                this.internalAdd(line, color);
                line = "";
            }
        }
        this.internalAdd(line, color);
    }

    public getLines(): Buffer {
        return this.buffer;
    }

    public getMaxLines(): number {
        return this.maxLines;
    }

    private internalAdd(msg: string, color: number = Color.white): void {
        this.buffer.push([msg, color]);
        while (this.buffer.length > this.maxLines) {
            this.buffer.splice(0, 1);
        }
    }
}
