import { ProductSku } from "./product-sku";

export interface Product {
    id: string;
    name: string;    
    price: number;    
    stock: number;
    skus: ProductSku[];
}