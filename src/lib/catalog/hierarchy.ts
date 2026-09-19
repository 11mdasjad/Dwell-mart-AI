import { Category, CategoryHierarchyNode, SourceClassification } from './types';

export interface CategoryAnomalyReport {
  duplicateNames: Array<{ name: string; ids: string[] }>;
  duplicateSlugs: Array<{ slug: string; ids: string[] }>;
  missingParents: Array<{ categoryId: string; missingParentId: string }>;
  circularReferences: string[];
  orphanCount: number;
}

export class CategoryHierarchy {
  private categoriesById: Map<string, Category> = new Map();
  private categoriesBySlug: Map<string, Category> = new Map();
  private childrenByParentId: Map<string, string[]> = new Map();
  private rootCategoryIds: string[] = [];

  constructor(categories: Category[] = []) {
    this.buildHierarchy(categories);
  }

  public buildHierarchy(categories: Category[]): CategoryAnomalyReport {
    this.categoriesById.clear();
    this.categoriesBySlug.clear();
    this.childrenByParentId.clear();
    this.rootCategoryIds = [];

    const nameMap = new Map<string, string[]>();
    const slugMap = new Map<string, string[]>();
    const missingParents: Array<{ categoryId: string; missingParentId: string }> = [];

    // 1. Index all categories
    for (const cat of categories) {
      this.categoriesById.set(cat.id, cat);

      const normalizedSlug = cat.slug.toLowerCase();
      this.categoriesBySlug.set(normalizedSlug, cat);

      // Track duplicate names
      const normName = cat.name.trim().toLowerCase();
      const existingNameIds = nameMap.get(normName) || [];
      existingNameIds.push(cat.id);
      nameMap.set(normName, existingNameIds);

      // Track duplicate slugs
      const existingSlugIds = slugMap.get(normalizedSlug) || [];
      existingSlugIds.push(cat.id);
      slugMap.set(normalizedSlug, existingSlugIds);
    }

    // 2. Build parent-child graph
    for (const cat of categories) {
      if (!cat.parentId) {
        this.rootCategoryIds.push(cat.id);
      } else {
        if (!this.categoriesById.has(cat.parentId)) {
          missingParents.push({ categoryId: cat.id, missingParentId: cat.parentId });
          // Promote to root so it's not permanently lost
          this.rootCategoryIds.push(cat.id);
        } else {
          const children = this.childrenByParentId.get(cat.parentId) || [];
          children.push(cat.id);
          this.childrenByParentId.set(cat.parentId, children);
        }
      }
    }

    // 3. Detect circular references
    const circularReferences: string[] = [];
    for (const [id] of this.categoriesById) {
      const visited = new Set<string>();
      let currentId: string | null = id;
      while (currentId) {
        if (visited.has(currentId)) {
          circularReferences.push(id);
          break;
        }
        visited.add(currentId);
        const parentCategory: Category | undefined = this.categoriesById.get(currentId);
        currentId = parentCategory?.parentId || null;
      }
    }

    const duplicateNames = Array.from(nameMap.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([name, ids]) => ({ name, ids }));

    const duplicateSlugs = Array.from(slugMap.entries())
      .filter(([, ids]) => ids.length > 1)
      .map(([slug, ids]) => ({ slug, ids }));

    return {
      duplicateNames,
      duplicateSlugs,
      missingParents,
      circularReferences,
      orphanCount: missingParents.length,
    };
  }

  public getCategoryById(id: string): Category | undefined {
    return this.categoriesById.get(id);
  }

  public getCategoryBySlug(slug: string): Category | undefined {
    return this.categoriesBySlug.get(slug.toLowerCase());
  }

  public findCategoriesByName(query: string): Category[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const results: Category[] = [];
    for (const cat of this.categoriesById.values()) {
      if (cat.name.toLowerCase().includes(q)) {
        results.push(cat);
      }
    }
    return results;
  }

  public getSubcategories(parentId: string): Category[] {
    const childIds = this.childrenByParentId.get(parentId) || [];
    return childIds.map((id) => this.categoriesById.get(id)!).filter(Boolean);
  }

  public getBreadcrumb(categoryId: string): Category[] {
    const breadcrumb: Category[] = [];
    let currentId: string | null = categoryId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const cat = this.categoriesById.get(currentId);
      if (!cat) break;
      breadcrumb.unshift(cat);
      currentId = cat.parentId;
    }
    return breadcrumb;
  }

  public getTree(): CategoryHierarchyNode[] {
    const buildNode = (catId: string, level: number): CategoryHierarchyNode | null => {
      const cat = this.categoriesById.get(catId);
      if (!cat) return null;

      const childIds = this.childrenByParentId.get(catId) || [];
      const children = childIds
        .map((id) => buildNode(id, level + 1))
        .filter((node): node is CategoryHierarchyNode => node !== null);

      return {
        ...cat,
        level,
        children,
      };
    };

    return this.rootCategoryIds
      .map((id) => buildNode(id, 0))
      .filter((node): node is CategoryHierarchyNode => node !== null);
  }

  public getAll(): Category[] {
    return Array.from(this.categoriesById.values());
  }

  public size(): number {
    return this.categoriesById.size;
  }
}

interface RawCategoryApi {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  parentId?: string | null;
  image?: string | null;
  banner?: string | null;
  isActive?: boolean;
  productCount?: number;
}

/**
 * Normalizes raw category from Dwell Mart live API into strictly typed Category
 */
export function mapLiveApiCategoryToCategory(rawInput: Record<string, unknown>, syncTimestamp: string): Category {
  const raw = rawInput as unknown as RawCategoryApi;
  const id = String(raw._id || raw.id || '');
  const name = String(raw.name || '').trim();
  const slug = String(raw.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
  const parentId = raw.parentId && raw.parentId !== 'null' ? String(raw.parentId) : null;

  return {
    id,
    name,
    parentId,
    slug,
    url: `https://dwellmart.in/category/${slug}`,
    imageUrl: raw.image || raw.banner || null,
    isActive: raw.isActive !== false,
    productCount: typeof raw.productCount === 'number' ? raw.productCount : 0,
    source: 'VERIFIED_LIVE_DATA' as SourceClassification,
    lastSynced: syncTimestamp,
  };
}
