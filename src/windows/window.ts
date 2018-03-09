import { App } from "..";
import { IMouseEvent } from "../renderer";

export interface IGameWindow {
    startWindow(): void;
    stopWindow(): void;
    handleKeyPress(app: App, e: KeyboardEvent): void;
    handleClick(app: App, mouseEvent: IMouseEvent): void;
}
