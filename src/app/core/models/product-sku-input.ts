import { AttributeValueOption } from "./attribute-value-option";

export interface ProductSkuInput {
    id?: string;
    sku_code: string;
    ean: string | null;
    price: number;
    stock: number;
    attribute_value_ids: string[]; // mapeia para sku_attribute_values
    selected_values: AttributeValueOption[]; // apoio visual na UI
}