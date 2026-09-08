<script lang="ts">
    import { onMount } from 'svelte';
    import { Button } from '$docs/components/ui/button/index.js';
    import CodeCopyButton from './CodeCopyButton.svelte';

    let { packageName = 'sileo-svelte' }: { packageName?: string } = $props();
    const commands = $derived({
        npm: `npm install ${packageName}`,
        pnpm: `pnpm add ${packageName}`,
        bun: `bun add ${packageName}`,
        yarn: `yarn add ${packageName}`
    });
    type PackageManager = keyof typeof commands;
    const managers: PackageManager[] = ['npm', 'pnpm', 'bun', 'yarn'];
    const storageKey = 'sileo-package-manager';
    let manager = $state<PackageManager>('npm');

    onMount(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (managers.includes(saved as PackageManager)) manager = saved as PackageManager;
        } catch {
            // The chooser still works when browser storage is unavailable.
        }
    });

    function select(next: PackageManager) {
        manager = next;
        try {
            localStorage.setItem(storageKey, next);
        } catch {
            // Storage is optional, including in private browsing.
        }
    }
</script>

<div class="code-frame install-command">
    <div class="code-toolbar">
        <div
            class="package-managers"
            role="group"
            aria-label="Package manager"
        >
            {#each managers as name (name)}
                <Button
                    size="xs"
                    variant={manager === name ? 'secondary' : 'ghost'}
                    aria-pressed={manager === name}
                    onclick={() => select(name)}>{name}</Button
                >
            {/each}
        </div>
        {#key manager}
            <CodeCopyButton
                value={commands[manager]}
                language={manager}
            />
        {/key}
    </div>
    <pre><code>{commands[manager]}</code></pre>
</div>

<style>
    .package-managers {
        display: flex;
        min-width: 0;
        gap: 2px;
    }

    .code-toolbar {
        padding-inline-start: 7px;
    }

    .install-command pre {
        white-space: pre;
    }
</style>
