export interface CreateProductPayload {
    name: string;
    description: string | null;
    skus: {
      sku_code: string;
      ean: string | null;
      price: number;
      stock: number;
      attribute_value_ids: string[];
    }[];
    images: {
      sku_id: string | null;
      url: string;
      is_cover: boolean;
    }[];
}