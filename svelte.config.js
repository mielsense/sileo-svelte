import adapter from '@sveltejs/adapter-vercel';
import { escapeSvelte, mdsvex } from 'mdsvex';
import { codeToHtml } from 'shiki';

const codeThemes = { light: 'github-light', dark: 'github-dark' };
const languageAliases = {
    js: 'javascript',
    sh: 'bash',
    shell: 'bash',
    ts: 'typescript'
};

async function highlightCode(code, language = 'text') {
    const label = language.replace(/[^a-z0-9+#.-]/gi, '') || 'text';
    const requestedLanguage = languageAliases[label] ?? label;
    let html;

    try {
        html = await codeToHtml(code, {
            lang: requestedLanguage,
            themes: codeThemes,
            defaultColor: 'dark'
        });
    } catch {
        html = await codeToHtml(code, {
            lang: 'text',
            themes: codeThemes,
            defaultColor: 'dark'
        });
    }

    const labelledHtml = html.replace('<pre class="shiki', `<pre data-language="${label}" class="shiki`);
    return `{@html \`${escapeSvelte(labelledHtml)}\`}`;
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
    extensions: ['.svelte', '.md'],
    preprocess: mdsvex({
        extensions: ['.md'],
        highlight: {
            highlighter: highlightCode
        }
    }),
    kit: {
        adapter: adapter(),
        alias: {
            $docs: 'src/docs'
        }
    }
};

export default config;
