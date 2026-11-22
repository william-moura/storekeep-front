export interface ProductSku {
  sku: string;
  attributes: { [key: string]: string };
  price: number;
  stock: number;
  active: boolean;
}