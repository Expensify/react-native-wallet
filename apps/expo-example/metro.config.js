const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Paths
const root = path.resolve(__dirname, '../..');
const commonAppPath = path.resolve(__dirname, '../common-app');
const projectNodeModules = path.resolve(__dirname, 'node_modules');

// Watch the common-app and root folders for changes
config.watchFolders = [root, commonAppPath];

// Block React/react-native from root's node_modules to prevent duplicates
const blockList = [
  new RegExp(`${root.replace(/\//g, '\\/')}/node_modules/react/.*`),
  new RegExp(`${root.replace(/\//g, '\\/')}/node_modules/react-native/.*`),
];

// Configure resolver
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [projectNodeModules],
  extraNodeModules: {
    // Resolve wallet from the root (development version)
    '@expensify/react-native-wallet': root,
    // Force React and react-native to resolve from local node_modules
    'react': path.resolve(projectNodeModules, 'react'),
    'react-native': path.resolve(projectNodeModules, 'react-native'),
  },
  blockList: config.resolver.blockList
    ? [...config.resolver.blockList, ...blockList]
    : blockList,
};

module.exports = config;
