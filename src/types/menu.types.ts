// src/types/menu.types.ts

export interface ICustomizationOption {
  name: string;
  options: Array<{
    name: string;
    price: number;
  }>;
  required: boolean;
  multiSelect: boolean;
}

export interface IMenuItem {
  _id?: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  tags: string[];
  isAvailable: boolean;
  customizationOptions: ICustomizationOption[];
  createdAt?: Date;
  updatedAt?: Date;
}
