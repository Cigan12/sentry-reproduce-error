/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const chalk = require('chalk');
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');
const ESLintPlugin = require('eslint-webpack-plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const moduleExports = (phase, defaultConfig) => {
  console.log(`${chalk.cyan('info')}  - APP_ENV=${process.env.APP_ENV}`);
  console.log(`${chalk.cyan('info')}  - NODE_ENV=${process.env.NODE_ENV}`);
  return withBundleAnalyzer({
    ...defaultConfig,
    distDir: '../../dist/.next',
    generateBuildId,
    reactStrictMode: true,
    webpack: webpack(phase),
    poweredByHeader: false,
  });
};

const generateBuildId = process.env.CI_COMMIT_SHORT_SHA
  ? () => {
      return process.env.CI_COMMIT_SHORT_SHA;
    }
  : undefined;

const webpack = (phase) => (config) => {
  // Note: we provide webpack above so you should not `require` it
  config.module.rules.push({
    test: [
      phase === PHASE_DEVELOPMENT_SERVER // reduce build time on 1.5s
        ? /styled\.(t|j)sx?$/
        : /\.(t|j)sx?$/,
    ],
    loader: 'stylelint-custom-processor-loader',
    exclude: [/node_modules/, /rewriteFramesHelper.js/],
  });
  config.plugins.push(
    new ESLintPlugin({
      extensions: ['ts', 'tsx', 'js', 'jsx'],
      cache: phase === PHASE_DEVELOPMENT_SERVER,
      cacheLocation: 'node_modules/.cache/.eslintcache',
      lintDirtyModulesOnly: phase === PHASE_DEVELOPMENT_SERVER,
    }),
  );

  return config;
};

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: false,
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = withSentryConfig(moduleExports, sentryWebpackPluginOptions);
