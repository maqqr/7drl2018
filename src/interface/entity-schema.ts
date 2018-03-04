export interface ITile {
    id: number;
    type: string;
    maxsize?: number;
    activation?: string;
    requireitem?: string;
    useractivation?: string;
    useractivationtext?: string;
    transparent?: boolean;
    damage?: number;
    description: string;
 }
export interface ICreature {
   id: number;
   type: string;
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
export interface IItem {
    id: number;
    type: string;
    category: string;
    description: string;
}
export interface IFurniture {
    icon: number;
    type: string;
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
