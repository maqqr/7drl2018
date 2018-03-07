export interface ITileLayer {
    type: "tilelayer";
    name: "tile" | "furniture";
    data: number[];
}

export interface IObjectLayerObject {
    x: number;
    y: number;
    type: string;
    width?: number;
    height?: number;
    gid?: number;
    properties?: {
        activations?: string;
        activationtext?: string;
        deactivationtext?: string;
        text?: string;
    };
}

export interface IObjectLayer {
    type: "objectgroup";
    name: "description" | "pressureplate" | "switch";
    objects?: IObjectLayerObject[];
}

export interface IPuzzleRoom {
    puzzlename: string;
    height?: number;
    width?: number;
    infinite?: false;
    layers?: Array<ITileLayer | IObjectLayer>;
}

export interface IPuzzleList {
    puzzles: string[][];
    other: string[][];
    pre: string[][];
    base: string[][];
}
