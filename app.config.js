module.exports = ({ config }) => ({
  ...config,
  name: config.name || 'A word',
  slug: config.slug || 'aword',
  version: config.version || '1.0.0',
  extra: {
    eas: {
      // Replace this with your actual EAS project ID.
      // Run `eas init` locally to get your project ID,
      // or find it at https://expo.dev/projects
      projectId: process.env.EAS_PROJECT_ID || 'YOUR_EAS_PROJECT_ID_HERE',
    },
  },
  cli: {
    appVersionSource: 'local',
  },
});
