export interface IHasType {
    type: string;
    description: string;
}

export interface ITile extends IHasType {
    id: number;
    maxsize?: number;
    activation?: string;
    requireitem?: string;
    useractivation?: string;
    useractivationtext?: string;
    transparent?: boolean;
    damage?: number;
 }
export interface ICreature extends IHasType {
   id: number;
   maxhp: number;
   strength: number;
   speed: number;
   size: number;
   inventoryslots?: number;
   inventory?: IItem[];
}
export interface IItem extends IHasType {
    id: number;
    category: string;
}
export interface IFurniture extends IHasType {
    icon: number;
    size?: number;
    movable?: number;
    draworder?: number;
    // maxsize?: number;
    damage?: number;
    activation?: string;
    useractivation?: string;
    useractivationtext?: string;
    requireitem?: string;
    activationtarget?: number[][];
    transparent: boolean;
}

export interface IPlayer extends IHasType {
    id: number;
    speed: number;
}
