module.exports = ({ config }) => ({
  ...config,
  name: config.name || 'A word',
  slug: config.slug || 'aword',
  version: config.version || '1.0.0',
  extra: {
    eas: {
      projectId: '5d909088-fc8f-42ce-a720-1dd7d9d0ac47',
    },
  },
});
