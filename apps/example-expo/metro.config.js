const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const projectNodeModules = path.resolve(__dirname, 'node_modules');

const config = getDefaultConfig(__dirname);

// Watch the parent library for changes
config.watchFolders = [root];

// Block React/react-native from parent's node_modules to prevent duplicates
const blockList = [
  new RegExp(`${root}/node_modules/react/.*`),
  new RegExp(`${root}/node_modules/react-native/.*`),
];

// Ensure React and react-native resolve to a single copy
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [projectNodeModules],
  extraNodeModules: {
    'react': path.resolve(projectNodeModules, 'react'),
    'react-native': path.resolve(projectNodeModules, 'react-native'),
  },
  blockList: config.resolver.blockList
    ? [...config.resolver.blockList, ...blockList]
    : blockList,
};

module.exports = config;
