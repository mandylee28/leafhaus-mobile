// Jest config for the Leafhaus Expo app.
// The jest-expo preset wires up the Babel transform and the React Native
// test environment, so plain `npm test` just works. Test files live in
// src/__tests__/ and end in .test.js.
module.exports = {
  preset: 'jest-expo',
  // Loads jest.setup.js before every test file (see that file for why).
  setupFiles: ['./jest.setup.js'],
  // Make sure the Babel transform runs on React Native, Expo and the
  // testing library. All three ship ESM / TypeScript source that Jest
  // cannot load raw, so they must be transformed, not skipped.
  // This is the same list the jest-expo preset uses, with
  // @testing-library added.
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|@testing-library))',
    'node_modules/react-native-reanimated/plugin/',
  ],
  // Coverage gate: fail the run if any metric drops below 100%, so the
  // 100% coverage the project holds is enforced (in CI, which runs with
  // --coverage), not just reported. Plain `npm test` without --coverage
  // is unaffected.
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
