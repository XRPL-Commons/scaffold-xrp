import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Header is a required generator-facing component name.
    'vue/multi-word-component-names': 'off',
  },
})
