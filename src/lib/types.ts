import type { Snippet } from 'svelte';

export const SILEO_POSITIONS = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right'
] as const;

export type SileoPosition = (typeof SILEO_POSITIONS)[number];
export type SileoState = 'success' | 'loading' | 'error' | 'warning' | 'info' | 'default';

export interface SileoAction {
    label: string;
    onClick: (id: string) => void;
}

export interface SileoClassNames {
    root?: string;
    title?: string;
    description?: string;
    badge?: string;
    action?: string;
}

export interface SileoStyleVars {
    background?: string;
    foreground?: string;
    mutedForeground?: string;
    badgeBackground?: string;
    badgeForeground?: string;
    actionBackground?: string;
    actionForeground?: string;
    borderColor?: string;
}

export interface SileoToastOptions {
    id?: string;
    title?: string;
    description?: string | Snippet;
    state?: SileoState;
    duration?: number | null;
    position?: SileoPosition;
    icon?: Snippet | null;
    action?: SileoAction;
    closeable?: boolean;
    expanded?: boolean;
    classNames?: SileoClassNames;
    styles?: SileoStyleVars;
}

export type SileoInput = string | SileoToastOptions;
