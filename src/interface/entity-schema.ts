export interface IHasType {
    type: string;
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
    description: string;
 }
export interface ICreature extends IHasType {
   id: number;
   maxhp: number;
   currenthp?: number;
   strength: number;
   speed: number;
   willpower?: number;
   spiritpower?: number;
   spiritstability?: number;
   size: number;
   inventoryslots?: number;
   inventory?: IItem[];
   description: string;
}
export interface IItem extends IHasType {
    id: number;
    category: string;
    description: string;
}
export interface IFurniture extends IHasType {
    icon: number;
    movable?: number;
    maxsize?: number;
    damage?: number;
    activation?: string;
    useractivation?: string;
    useractivationtext?: string;
    requireitem?: string;
    activationtarget?: number[][];
    description: string;
}
