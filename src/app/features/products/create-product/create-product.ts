import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AttributeOption } from '../../../core/models/product-option';
import { AttributeValueOption } from '../../../core/models/attribute-value-option';
import { CreateProductPayload } from '../../../core/models/create-product-payload';
import { ProductImageInput } from '../../../core/models/product-image-input';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './create-product.html',
  styleUrl: './create-product.scss',
})
export class CreateProduct {
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['combination', 'sku_code', 'ean', 'price', 'stock', 'actions'];

  readonly productService = inject(ProductService);

  // Catálogo pré-cadastrado (attributes + attribute_values)
  readonly catalogAttributes = signal<AttributeOption[]>([
    {
      id: 'attr-tamanho',
      name: 'Tamanho',
      values: [
        { id: 'val-p', attribute_id: 'attr-tamanho', value: 'P' },
        { id: 'val-m', attribute_id: 'attr-tamanho', value: 'M' },
        { id: 'val-g', attribute_id: 'attr-tamanho', value: 'G' },
        { id: 'val-gg', attribute_id: 'attr-tamanho', value: 'GG' },
      ],
    },
    {
      id: 'attr-cor',
      name: 'Cor',
      values: [
        { id: 'val-verde', attribute_id: 'attr-cor', value: 'Verde' },
        { id: 'val-azul', attribute_id: 'attr-cor', value: 'Azul' },
        { id: 'val-preta', attribute_id: 'attr-cor', value: 'Preta' },
        { id: 'val-branca', attribute_id: 'attr-cor', value: 'Branca' },
      ],
    },
    {
      id: 'attr-tecido',
      name: 'Tecido',
      values: [
        { id: 'val-algodao', attribute_id: 'attr-tecido', value: 'Algodão' },
        { id: 'val-malha', attribute_id: 'attr-tecido', value: 'Malha Fria' },
      ],
    },
  ]);

  // Seleção inicial: Tamanho (P, M, G) x Cor (Verde, Azul) = 6 SKUs
  readonly selectedAttributeIds = signal<string[]>(['attr-tamanho', 'attr-cor']);
  readonly selectedValuesByAttr = signal<Record<string, string[]>>({
    'attr-tamanho': ['val-p', 'val-m', 'val-g'],
    'attr-cor': ['val-verde', 'val-azul'],
  });

  // Signal reativo para alimentar a mat-table sempre que a grade mudar
  readonly skuRows = signal<FormGroup[]>([]);

  // Galeria de imagens (product_images)
  readonly images = signal<ProductImageInput[]>([]);

  readonly productForm = this.fb.group({
    name: ['Camisa Simples', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.maxLength(2000)]],
    skus: this.fb.array<FormGroup>([]),
  });

  readonly imageForm = this.fb.group({
    url: ['', [Validators.required]],
    sku_code_ref: [''],
    is_cover: [false],
  });

  readonly activeAttributes = computed(() => {
    const selected = new Set(this.selectedAttributeIds());
    return this.catalogAttributes().filter((attr) => selected.has(attr.id));
  });

  readonly totalStock = computed(() => {
    return this.skuRows().reduce(
      (acc, group) => acc + (Number(group.get('stock')?.value) || 0),
      0
    );
  });

  readonly averagePrice = computed(() => {
    const rows = this.skuRows();
    if (rows.length === 0) return 0;
    const sum = rows.reduce((acc, group) => acc + (Number(group.get('price')?.value) || 0), 0);
    return sum / rows.length;
  });

  readonly skuOptions = computed(() => {
    return this.skuRows().map((ctrl) => ({
      sku_code: (ctrl.get('sku_code')?.value as string) || '',
      label: this.formatCombination(ctrl.get('selected_values')?.value || []),
    }));
  });

  constructor() {
    this.rebuildSkuMatrix();
  }

  get skusFormArray(): FormArray<FormGroup> {
    return this.productForm.controls.skus;
  }

  onAttributesChange(attributeIds: string[]): void {
    this.selectedAttributeIds.set(attributeIds);
    const allowed = new Set(attributeIds);

    this.selectedValuesByAttr.update((prev) => {
      const next: Record<string, string[]> = {};
      for (const [attrId, valIds] of Object.entries(prev)) {
        if (allowed.has(attrId)) {
          next[attrId] = valIds;
        }
      }
      return next;
    });

    this.rebuildSkuMatrix();
  }

  onValuesChange(attributeId: string, valueIds: string[]): void {
    this.selectedValuesByAttr.update((prev) => ({
      ...prev,
      [attributeId]: valueIds,
    }));
    this.rebuildSkuMatrix();
  }

  removeValueChip(attributeId: string, valueId: string): void {
    const current = this.getValuesForAttribute(attributeId);
    const updated = current.filter((id) => id !== valueId);
    this.onValuesChange(attributeId, updated);
  }

  getValuesForAttribute(attributeId: string): string[] {
    return this.selectedValuesByAttr()[attributeId] ?? [];
  }

  getValueObjectsForAttribute(attribute: AttributeOption): AttributeValueOption[] {
    const selectedSet = new Set(this.getValuesForAttribute(attribute.id));
    return attribute.values.filter((v) => selectedSet.has(v.id));
  }

  rebuildSkuMatrix(): void {
    const valueMap = new Map<string, AttributeValueOption>();
    for (const attr of this.catalogAttributes()) {
      for (const val of attr.values) {
        valueMap.set(val.id, val);
      }
    }

    const activeAttrs = this.activeAttributes();
    const groups: AttributeValueOption[][] = [];

    for (const attr of activeAttrs) {
      const chosenIds = this.getValuesForAttribute(attr.id);
      if (chosenIds.length === 0) {
        this.skusFormArray.clear();
        this.skuRows.set([]);
        return;
      }

      const objects = chosenIds
        .map((id) => valueMap.get(id))
        .filter((v): v is AttributeValueOption => Boolean(v));

      groups.push(objects);
    }

    // Preserva valores já preenchidos para combinações iguais
    const previousData = new Map<string, any>();
    for (const ctrl of this.skusFormArray.controls) {
      const ids = ((ctrl.get('attribute_value_ids')?.value as string[]) ?? []).slice().sort();
      previousData.set(ids.join('|'), ctrl.value);
    }

    const combinations = groups.length > 0 ? this.cartesianProduct(groups) : [[]];
    const basePrefix = this.toCode(this.productForm.controls.name.value || 'PROD');

    this.skusFormArray.clear();

    combinations.forEach((combo, index) => {
      const key = combo.map((v) => v.id).slice().sort().join('|');
      const prev = previousData.get(key);

      const parts = combo.map((v) => this.toCode(v.value)).filter(Boolean);
      const generatedCode = parts.length > 0 ? `${basePrefix}-${parts.join('-')}` : `${basePrefix}-${index + 1}`;

      const rowGroup = this.fb.group({
        sku_code: [prev?.sku_code ?? generatedCode, [Validators.required]],
        ean: [prev?.ean ?? ''],
        price: [prev?.price ?? 59.9, [Validators.required, Validators.min(0)]],
        stock: [prev?.stock ?? 0, [Validators.required, Validators.min(0)]],
        attribute_value_ids: [combo.map((v) => v.id)],
        selected_values: [combo],
      });

      this.skusFormArray.push(rowGroup);
    });

    this.skuRows.set([...this.skusFormArray.controls]);
  }

  removeSkuRow(index: number): void {
    this.skusFormArray.removeAt(index);
    this.skuRows.set([...this.skusFormArray.controls]);
  }

  formatCombination(values: AttributeValueOption[]): string {
    if (!values || values.length === 0) {
      return 'Padrão';
    }
    const attrNames = new Map(this.catalogAttributes().map((a) => [a.id, a.name]));
    return values
      .map((v) => `${attrNames.get(v.attribute_id) ?? 'Atributo'}: ${v.value}`)
      .join(' · ');
  }

  // --- Imagens (product_images) ---

  addImage(): void {
    if (this.imageForm.invalid) {
      this.imageForm.markAllAsTouched();
      return;
    }

    const { url, sku_code_ref, is_cover } = this.imageForm.getRawValue();
    const cleanUrl = (url || '').trim();
    if (!cleanUrl) return;

    const shouldBeCover = Boolean(is_cover) || this.images().length === 0;

    this.images.update((list) => {
      const updated = shouldBeCover
        ? list.map((item) => ({ ...item, is_cover: false }))
        : [...list];

      return [
        ...updated,
        {
          url: cleanUrl,
          sku_code_ref: sku_code_ref || null,
          sku_id: null,
          is_cover: shouldBeCover,
        },
      ];
    });

    this.imageForm.reset({ url: '', sku_code_ref: '', is_cover: false });
  }

  makeCover(index: number): void {
    this.images.update((list) =>
      list.map((img, i) => ({ ...img, is_cover: i === index }))
    );
  }

  removeImage(index: number): void {
    this.images.update((list) => {
      const next = list.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((i) => i.is_cover)) {
        next[0] = { ...next[0], is_cover: true };
      }
      return next;
    });
  }

  // --- Envio ---

  onSubmit(): void {
    if (this.productForm.invalid || this.skuRows().length === 0) {
      this.productForm.markAllAsTouched();
      this.snackBar.open(
        this.skuRows().length === 0
          ? 'Selecione ao menos um valor por atributo para gerar os SKUs.'
          : 'Revise os campos obrigatórios antes de salvar.',
        'OK',
        { duration: 3500 }
      );
      return;
    }

    const raw = this.productForm.getRawValue();

    const payload: CreateProductPayload = {
      name: raw.name!.trim(),
      description: raw.description?.trim() ? raw.description.trim() : null,
      skus: raw.skus.map((item: any) => ({
        sku_code: String(item.sku_code).trim(),
        ean: item.ean?.trim() ? String(item.ean).trim() : null,
        price: Number(item.price),
        stock: Number(item.stock),
        attribute_value_ids: item.attribute_value_ids as string[],
      })),
      images: this.images().map((img) => ({
        sku_id: img.sku_id || null,
        sku_code_ref: img.sku_code_ref || null,
        url: img.url,
        is_cover: img.is_cover,
      })),
    };

    console.log('Payload pronto:', payload);
    this.productService.createProduct(payload).subscribe({
      next: () => {
        this.snackBar.open('Produto salvo com sucesso.', 'Fechar', { duration: 3500 });
      },
      error: (error) => {
        this.snackBar.open('Erro ao salvar produto.', 'Fechar', { duration: 3500 });
      },
    });
  }

  private cartesianProduct<T>(groups: T[][]): T[][] {
    return groups.reduce<T[][]>(
      (acc, currentGroup) =>
        acc.flatMap((prevCombo) => currentGroup.map((item) => [...prevCombo, item])),
      [[]]
    );
  }

  private toCode(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 5);
  }
}