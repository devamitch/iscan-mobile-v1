const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const path = require('path')

const defaultConfig = getDefaultConfig(__dirname)

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/assets': path.resolve(__dirname, 'src/assets'),
      '@/ui': path.resolve(__dirname, 'src/ui'),
      '@/features': path.resolve(__dirname, 'src/features'),
      '@/navigation': path.resolve(__dirname, 'src/navigation'),
      '@/store': path.resolve(__dirname, 'src/store'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/database': path.resolve(__dirname, 'src/database'),
      '@/themes': path.resolve(__dirname, 'src/themes'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/config': path.resolve(__dirname, 'src/config'),
      '@/types': path.resolve(__dirname, 'src/types'),
    },
  },
  watchFolders: [path.resolve(__dirname, 'src')],
}

module.exports = mergeConfig(defaultConfig, config)
