<script lang="ts">
    import { onDestroy } from 'svelte';
    import PreviewPanel from './PreviewPanel.svelte';
    import Disclosure from '../_components/Disclosure.svelte';
    import { Button } from '$docs/components/ui/button/index.js';
    import { Input } from '$docs/components/ui/input/index.js';
    import * as Select from '$docs/components/ui/select/index.js';
    import { sileo, Toaster, type SileoState, type SileoPosition } from '$lib/index.js';
    import { store } from '$lib/store.svelte.js';

    let toastState = $state<SileoState>('success');
    let position = $state<SileoPosition>('top-right');
    let title = $state('Changes saved');
    let description = $state('Your draft is ready to share.');
    let duration = $state(6000);
    let roundness = $state(16);
    let action = $state('');
    let fill = $state('#1c1c1e');
    let appearance = $state('solid');
    const appearances = [
        { value: 'solid', label: 'Solid' },
        { value: 'glass', label: 'Frosted glass' }
    ];
    let latest = $state<string>();
    let viewMode = $state<'preview' | 'code'>('preview');
    const states: { value: SileoState; label: string }[] = [
        'success',
        'loading',
        'error',
        'warning',
        'info',
        'action'
    ].map((value) => ({ value: value as SileoState, label: value[0].toUpperCase() + value.slice(1) }));
    const positions: { value: SileoPosition; label: string }[] = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right'
    ].map((value) => ({
        value: value as SileoPosition,
        label: value[0].toUpperCase() + value.slice(1).replace('-', ' ')
    }));
    const active = $derived(store.toasts.filter((toast) => !toast.exiting));
    const canUpdate = $derived(active.some((toast) => toast.id === latest));
    const options = $derived({
        title,
        description,
        position,
        duration: Math.max(0, Number(duration) || 0) || null,
        roundness: Math.max(0, Math.min(40, Number(roundness) || 0)),
        fill,
        ...(appearance === 'glass' ? { styles: { backdropFilter: 'blur(16px) saturate(1.4)' } } : {})
    });
    const source = $derived.by(() => {
        const serialized = JSON.stringify(options, null, 4).replaceAll('<', '\\u003c');
        const withAction = action
            ? serialized.slice(0, -2) +
              `,\n    "button": { title: ${JSON.stringify(action).replaceAll('<', '\\u003c')}, onClick: (id) => sileo.dismiss(id) }\n}`
            : serialized;
        return (
            `<script lang="ts">\n    import { sileo, Toaster } from 'sileo-svelte';\n    import 'sileo-svelte/styles.css';\n\n    function notify() {\n        sileo.${toastState}(${withAction.replaceAll('\n', '\n        ')});\n    }\n<` +
            `/script>\n\n<Toaster />\n<button onclick={notify}>Show toast</button>`
        );
    });
    function show() {
        viewMode = 'preview';
        latest = sileo[toastState]({
            ...options,
            ...(action ? { button: { title: action, onClick: (id: string) => sileo.dismiss(id) } } : {})
        });
    }
    function update() {
        if (latest && canUpdate)
            sileo.update(latest, {
                ...options,
                state: toastState,
                styles:
                    appearance === 'glass'
                        ? { backdropFilter: 'blur(16px) saturate(1.4)' }
                        : { backdropFilter: 'none' },
                button: action ? { title: action, onClick: (id: string) => sileo.dismiss(id) } : null
            });
    }
    onDestroy(() => sileo.clear());
</script>

<div class="builder-layout">
    <aside
        class="builder-controls"
        aria-label="Toast settings"
    >
        <div class="builder-field">
            <Select.Root
                items={states}
                value={toastState}
                onValueChange={(value) => {
                    if (value) toastState = value;
                }}
            >
                <Select.Label>State</Select.Label><Select.Trigger><Select.Value /></Select.Trigger>
                <Select.Popup alignItemWithTrigger={false}
                    >{#each states as item (item.value)}<Select.Item value={item.value}>{item.label}</Select.Item
                        >{/each}</Select.Popup
                >
            </Select.Root>
        </div>
        <label class="builder-field">Title<Input bind:value={title} /></label>
        <label class="builder-field">Description<Input bind:value={description} /></label>
        <div class="builder-field">
            <Select.Root
                items={positions}
                value={position}
                onValueChange={(value) => {
                    if (value) position = value;
                }}
            >
                <Select.Label>Position</Select.Label><Select.Trigger><Select.Value /></Select.Trigger>
                <Select.Popup alignItemWithTrigger={false}
                    >{#each positions as item (item.value)}<Select.Item value={item.value}>{item.label}</Select.Item
                        >{/each}</Select.Popup
                >
            </Select.Root>
        </div>
        <div class="builder-advanced">
            <Disclosure label="More options">
                <div class="advanced-fields">
                    <div class="builder-pair">
                        <label class="builder-field"
                            >Duration, ms<Input
                                type="number"
                                min="0"
                                max="60000"
                                step="500"
                                bind:value={duration}
                            /></label
                        >
                        <label class="builder-field"
                            >Roundness<Input
                                type="number"
                                min="0"
                                max="40"
                                bind:value={roundness}
                            /></label
                        >
                    </div>
                    <p class="field-hint">Set duration to 0 to keep it on screen.</p>
                    <label class="builder-field"
                        >Action label<Input
                            placeholder="No action"
                            bind:value={action}
                        /></label
                    >
                    <div class="builder-field">
                        <Select.Root
                            items={appearances}
                            value={appearance}
                            onValueChange={(value) => {
                                if (value) {
                                    appearance = value;
                                    fill = value === 'glass' ? 'rgb(28 28 30 / 65%)' : '#1c1c1e';
                                }
                            }}
                        >
                            <Select.Label>Appearance</Select.Label><Select.Trigger><Select.Value /></Select.Trigger>
                            <Select.Popup alignItemWithTrigger={false}
                                >{#each appearances as item (item.value)}<Select.Item value={item.value}
                                        >{item.label}</Select.Item
                                    >{/each}</Select.Popup
                            >
                        </Select.Root>
                    </div>
                    <label class="builder-field">Fill color<Input bind:value={fill} /></label>
                </div>
            </Disclosure>
        </div>
        <div class="builder-buttons">
            <Button onclick={show}>Show toast</Button><Button
                variant="outline"
                disabled={!canUpdate}
                onclick={update}>Update last</Button
            >
        </div>
    </aside>
    <section
        class="builder-result"
        aria-label="Toast preview"
    >
        <PreviewPanel
            {source}
            bind:viewMode
            label="toast code"
            onClear={() => sileo.clear()}
            clearDisabled={!active.length}
        >
            <div
                class="builder-canvas"
                class:glass-scene={appearance === 'glass'}
                data-builder-preview
            >
                {#if !active.length}<div class="canvas-instruction"><span>Show a toast to try it.</span></div>{/if}
                <Toaster offset={24} />
            </div>
        </PreviewPanel>
    </section>
</div>
