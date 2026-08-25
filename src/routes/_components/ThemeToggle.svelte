<script lang="ts">
    import { onMount } from 'svelte';

    type Theme = 'dark' | 'light';
    let theme = $state<Theme>('dark');

    function applyTheme(next: Theme) {
        theme = next;
        document.documentElement.dataset.theme = next;
        document.documentElement.style.colorScheme = next;
        try {
            localStorage.setItem('sileo-theme', next);
        } catch {
            // The selected theme still applies when storage is unavailable.
        }
    }

    onMount(() => {
        theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    });
</script>

<button
    class="icon-button theme-toggle"
    type="button"
    aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
    title={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
    onclick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
>
    {#if theme === 'dark'}
        <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
        >
            <circle
                cx="10"
                cy="10"
                r="3.25"
            />
            <path
                d="M10 1.75v2M10 16.25v2M1.75 10h2M16.25 10h2M4.17 4.17l1.42 1.42M14.41 14.41l1.42 1.42M15.83 4.17l-1.42 1.42M5.59 14.41l-1.42 1.42"
            />
        </svg>
    {:else}
        <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
        >
            <path d="M16.5 12.36A6.7 6.7 0 0 1 7.64 3.5 6.7 6.7 0 1 0 16.5 12.36Z" />
        </svg>
    {/if}
</button>
