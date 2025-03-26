import { CollectionConfig } from 'payload/types'

const Articles: CollectionConfig = {
  slug: 'ez_articles',
  admin: {
    useAsTitle: 'sku',
    defaultColumns: ['sku', 'typeNumber', 'description'],
  },
  fields: [
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      label: 'Artikelnummer',
    },
    {
      name: 'typeNumber',
      type: 'text',
      label: 'Typenummer',
    },
    {
      name: 'description',
      type: 'text',
      label: 'Omschrijving',
    },
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'ez_articleGroups',
      label: 'Artikelgroep',
      admin: {
        description: 'De artikelgroep waar dit artikel toe behoort',
      },
    },
    {
      name: 'classifications',
      type: 'array',
      label: 'Classificaties',
      admin: {
        description: 'Classificaties waar dit artikel toe behoort',
      },
      fields: [
        {
          name: 'classification',
          type: 'text',
          label: 'Classificatie',
          admin: {
            description: 'Classificatie ID of naam',
          },
        },
        {
          name: 'externalId',
          type: 'text',
          label: 'Extern ID',
          admin: {
            description: 'ID van de classificatie in het externe systeem',
          },
        },
      ],
    },
    {
      name: 'specifications',
      type: 'array',
      label: 'Specificaties',
      admin: {
        description: 'Specificaties en eigenschappen van het artikel',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Naam',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          label: 'Waarde',
        },
        {
          name: 'unit',
          type: 'text',
          label: 'Eenheid',
        },
        {
          name: 'propertyType',
          type: 'text',
          label: 'Type',
        },
      ],
    },
    {
      name: 'assets',
      type: 'array',
      label: 'Assets',
      admin: {
        description: 'Afbeeldingen en documenten bij het artikel',
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Afbeelding', value: 'image' },
            { label: 'Document', value: 'document' },
            { label: 'Overig', value: 'other' },
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
          admin: {
            description: 'De URL naar de afbeelding of het document',
          },
        },
        {
          name: 'originalFile',
          type: 'text',
          label: 'Origineel bestand',
          admin: {
            description: 'Combinatie van OriginalFile en OriginalExtension, bijv. "10460.jpg"',
          },
        },
      ],
    },
    {
      name: 'relatedArticles',
      type: 'array',
      label: 'Gerelateerde artikelen',
      admin: {
        description: 'Artikelen die gerelateerd zijn aan dit artikel',
      },
      fields: [
        {
          name: 'article',
          type: 'relationship',
          relationTo: 'ez_articles',
          label: 'Artikel',
        },
        {
          name: 'relationType',
          type: 'select',
          options: [
            { label: 'Onderdeel', value: 'component' },
            { label: 'Accessoire', value: 'accessory' },
            { label: 'Alternatief', value: 'alternative' },
            { label: 'Overig', value: 'other' },
          ],
          label: 'Type relatie',
        },
      ],
    },
  ],
}

export default Articles
