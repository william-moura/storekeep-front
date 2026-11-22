import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Product } from '../../../core/models/product';
import { ProductAttribute } from '../../../core/models/product-attribute';
import { ProductSku } from '../../../core/models/product-sku';

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatTableModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  selector: 'app-create-product',
  styleUrl: './create-product.scss',
  templateUrl: './create-product.html',
})
export class CreateProduct {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  readonly displayedColumns = ['combination', 'sku', 'price', 'stock', 'active', 'actions'];

  // Estado reativo com Signals para atributos dinâmicos (Ex: Cor -> ['Preta', 'Branca'])
  readonly attributes = signal<ProductAttribute[]>([
    { name: 'Cor', values: ['Preta'] },
    { name: 'Tamanho', values: ['G'] },
  ]);

  // Controle de modo (Produto Simples vs Com Variações)
  readonly hasVariations = signal<boolean>(true);

  // Formulário Principal Tipado
  readonly productForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    brand: ['', [Validators.required]],
    description: ['Camisa de algodão penteado fio 30.1'],
    // Campos usados apenas se hasVariations === false
    simpleSku: ['CAM-SIMP-001'],
    simplePrice: [59.9, [Validators.min(0)]],
    simpleStock: [10, [Validators.min(0)]],
    // Array de SKUs gerados
    skus: this.fb.array<FormGroup>([]),
  });

  // Computed para totalizar estoque em tempo real
  readonly totalStock = computed(() => {
    if (!this.hasVariations()) {
      return this.productForm.controls.simpleStock.value ?? 0;
    }
    return this.skusFormArray.controls.reduce((acc, ctrl) => {
      return acc + (Number(ctrl.get('stock')?.value) || 0);
    }, 0);
  });

  constructor() {
    // Gera a matriz inicial com o exemplo ("Camisa Simples", "Preta", "G")
    this.generateSkusMatrix();
  }

  get skusFormArray(): FormArray<FormGroup> {
    return this.productForm.controls.skus;
  }

  onToggleVariations(checked: boolean): void {
    this.hasVariations.set(checked);
    if (checked && this.skusFormArray.length === 0) {
      this.generateSkusMatrix();
    }
  }

  // --- Gerenciamento de Atributos (Ex: Cor, Tamanho, Voltagem) ---

  addAttribute(nameInput: HTMLInputElement): void {
    const name = nameInput.value.trim();
    if (!name) return;

    const exists = this.attributes().some(
      (attr) => attr.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      this.snackBar.open('Este atributo já existe.', 'Fechar', { duration: 2500 });
      return;
    }

    this.attributes.update((curr) => [...curr, { name, values: [] }]);
    nameInput.value = '';
  }

  removeAttribute(index: number): void {
    this.attributes.update((curr) => curr.filter((_, i) => i !== index));
    this.generateSkusMatrix();
  }

  addAttributeValue(attrIndex: number, event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.attributes.update((curr) =>
        curr.map((attr, idx) => {
          if (idx !== attrIndex) return attr;
          if (attr.values.includes(value)) return attr;
          return { ...attr, values: [...attr.values, value] };
        })
      );
      this.generateSkusMatrix();
    }
    event.chipInput.clear();
  }

  removeAttributeValue(attrIndex: number, valueToRemove: string): void {
    this.attributes.update((curr) =>
      curr.map((attr, idx) => {
        if (idx !== attrIndex) return attr;
        return {
          ...attr,
          values: attr.values.filter((v) => v !== valueToRemove),
        };
      })
    );
    this.generateSkusMatrix();
  }

  // --- Produto Cartesiano para Geração Automática de SKUs ---

  generateSkusMatrix(): void {
    const validAttributes = this.attributes().filter((a) => a.values.length > 0);

    if (validAttributes.length === 0) {
      this.skusFormArray.clear();
      return;
    }

    // Preserva preços/estoques já digitados caso o usuário adicione uma nova variação
    const existingMap = new Map<string, any>();
    this.skusFormArray.controls.forEach((ctrl) => {
      const key = JSON.stringify(ctrl.get('attributes')?.value);
      existingMap.set(key, ctrl.value);
    });

    // Produto cartesiano das opções
    const combinations = this.cartesianProduct(validAttributes);
    const baseName = this.slugify(this.productForm.controls.name.value || 'PROD');

    this.skusFormArray.clear();

    combinations.forEach((combo) => {
      const comboKey = JSON.stringify(combo);
      const previous = existingMap.get(comboKey);

      const suffix = Object.values(combo)
        .map((v) => this.slugify(v))
        .join('-');

      const generatedSku = previous?.sku || `${baseName}-${suffix}`;

      const skuGroup = this.fb.group({
        sku: [generatedSku, [Validators.required]],
        attributes: [combo],
        price: [previous?.price ?? 59.9, [Validators.required, Validators.min(0.01)]],
        stock: [previous?.stock ?? 10, [Validators.required, Validators.min(0)]],
        active: [previous?.active ?? true],
      });

      this.skusFormArray.push(skuGroup);
    });
  }

  removeSkuRow(index: number): void {
    this.skusFormArray.removeAt(index);
  }

  formatAttributesLabel(attributes: Record<string, string>): string {
    return Object.entries(attributes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' • ');
  }

  // --- Submissão ---

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.snackBar.open('Verifique os campos obrigatórios.', 'OK', { duration: 3000 });
      return;
    }

    const raw = this.productForm.getRawValue();
    let skusPayload: ProductSku[] = [];

    if (this.hasVariations()) {
      skusPayload = raw.skus as ProductSku[];
    } else {
      skusPayload = [
        {
          sku: raw.simpleSku || 'SKU-UNICO',
          attributes: {},
          price: Number(raw.simplePrice),
          stock: Number(raw.simpleStock),
          active: true,
        },
      ];
    }

    const payload: Product = {
      id: '',
      name: raw.name!,
      price: Number(raw.simplePrice),
      stock: Number(raw.simpleStock),
      skus: skusPayload,
    };

    console.log('Payload pronto para API:', payload);
    this.snackBar.open(
      `Produto "${payload.name}" salvo com ${payload.skus.length} SKU(s)!`,
      'Fechar',
      { duration: 4000 }
    );
  }

  // --- Helpers ---

  private cartesianProduct(attributes: ProductAttribute[]): Record<string, string>[] {
    return attributes.reduce<Record<string, string>[]>(
      (acc, attr) => {
        const res: Record<string, string>[] = [];
        acc.forEach((prev) => {
          attr.values.forEach((val) => {
            res.push({ ...prev, [attr.name]: val });
          });
        });
        return res;
      },
      [{}]
    );
  }

  private slugify(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 4);
  }
}
