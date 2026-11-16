// Vite pages read import.meta.env. Jest compiles them for Node, which has no Vite env.
module.exports = function importMetaEnv() {
  return {
    visitor: {
      MetaProperty(path) {
        const { meta, property } = path.node;
        if (meta.name === "import" && property.name === "meta") {
          path.replaceWithSourceString("({ env: { VITE_GOOGLE_MAPS_API_KEY: '' } })");
        }
      },
    },
  };
};
