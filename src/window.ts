import { IMouseEvent } from "./renderer";

export interface IGameWindow {
    handleKeyPress(e: KeyboardEvent): void;
    handleClick(mouseEvent: IMouseEvent): void;
}
