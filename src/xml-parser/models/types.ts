/**
 * Definities van types voor de XML parser
 */

/**
 * Type definities voor een artikelgroep
 */
export interface ArticleGroup {
  name: string;
  externalId: string;
  specifications: Specification[];
}

/**
 * Type definities voor een artikel
 */
export interface Article {
  sku: string;
  typeNumber?: string;
  description?: string;
  groupId?: string;
  externalId?: string;
  specifications: ArticleSpecification[];
  assets: Asset[];
  classifications: Classification[];
  relatedArticles: RelatedArticle[];
}

/**
 * Type definities voor een specificatie
 */
export interface Specification {
  name: string;
  value: string;
}

/**
 * Type definities voor een artikelspecificatie
 */
export interface ArticleSpecification {
  name: string;
  value: string;
  unit?: string;
  propertyType?: string;
}

/**
 * Type definities voor een asset (afbeelding, document, etc.)
 */
export interface Asset {
  type: string;
  url: string;
  originalFile: string;
}

/**
 * Type definities voor een classificatie
 */
export interface Classification {
  type: string;
  value: string;
}

/**
 * Type definities voor een gerelateerd artikel
 */
export interface RelatedArticle {
  sku: string;
  relationship: string;
}
