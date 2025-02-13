import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginBasicSsl } from '@rsbuild/plugin-basic-ssl';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginBasicSsl()
  ],
  html: {
    template: './index.html',
    title: 'Champion Trader',
    favicon: 'public/favicon.ico'
  },
  source: {
    define: {
      'process.env.RSBUILD_WS_URL': JSON.stringify(process.env.RSBUILD_WS_URL),
      'process.env.RSBUILD_WS_PUBLIC_PATH': JSON.stringify(process.env.RSBUILD_WS_PUBLIC_PATH),
      'process.env.RSBUILD_WS_PROTECTED_PATH': JSON.stringify(process.env.RSBUILD_WS_PROTECTED_PATH),
      'process.env.RSBUILD_REST_URL': JSON.stringify(process.env.RSBUILD_REST_URL),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.RSBUILD_SSE_PUBLIC_PATH': JSON.stringify(process.env.RSBUILD_SSE_PUBLIC_PATH),
      'process.env.RSBUILD_SSE_PROTECTED_PATH': JSON.stringify(process.env.RSBUILD_SSE_PROTECTED_PATH),
    },
    alias: {
      '@': './src',
    },
  },
  server: {
    port: 4113,
    host: 'localhost',
    strictPort: true
  },
  output: {
    copy: [
      {
        from: path.resolve(
          __dirname,
          "@deriv-com/smartcharts-champion/dist/"
        ),
        to: "js/smartcharts/",
      },
      {
        from: path.resolve(
          __dirname,
          "@deriv-com/smartcharts-champion/dist/chart/assets"
        ),
        to: "assets",
      },
    ],
  },
});
