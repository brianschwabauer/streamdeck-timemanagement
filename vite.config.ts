import type { UserConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const config: UserConfig = {
	plugins: [
		svelte(),
		{
			name: 'html',
			enforce: 'post',
			transformIndexHtml: (html) =>
				html
					.replace(
						/<script type="module" crossorigin src="([^"]+)"><\/script>/g,
						'<script defer src=".$1"></script>',
					)
					.replace(
						/<link rel="stylesheet" href="([^"]+)">/g,
						'<link rel="stylesheet" href=".$1">',
					),
		},
	],
	publicDir: 'assets',
	envDir: './',
	envPrefix: 'PUBLIC_',
	build: {
		outDir: 'dist/com.brianschwabauer.streamdeck.sdPlugin',
		assetsInlineLimit: 999999999,
		sourcemap: true,
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
				format: 'es',
				entryFileNames: '[name].js',
				assetFileNames: '[name].[ext]',
				chunkFileNames: '[name].[ext]',
			},
		},
	},
};

export default config;
