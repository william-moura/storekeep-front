import { Routes } from '@angular/router';
import { ListProducts } from './features/products/list-products/list-products';

export const routes: Routes = [
    { path: '', component: ListProducts },
    { path: 'products', component: ListProducts },
];
