#!/usr/bin/env node

import { processXmlFile } from './index'
import path from 'path'
import { Command } from 'commander'

// Initialiseer command line interface
const program = new Command()

program
  .name('ez-xml-parser')
  .description('EzPayload XML Parser voor het importeren van artikelen en artikelgroepen')
  .version('1.0.0')

program
  .argument('<bestandspad>', 'Pad naar het XML bestand om te parsen')
  .option('-v, --verbose', 'Toon gedetailleerde logging informatie', false)
  .option('-d, --dry-run', 'Voer een dry run uit zonder data op te slaan in de database', false)
  .action(async (bestandspad, options) => {
    try {
      // Zorg voor een absoluut pad
      const absolutePath = path.resolve(bestandspad)
      console.log(`=== EzPayload XML Parser ===`)
      
      // Start het parsen en opslaan
      await processXmlFile(absolutePath, {
        verbose: options.verbose,
        dryRun: options.dryRun
      })
      
      console.log('XML verwerking succesvol afgerond.')
    } catch (error) {
      console.error('Er is een fout opgetreden:', error)
      process.exit(1)
    }
  })

// Parse command line argumenten
program.parse(process.argv)
