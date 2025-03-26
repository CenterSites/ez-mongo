import fs from 'fs'
import sax from 'sax'
import { Article, ArticleGroup } from './models/types'
import { ParserState, handleOpenTag, handleCloseTag, handleText, XMLNode } from './sax-handler'
import payload from 'payload'
import { config as dotenvConfig } from 'dotenv'
import payloadConfig from '../payload.config'

// Laad omgevingsvariabelen
dotenvConfig()

/**
 * Main functie voor het parsen van een XML bestand
 */
export async function parseXml(filePath: string, verbose = false): Promise<{
  articleGroups: Map<string, ArticleGroup>,
  articles: Map<string, Article>
}> {
  console.log(`Starten met parsen van XML bestand: ${filePath}`)
  
  return new Promise((resolve, reject) => {
    // Valideer bestandspad
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`Bestand bestaat niet: ${filePath}`))
    }

    // Prepareer SAX parser
    const parser = sax.parser(true, {
      trim: true,
      normalize: true,
      lowercase: true,
      xmlns: true,
      position: true
    })

    // Prepareer state
    const state = new ParserState()

    // Configureer parser event handlers
    parser.onopentag = (node) => {
      const nodeObj: XMLNode = {
        name: node.name,
        attributes: node.attributes || {}
      }
      
      if (verbose) {
        console.log(`Open tag: ${node.name}`)
      }
      
      handleOpenTag(state, nodeObj)
    }

    parser.onclosetag = (name: string) => {
      if (verbose) {
        console.log(`Close tag: ${name}`)
      }
      
      handleCloseTag(state, name)
    }

    parser.ontext = (text: string) => {
      if (verbose && text.trim()) {
        console.log(`Text: ${text.trim()}`)
      }
      
      handleText(state, text)
    }

    parser.onerror = (err: Error) => {
      console.error('XML parser error:', err)
      reject(err)
    }

    parser.onend = () => {
      console.log(`XML parsen voltooid.`)
      console.log(`Gevonden: ${state.articleGroups.size} artikelgroepen en ${state.articles.size} artikelen.`)
      
      resolve({
        articleGroups: state.articleGroups,
        articles: state.articles
      })
    }

    // Start parsing
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8')
      parser.write(fileContent).close()
    } catch (error) {
      console.error('Fout bij het parsen van XML:', error)
      reject(error)
    }
  })
}

/**
 * Functie voor het opslaan van geparseerde data in de database
 */
export async function saveToDatabase(
  articleGroups: Map<string, ArticleGroup>,
  articles: Map<string, Article>
): Promise<{
  savedArticleGroups: number,
  savedArticles: number
}> {
  console.log('Starten met opslaan van data in de database...')

  try {
    // Initialiseer PayloadCMS
    await payload.init({
      config: payloadConfig,
      local: true
    })

    console.log('PayloadCMS geïnitialiseerd')

    // Resultaat bijhouden
    let savedArticleGroups = 0
    let savedArticles = 0

    // Opslaan van artikelgroepen
    console.log(`Opslaan van ${articleGroups.size} artikelgroepen...`)
    
    // De externe ID naar interne ID mapping
    const externalToInternalIds = new Map<string, string>()
    
    // Eerst alle artikelgroepen opslaan
    for (const [externalId, group] of articleGroups.entries()) {
      try {
        // Controleer of deze artikelgroep al bestaat
        const existingGroups = await payload.find({
          collection: 'ez_articleGroups',
          where: {
            externalId: {
              equals: externalId
            }
          }
        })

        let groupId: string
        
        if (existingGroups.docs.length > 0) {
          // Update bestaande groep
          const updatedGroup = await payload.update({
            collection: 'ez_articleGroups',
            id: existingGroups.docs[0].id,
            data: {
              name: group.name,
              externalId: externalId
            }
          })
          groupId = updatedGroup.id
          console.log(`Artikelgroep bijgewerkt: ${group.name}`)
        } else {
          // Maak nieuwe groep aan
          const newGroup = await payload.create({
            collection: 'ez_articleGroups',
            data: {
              name: group.name,
              externalId: externalId
            }
          })
          groupId = newGroup.id
          console.log(`Nieuwe artikelgroep aangemaakt: ${group.name}`)
        }
        
        // Bewaar de mapping
        externalToInternalIds.set(externalId, groupId)
        savedArticleGroups++
      } catch (error) {
        console.error(`Fout bij opslaan van artikelgroep ${group.name}:`, error)
      }
    }

    // Nu alle artikelen opslaan
    console.log(`Opslaan van ${articles.size} artikelen...`)
    for (const [_, article] of articles.entries()) {
      try {
        // Zoek de interne ID van de artikelgroep
        let groupId = null
        if (article.groupId && externalToInternalIds.has(article.groupId)) {
          groupId = externalToInternalIds.get(article.groupId)
        }

        // Pas de assets aan naar het juiste formaat voor PayloadCMS
        const formattedAssets = article.assets?.map(asset => ({
          type: asset.type === 'image' ? 'image' : asset.type === 'document' ? 'document' : 'other',
          url: asset.url,
          originalFile: asset.originalFile
        }));

        // Controleer of dit artikel al bestaat
        const existingArticles = await payload.find({
          collection: 'ez_articles',
          where: {
            sku: {
              equals: article.sku
            }
          }
        })

        if (existingArticles.docs.length > 0) {
          // Update bestaand artikel
          await payload.update({
            collection: 'ez_articles',
            id: existingArticles.docs[0].id,
            data: {
              sku: article.sku,
              typeNumber: article.typeNumber,
              description: article.description,
              group: groupId,
              specifications: article.specifications,
              assets: formattedAssets,
              classifications: article.classifications
              // Gerelateerde artikelen komen in een later stadium
            }
          })
          console.log(`Artikel bijgewerkt: ${article.sku}`)
        } else {
          // Maak nieuw artikel aan
          await payload.create({
            collection: 'ez_articles',
            data: {
              sku: article.sku,
              typeNumber: article.typeNumber,
              description: article.description,
              group: groupId,
              specifications: article.specifications,
              assets: formattedAssets,
              classifications: article.classifications
              // Gerelateerde artikelen komen in een later stadium
            }
          })
          console.log(`Nieuw artikel aangemaakt: ${article.sku}`)
        }
        
        savedArticles++
      } catch (error) {
        console.error(`Fout bij opslaan van artikel ${article.sku}:`, error)
      }
    }

    console.log(`Database operaties voltooid. Opgeslagen: ${savedArticleGroups} artikelgroepen en ${savedArticles} artikelen.`)
    return { savedArticleGroups, savedArticles }
  } catch (error) {
    console.error('Fout bij het initialiseren van de database:', error)
    throw error
  }
}

/**
 * Functie voor het verwerken van XML bestanden en opslaan in de database
 */
export async function processXmlFile(filePath: string, options: { 
  verbose?: boolean,
  dryRun?: boolean 
} = {}): Promise<void> {
  try {
    console.log(`Verwerken van XML bestand: ${filePath}`)
    console.log(`Opties: verbose=${options.verbose}, dryRun=${options.dryRun}`)
    
    const { articleGroups, articles } = await parseXml(filePath, options.verbose)
    
    if (options.dryRun) {
      console.log('Dit is een dry run. Data wordt niet opgeslagen in de database.')
      console.log(`Geparseerde data: ${articleGroups.size} artikelgroepen en ${articles.size} artikelen.`)
      
      // Toon enkele voorbeelden
      if (articleGroups.size > 0) {
        const example = [...articleGroups.values()][0]
        console.log('Voorbeeld artikelgroep:', JSON.stringify(example, null, 2))
      }
      
      if (articles.size > 0) {
        const example = [...articles.values()][0]
        console.log('Voorbeeld artikel:', JSON.stringify(example, null, 2))
      }
    } else {
      const result = await saveToDatabase(articleGroups, articles)
      console.log(`Verwerking voltooid. Opgeslagen in database: ${result.savedArticleGroups} artikelgroepen en ${result.savedArticles} artikelen.`)
    }
  } catch (error) {
    console.error('Fout bij het verwerken van het XML bestand:', error)
    throw error
  }
}
