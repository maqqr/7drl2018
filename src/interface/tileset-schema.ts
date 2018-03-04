export interface ITileset {
    tiles: {
      id: string;
      type: string;
      maxsize: number;
      activation?: string;
      requireitem?: string;
      useractivation?: string;
      useractivationtext?: string;
      transparent?: boolean;
      damage?: number;
    };
  }
