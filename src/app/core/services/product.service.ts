// src/app/core/services/product.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product';
import { Pagination } from '../models/pagination';

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

  getAllProducts(page: number, pageSize: number): Observable<Pagination<Product>> {
    const params = new HttpParams()
    .set('page', (page + 1).toString()) // MatPaginator começa em 0, Laravel em 1
    .set('per_page', pageSize.toString());
    return this.http.get<Pagination<Product>>(`${this.apiUrl}?page=${page}&pageSize=${pageSize}`);
  }
  deleteProduct(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
  updateProduct(id: string, productData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, productData);
  }
}
