export interface ITile {
    id: number;
    type: string;
    maxsize: number;
    activation?: string;
    requireitem?: string;
    useractivation?: string;
    useractivationtext?: string;
    transparent?: boolean;
    damage?: number;
 }
