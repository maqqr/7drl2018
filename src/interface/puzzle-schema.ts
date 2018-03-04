export interface ITileLayer {
    type: "tilelayer";
    name: "tile" | "furniture";
    data: number[];
}

export interface IObjectLayer {
    type: "objectgroup";
    name: "description" | "pressureplate" | "switch";
    objects?: {
        properties?: {
            activations?: string;
            activationtext?: string;
            deactivationtext?: string;
            text?: string;
        };
    };
}

export interface IPuzzleRoom {
    height?: 12;
    width?: 12;
    infinite?: false;
    layers?: Array<ITileLayer | IObjectLayer>;
}
