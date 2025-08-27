import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const devMode: boolean = process.env.NODE_ENV !== 'production';
export default defineConfig({
  plugins: [
    // This plugin is only used in development mode to copy the wasm files to the assets folder. The rollupOptions below
    // don't run when running the dev server.
    devMode &&
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/box2d-wasm/dist/es/*.wasm',
            dest: 'assets/',
          },
        ],
      }),
  ],
  build: {
    // The build will copy the wasm files to the assets folder with a hash in the filename. We don't want that so we need to override the output options.
    rollupOptions: {
      output: {
        // biome-ignore lint/nursery/useExplicitType: No need for the type here.
        assetFileNames: (chunkInfo) => {
          console.log('running');
          const isBox2dWasmAsset = chunkInfo.originalFileNames.filter((name) => name.includes('box2d-wasm')).length > 0;
          if (isBox2dWasmAsset) {
            return 'assets/[name].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
  esbuild: {},
});
