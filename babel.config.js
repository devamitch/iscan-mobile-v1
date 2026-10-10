module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    "@babel/plugin-transform-export-namespace-from",
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@/assets': './src/assets',
          '@/ui': './src/ui',
          '@/features': './src/features',
          '@/navigation': './src/navigation',
          '@/store': './src/store',
          '@/services': './src/services',
          '@/database': './src/database',
          '@/themes': './src/themes',
          '@/hooks': './src/hooks',
          '@/utils': './src/utils',
          '@/config': './src/config',
          '@/types': './src/types',
        },
      },
    ],
    'react-native-reanimated/plugin', // Must be last
  ],
  env: {
    production: {
      plugins: [
        // 'react-native-paper/babel'
      ],
    },
  },
}
