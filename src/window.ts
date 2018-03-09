import { IMouseEvent } from "./renderer";

export interface IGameWindow {
    startWindow(): void;
    stopWindow(): void;
    handleKeyPress(e: KeyboardEvent): void;
    handleClick(mouseEvent: IMouseEvent): void;
}
