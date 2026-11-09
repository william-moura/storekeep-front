import { Component, inject, signal } from '@angular/core';
import { ProductService } from '../../../core/services/product.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Product } from '../../../core/models/product';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule, 
    MatSortModule, MatInputModule, MatFormFieldModule, 
    MatButtonModule, MatIconModule, MatChipsModule
  ],
  selector: 'app-list-products',
  styleUrl: './list-products.scss',
  templateUrl: './list-products.html',
})
export class ListProducts {
  private productService = inject(ProductService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  totalRegistros = 0;
  pageSize = 5;
  indicePagina = 0;
  productSelecionado: Product | null = null;
  // constructor(private paginator: MatPaginator) {
  //   this.paginator = paginator;
  // }
  constructor() {}
  isLoading = signal(true);
  displayedColumns: string[] = ['name', 'price', 'stock', 'acoes'];
  dataSource = new MatTableDataSource<Product>([]);
  // paginator = viewChild.required(MatPaginator);
  // sort = viewChild.required(MatSort);
  // @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    // this.dataSource.paginator = this.paginator();
    // this.dataSource.sort = this.sort();
  }
  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  getProducts() {
    this.isLoading.set(true);
    this.productService.getAllProducts(this.indicePagina, this.pageSize).subscribe({
      next: (products) => {
        console.log(products);
        this.dataSource.data = products.data;
        this.totalRegistros = products.total;
        this.indicePagina = 0;
        this.pageSize = 5;
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Erro ao buscar veículos:', error);
        this.isLoading.set(false);
      }
    });
  }
  ngOnInit() {
    this.getProducts();
  }
  
  onPageChange(event: PageEvent) {
    this.indicePagina = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getProducts();
  }
  addProduct() {
    this.router.navigate(['/products/add']);
  }
  editProduct(product: Product) {
    this.router.navigate(['/products/edit', product.id]);
  }
  deleteProduct(product: Product) {
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.getProducts();
      },
      error: (error: any) => {
        console.error('Erro ao excluir produto:', error);
      }
    });
  }
}