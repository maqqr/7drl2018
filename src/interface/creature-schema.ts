import { IItem } from "./Item-schema";
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
