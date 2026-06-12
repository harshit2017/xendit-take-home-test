// src/types/menu.types.ts

export enum DietaryRestriction {
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten-free',
  DAIRY_FREE = 'dairy-free',
}

export enum Allergen {
  MILK = 'milk',
  EGGS = 'eggs',
  TREE_NUTS = 'tree-nuts',
  PEANUTS = 'peanuts',
  WHEAT = 'wheat',
  SOY = 'soy',
}

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
  dietaryRestrictions: string[];
  allergens: string[];
  spiceLevel: number;
  orderCount: number;
  isAvailable: boolean;
  customizationOptions: ICustomizationOption[];
  createdAt?: Date;
  updatedAt?: Date;
}
