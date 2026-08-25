import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
    plugins: [tailwindcss(), sveltekit()],
    ...(mode === 'test' ? { resolve: { conditions: ['browser'] } } : {}),
    server: {
        fs: {
            allow: ['.']
        }
    },
    test: {
        environment: 'happy-dom',
        setupFiles: ['./tests/setup.ts']
    }
}));
