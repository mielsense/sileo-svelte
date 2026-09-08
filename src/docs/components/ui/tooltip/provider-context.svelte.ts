import { getContext, hasContext, setContext } from 'svelte';

export type TooltipAttachmentProviderMember = {
    close(): void;
    setInstant(value: boolean): void;
};

export type TooltipAttachmentProviderOptions = {
    closeDelay: number | undefined;
    delay: number | undefined;
    timeout: number;
};

export type TooltipAttachmentProviderContext = {
    claim(member: TooltipAttachmentProviderMember): void;
    destroy(): void;
    getCloseDelay(localDelay: number | undefined): number;
    getOpenDelay(localDelay: number | undefined): number;
    remove(member: TooltipAttachmentProviderMember): void;
    release(member: TooltipAttachmentProviderMember): void;
};

const PROVIDER_CONTEXT = Symbol('coss-tooltip-attachment-provider');

export function createTooltipAttachmentProviderContext(
    options: () => TooltipAttachmentProviderOptions
): TooltipAttachmentProviderContext {
    let current: TooltipAttachmentProviderMember | null = null;
    let instantWindow = false;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    const clearResetTimer = (): void => {
        if (resetTimer !== undefined) clearTimeout(resetTimer);
        resetTimer = undefined;
    };

    const reset = (): void => {
        clearResetTimer();
        current?.setInstant(false);
        current = null;
        instantWindow = false;
    };

    return {
        claim(member) {
            clearResetTimer();
            const previous = current;
            const tookOver = previous !== null && previous !== member;
            current = member;
            instantWindow = true;
            member.setInstant(tookOver);
            if (tookOver) {
                previous.setInstant(true);
                previous.close();
            }
        },
        destroy: reset,
        getCloseDelay(localDelay) {
            return localDelay ?? options().closeDelay ?? 0;
        },
        getOpenDelay(localDelay) {
            if (current !== null || instantWindow) return 0;
            return localDelay ?? options().delay ?? 600;
        },
        remove(member) {
            if (current === member) reset();
        },
        release(member) {
            if (current !== member) return;
            member.setInstant(false);
            instantWindow = true;
            clearResetTimer();
            const timeout = options().timeout;
            if (timeout === 0) {
                reset();
                return;
            }
            resetTimer = setTimeout(reset, timeout);
        }
    };
}

export function getTooltipAttachmentProviderContext(): TooltipAttachmentProviderContext | undefined {
    return hasContext(PROVIDER_CONTEXT) ? getContext<TooltipAttachmentProviderContext>(PROVIDER_CONTEXT) : undefined;
}

export function setTooltipAttachmentProviderContext(context: TooltipAttachmentProviderContext): void {
    setContext(PROVIDER_CONTEXT, context);
}
