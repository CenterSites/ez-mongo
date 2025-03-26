import { Article, ArticleGroup, Asset, Classification, RelatedArticle, Specification, ArticleSpecification } from './models/types'
// We hebben geen expliciete sax import nodig

/**
 * Klasse voor het bijhouden van de huidige staat tijdens het parsen
 */
export class ParserState {
  path: string[] = []
  currentText = ''

  articleGroups: Map<string, ArticleGroup> = new Map()
  articles: Map<string, Article> = new Map()

  currentArticleGroup: ArticleGroup | null = null
  currentArticle: Article | null = null
  currentSpecification: Specification | null = null
  currentArticleSpecification: ArticleSpecification | null = null
  currentAsset: Asset | null = null
  currentClassification: Classification | null = null
  currentRelatedArticle: RelatedArticle | null = null

  // Voor het bijhouden van de huidige niveau diepte in de XML
  currentNodeDepth: number = 0
  isReadingName: boolean = false
  isReadingArticleGroup: boolean = false

  // Teller voor het genereren van unieke SKU's
  private skuCounter = 0

  /**
   * Genereert een unieke SKU voor artikelen zonder SKU
   */
  generateUniqueSku(): string {
    this.skuCounter++
    return `GEN-${Date.now()}-${this.skuCounter}`
  }

  /**
   * Voegt de tag toe aan het huidige pad
   */
  pushTag(tag: string): void {
    this.path.push(tag)
  }

  /**
   * Verwijdert de meest recente tag van het pad
   */
  popTag(): string {
    const tag = this.path.pop()
    return tag || ''
  }

  /**
   * Geeft het huidige pad terug
   */
  getCurrentPath(): string {
    return this.path.join('/')
  }

  /**
   * Reset de huidige tekst buffer
   */
  resetText(): void {
    this.currentText = ''
  }
}

/**
 * Interface voor XML tag node aangepast om compatibel te zijn met sax.js nodes
 */
export interface XMLNode {
  name: string;
  attributes: Record<string, string | number | boolean>;
}

/**
 * Handler voor de start van een XML tag
 */
export function handleOpenTag(state: ParserState, node: XMLNode): void {
  state.resetText();
  state.pushTag(node.name);
  
  const path = state.getCurrentPath();
  
  // Verhoog diepte voor node tracking
  state.currentNodeDepth++;
  
  if (path.endsWith('name')) {
    state.isReadingName = true;
  }
  
  if (path.endsWith('node')) {
    const nodeType = node.attributes.type as string || '';
    const externalId = node.attributes.id as string || '';
    
    if (nodeType === 'articlesgroup') {
      state.isReadingArticleGroup = true;
      state.currentArticleGroup = { 
        name: '', 
        externalId, 
        specifications: [] 
      };
    } else if (nodeType === 'article') {
      state.currentArticle = {
        sku: node.attributes.sku as string || state.generateUniqueSku(),
        typeNumber: node.attributes.typenumber as string || '',
        externalId: externalId,
        description: '',
        groupId: '',  // Dit wordt later ingesteld
        specifications: [],
        assets: [],
        classifications: [],
        relatedArticles: []
      };
      
      // Als we in een artikelgroep zijn, verbind dit artikel met de huidige groep
      if (state.isReadingArticleGroup && state.currentArticleGroup) {
        state.currentArticle.groupId = state.currentArticleGroup.externalId;
      }
    }
  }
  
  if (path.endsWith('specification')) {
    state.currentSpecification = {
      name: '',
      value: ''
    };
  }
  
  if (path.endsWith('articlespecification')) {
    state.currentArticleSpecification = {
      name: '',
      value: ''
    };
  }
  
  if (path.endsWith('asset')) {
    state.currentAsset = {
      type: 'image',  // Standaard type
      url: '',
      originalFile: ''
    };
    
    if (node.attributes.type) {
      state.currentAsset.type = node.attributes.type as string;
    }
  }
  
  if (path.endsWith('classification')) {
    state.currentClassification = {
      type: '',
      value: ''
    };
    
    if (node.attributes.type) {
      state.currentClassification.type = node.attributes.type as string;
    }
  }
  
  if (path.endsWith('relatedarticle')) {
    state.currentRelatedArticle = {
      sku: '',
      relationship: 'related'  // Standaard relatie type
    };
    
    if (node.attributes.relationship) {
      state.currentRelatedArticle.relationship = node.attributes.relationship as string;
    }
  }
}

/**
 * Handler voor het einde van een XML tag
 */
export function handleCloseTag(state: ParserState, tagName: string): void {
  const path = state.getCurrentPath();
  const text = state.currentText.trim();
  
  // Verlaag diepte na sluiten van een node
  state.currentNodeDepth--;
  
  // Reset nameReading flag wanneer we de name tag verlaten
  if (path.endsWith('name')) {
    state.isReadingName = false;
  }
  
  // Verwerk sluitende tags
  if (tagName === 'node') {
    if (state.isReadingArticleGroup && state.currentArticleGroup) {
      const articleGroup = state.currentArticleGroup;
      if (articleGroup.name && articleGroup.name.trim() !== '') {
        state.articleGroups.set(articleGroup.externalId, articleGroup);
      }
      
      // Reset artikelgroep vlag wanneer we de node verlaten
      if (state.currentNodeDepth === 0) {
        state.isReadingArticleGroup = false;
        state.currentArticleGroup = null;
      }
    }
    
    if (state.currentArticle) {
      const article = state.currentArticle;
      if (article.sku) {
        state.articles.set(article.sku, article);
      }
      
      // Reset huidig artikel wanneer we de node verlaten
      if (state.currentNodeDepth === 0) {
        state.currentArticle = null;
      }
    }
  }
  
  if (path.endsWith('name') && text) {
    if (state.isReadingArticleGroup && state.currentArticleGroup) {
      state.currentArticleGroup.name = text;
    } else if (state.currentArticle) {
      state.currentArticle.description = text;
    }
  }
  
  if (path.endsWith('specification') && state.currentSpecification) {
    if (state.currentArticleGroup) {
      state.currentArticleGroup.specifications.push(state.currentSpecification);
    }
    state.currentSpecification = null;
  }
  
  if (path.endsWith('specificationname') && text && state.currentSpecification) {
    state.currentSpecification.name = text;
  }
  
  if (path.endsWith('specificationvalue') && text && state.currentSpecification) {
    state.currentSpecification.value = text;
  }
  
  if (path.endsWith('articlespecification') && state.currentArticleSpecification) {
    if (state.currentArticle) {
      state.currentArticle.specifications.push(state.currentArticleSpecification);
    }
    state.currentArticleSpecification = null;
  }
  
  if (path.endsWith('articlespecificationname') && text && state.currentArticleSpecification) {
    state.currentArticleSpecification.name = text;
  }
  
  if (path.endsWith('articlespecificationvalue') && text && state.currentArticleSpecification) {
    state.currentArticleSpecification.value = text;
  }
  
  if (path.endsWith('asset') && state.currentAsset) {
    if (state.currentArticle) {
      state.currentArticle.assets.push(state.currentAsset);
    }
    state.currentAsset = null;
  }
  
  if (path.endsWith('asseturl') && text && state.currentAsset) {
    state.currentAsset.url = text;
  }
  
  if (path.endsWith('assetoriginalfile') && text && state.currentAsset) {
    state.currentAsset.originalFile = text;
  }
  
  if (path.endsWith('classification') && state.currentClassification) {
    if (state.currentArticle) {
      state.currentArticle.classifications.push(state.currentClassification);
    }
    state.currentClassification = null;
  }
  
  if (path.endsWith('classificationvalue') && text && state.currentClassification) {
    state.currentClassification.value = text;
  }
  
  if (path.endsWith('relatedarticle') && state.currentRelatedArticle) {
    if (state.currentArticle) {
      state.currentArticle.relatedArticles.push(state.currentRelatedArticle);
    }
    state.currentRelatedArticle = null;
  }
  
  if (path.endsWith('relatedarticlesku') && text && state.currentRelatedArticle) {
    state.currentRelatedArticle.sku = text;
  }
  
  // Reset de text buffer voor de volgende node
  state.resetText();
  state.popTag();
}

/**
 * Handler voor tekst in een XML node
 */
export function handleText(state: ParserState, text: string): void {
  // Voeg tekst toe aan de buffer
  state.currentText += text;
}
