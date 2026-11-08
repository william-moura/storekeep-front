// src/app/core/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // O ideal é que a URL base venha de uma configuração que considere o subdomínio do tenant atual
  private apiUrl = '/api/products';

  constructor(private http: HttpClient) {}

  createProduct(productData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, productData);
  }

  getAllProducts(page: number, pageSize: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
  }
}
