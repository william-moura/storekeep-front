import { AttributeValueOption } from "./attribute-value-option";

export interface AttributeOption {
    id: string;
    name: string;
    values: AttributeValueOption[];
}