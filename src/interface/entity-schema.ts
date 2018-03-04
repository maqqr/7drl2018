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
export interface ICreature {
   id: number;
   type: string;
   maxhp?: number;
   currrenthp?: number;
   strength: number;
   speed: number;
   willpower?: number;
   spiritpower?: number;
   spiritstability?: number;
   size?: number;
   inventoryslots?: number;
   inventory?: IItem[];
}
export interface IItem {
    id: number;
    type: string;
    category: string;
}

