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
   defence: number;
   speed: number;
   size: number;
   name?: string;
   namearticle: string;
   willpower: number;
   flying?: boolean;
   fireimmunity?: boolean;
   poisonimmunity?: boolean;
   spikeimmunity?: boolean;
   category?: string;
   inventoryslots?: number;
   defenciveslot?: boolean;
   offensiveslot?: boolean;
   inventory?: string[];
}

export interface IItem extends IHasType {
    id: number;
    icon: number;
    attack: number;
    defence: number;
    name: string;
    namearticle: string;
    category: string;
}

export interface IFurniture extends IHasType {
    icon: number;
    name: string;
    namearticle: string;
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
    lootlist?: string[];
}

export interface IPlayer extends IHasType {
    id: number;
    speed: number;
}

export interface IEnemyPrefix {
    type: string;
    stat: string;
    bonus: string;
    article: string;
}

export interface IEnemyPrefixSet {
    prefixes: IEnemyPrefix[];
}
