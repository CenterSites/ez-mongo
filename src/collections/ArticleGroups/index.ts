import { CollectionConfig } from 'payload/types'

const ArticleGroups: CollectionConfig = {
  slug: 'ez_articleGroups',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'externalId'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Naam',
    },
    {
      name: 'externalId',
      type: 'text',
      required: false,
      label: 'Extern ID',
      admin: {
        description: 'ID uit het externe systeem, wordt gebruikt voor import mapping',
      },
    },
  ],
}

export default ArticleGroups
