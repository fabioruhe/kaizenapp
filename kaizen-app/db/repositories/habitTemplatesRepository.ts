import type { HabitTemplate } from '@/types';
import rawTemplates from '@/data/habitTemplates.json';

export interface HabitTemplatesRepository {
  getAll(): Promise<HabitTemplate[]>;
  getByCategory(category: string): Promise<HabitTemplate[]>;
  getById(id: string): Promise<HabitTemplate | null>;
  getCategories(): Promise<string[]>;
}

// ─── Implementação estática (Fase 1) ─────────────────────────────────────────
// Lê do JSON em /data/habitTemplates.json — sem banco, sem rede.

export class StaticHabitTemplatesRepository implements HabitTemplatesRepository {
  private readonly templates: HabitTemplate[];

  constructor() {
    this.templates = (rawTemplates as HabitTemplate[]).filter((t) => t.isActive);
  }

  async getAll(): Promise<HabitTemplate[]> {
    return this.templates;
  }

  async getByCategory(category: string): Promise<HabitTemplate[]> {
    return this.templates.filter((t) => t.category === category);
  }

  async getById(id: string): Promise<HabitTemplate | null> {
    return this.templates.find((t) => t.id === id) ?? null;
  }

  async getCategories(): Promise<string[]> {
    const cats = this.templates.map((t) => t.category);
    return Array.from(new Set(cats)).sort();
  }
}
