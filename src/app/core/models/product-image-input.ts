export interface ProductImageInput {
    id?: string;
    sku_id?: string | null;
    sku_code_ref?: string | null;
    url: string;
    is_cover: boolean;
}