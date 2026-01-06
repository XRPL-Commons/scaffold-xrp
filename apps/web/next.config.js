/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Empty turbopack config to allow webpack config to work with Next.js 16+
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Add polyfills for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        events: require.resolve("events/"),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
      };

      // Add alias to resolve modules
      config.resolve.alias = {
        ...config.resolve.alias,
        events: require.resolve("events/"),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
      };

      // Provide global Buffer
      const webpack = require("webpack");
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;
