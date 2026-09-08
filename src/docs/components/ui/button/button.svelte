<script
    module
    lang="ts"
>
    import type { ClassValue } from 'clsx';
    import type { Snippet } from 'svelte';
    import type { SvelteHTMLElements } from 'svelte/elements';
    import { cn } from '$docs/utils.js';

    export type ButtonVariant =
        'default' | 'destructive' | 'destructive-outline' | 'ghost' | 'link' | 'outline' | 'secondary';

    export type ButtonSize =
        'default' | 'icon' | 'icon-lg' | 'icon-sm' | 'icon-xl' | 'icon-xs' | 'lg' | 'sm' | 'xl' | 'xs';

    export type ButtonProps = Omit<SvelteHTMLElements['button'], 'children' | 'class' | 'onclick'> & {
        as?: keyof HTMLElementTagNameMap;
        children?: Snippet;
        class?: string;
        download?: boolean | string;
        href?: string;
        loading?: boolean;
        onclick?: (event: MouseEvent) => void;
        ref?: HTMLElement | null;
        rel?: string;
        size?: ButtonSize;
        target?: string;
        variant?: ButtonVariant;
    };

    const baseClass =
        "relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium text-base outline-none transition-shadow before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 data-loading:select-none data-loading:text-transparent sm:text-sm [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-mx-0.5 [&_svg]:shrink-0";

    const sizeClasses: Record<ButtonSize, string> = {
        default: 'h-9 px-[calc(--spacing(3)-1px)] sm:h-8',
        icon: 'size-9 sm:size-8',
        'icon-lg': 'size-10 sm:size-9',
        'icon-sm': 'size-8 sm:size-7',
        'icon-xl': "size-11 sm:size-10 [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        'icon-xs':
            "size-7 rounded-md before:rounded-[calc(var(--radius-md)-1px)] sm:size-6 not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-4 sm:not-in-data-[slot=input-group]:[&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-10 px-[calc(--spacing(3.5)-1px)] sm:h-9',
        sm: 'h-8 gap-1.5 px-[calc(--spacing(2.5)-1px)] sm:h-7',
        xl: "h-11 px-[calc(--spacing(4)-1px)] text-lg sm:h-10 sm:text-base [&_svg:not([class*='size-'])]:size-5 sm:[&_svg:not([class*='size-'])]:size-4.5",
        xs: "h-7 gap-1 rounded-md px-[calc(--spacing(2)-1px)] text-sm before:rounded-[calc(var(--radius-md)-1px)] sm:h-6 sm:text-xs [&_svg:not([class*='size-'])]:size-4 sm:[&_svg:not([class*='size-'])]:size-3.5"
    };

    const variantClasses: Record<ButtonVariant, string> = {
        default:
            'not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-primary bg-primary text-primary-foreground shadow-primary/24 shadow-xs hover:bg-primary/90 data-pressed:bg-primary/90 *:data-[slot=button-loading-indicator]:text-primary-foreground [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none',
        destructive:
            'not-disabled:inset-shadow-[0_1px_--theme(--color-white/16%)] border-destructive bg-destructive text-white shadow-destructive/24 shadow-xs hover:bg-destructive/90 data-pressed:bg-destructive/90 *:data-[slot=button-loading-indicator]:text-white [:active,[data-pressed]]:inset-shadow-[0_1px_--theme(--color-black/8%)] [:disabled,:active,[data-pressed]]:shadow-none',
        'destructive-outline':
            'border-input bg-popover not-dark:bg-clip-padding text-destructive-foreground shadow-xs/5 not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] hover:border-destructive/32 hover:bg-destructive/4 data-pressed:border-destructive/32 data-pressed:bg-destructive/4 *:data-[slot=button-loading-indicator]:text-foreground dark:bg-input/32 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none',
        ghost: 'border-transparent text-foreground hover:bg-accent data-pressed:bg-accent *:data-[slot=button-loading-indicator]:text-foreground',
        link: 'border-transparent text-foreground underline-offset-4 hover:underline data-pressed:underline *:data-[slot=button-loading-indicator]:text-foreground',
        outline:
            'border-input bg-popover not-dark:bg-clip-padding text-foreground shadow-xs/5 not-disabled:not-active:not-data-pressed:before:shadow-[0_1px_--theme(--color-black/4%)] hover:bg-accent/50 data-pressed:bg-accent/50 *:data-[slot=button-loading-indicator]:text-foreground dark:bg-input/32 dark:data-pressed:bg-input/64 dark:hover:bg-input/64 dark:not-disabled:before:shadow-[0_-1px_--theme(--color-white/2%)] dark:not-disabled:not-active:not-data-pressed:before:shadow-[0_-1px_--theme(--color-white/6%)] [:disabled,:active,[data-pressed]]:shadow-none',
        secondary:
            'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 data-pressed:bg-secondary/90 *:data-[slot=button-loading-indicator]:text-secondary-foreground [:active,[data-pressed]]:bg-secondary/80'
    };

    export function buttonVariants({
        class: className,
        size = 'default',
        variant = 'default'
    }: {
        class?: ClassValue;
        size?: ButtonSize;
        variant?: ButtonVariant;
    } = {}): string {
        return cn(baseClass, sizeClasses[size], variantClasses[variant], className);
    }
</script>

<script lang="ts">
    import { Button as ButtonPrimitive } from '@shardsui/svelte/button';
    import type { Component } from 'svelte';
    import type { HTMLAnchorAttributes } from 'svelte/elements';
    import Spinner from '../spinner/spinner.svelte';

    type ForwardedButtonPrimitiveProps = {
        [key: string]: unknown;
        as?: keyof HTMLElementTagNameMap;
        children?: Snippet;
        class?: string;
        disabled?: boolean;
        onclick?: (event: MouseEvent) => void;
        ref?: HTMLElement | null;
        type?: 'button' | 'reset' | 'submit';
    };

    const StyledButtonPrimitive = ButtonPrimitive as unknown as Component<ForwardedButtonPrimitiveProps, object, 'ref'>;

    let {
        as,
        children,
        class: className,
        disabled = false,
        download,
        href,
        loading = false,
        onclick,
        ref = $bindable(null),
        rel,
        size = 'default',
        target,
        type = 'button',
        variant = 'default',
        ...props
    }: ButtonProps = $props();

    const tag = $derived(as ?? (href ? 'a' : 'button'));
    const isDisabled = $derived(Boolean(loading || disabled));
    const classes = $derived(buttonVariants({ class: className, size, variant }));
    const anchorProps = $derived(props as HTMLAnchorAttributes);
    const nativeType = $derived(type ?? 'button');
    const nativeTypeProps = $derived(tag === 'button' ? { type: nativeType } : {});
    const loadingAriaProps = $derived(loading ? { 'aria-disabled': true as const } : {});
    const onclickProps = $derived(onclick ? { onclick } : {});

    function handleLinkClick(event: MouseEvent) {
        if (isDisabled) {
            event.preventDefault();
            return;
        }
        onclick?.(event);
    }
</script>

<!-- Navigation URLs are resolved by the component's caller. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
{#if tag === 'a'}
    <a
        bind:this={ref}
        aria-disabled={isDisabled || undefined}
        class={classes}
        data-loading={loading ? '' : undefined}
        data-slot="button"
        {download}
        {href}
        onclick={handleLinkClick}
        {rel}
        tabindex={isDisabled ? -1 : undefined}
        {target}
        {...anchorProps}
    >
        {@render children?.()}
        {#if loading}
            <Spinner
                class="pointer-events-none absolute"
                data-slot="button-loading-indicator"
            />
        {/if}
    </a>
{:else}
    <StyledButtonPrimitive
        as={tag}
        bind:ref
        {...loadingAriaProps}
        class={classes}
        data-loading={loading ? '' : undefined}
        data-slot="button"
        disabled={isDisabled}
        {...onclickProps}
        {...nativeTypeProps}
        {...props}
    >
        {@render children?.()}
        {#if loading}
            <Spinner
                class="pointer-events-none absolute"
                data-slot="button-loading-indicator"
            />
        {/if}
    </StyledButtonPrimitive>
{/if}
