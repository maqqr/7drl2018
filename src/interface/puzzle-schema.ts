export interface ITileLayer {
    type: "tilelayer";
    name: "tile" | "furniture";
    data: number[];
}

export interface IObjectLayerObject {
    x: number;
    y: number;
    type: string;
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
    height?: 12;
    width?: 12;
    infinite?: false;
    layers?: Array<ITileLayer | IObjectLayer>;
}
