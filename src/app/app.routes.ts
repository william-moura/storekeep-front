import { Routes } from '@angular/router';
import { ListProducts } from './features/products/list-products/list-products';
import { CreateProduct } from './features/products/create-product/create-product';

export const routes: Routes = [
    { path: '', component: ListProducts },
    { path: 'products', component: ListProducts },
    { path: 'products/create', component: CreateProduct },
];
