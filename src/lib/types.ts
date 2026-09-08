import type { Snippet } from 'svelte';

export type SileoState = 'success' | 'loading' | 'error' | 'warning' | 'info' | 'action';

export interface SileoClasses {
    toast?: string;
    background?: string;
    title?: string;
    description?: string;
    badge?: string;
    button?: string;
}

export interface SileoStyles {
    /** CSS backdrop-filter applied inside the animated toast silhouette. */
    backdropFilter?: string;
    titleColor?: string;
    descriptionColor?: string;
    badgeColor?: string;
    badgeBackground?: string;
    buttonColor?: string;
    buttonBackground?: string;
    buttonHoverBackground?: string;
}

export interface SileoButton {
    title: string;
    onClick: (id: string) => void;
}

export const SILEO_POSITIONS = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right'
] as const;

export type SileoPosition = (typeof SILEO_POSITIONS)[number];

export interface SileoOptions {
    id?: string;
    title?: string;
    description?: Snippet | string;
    position?: SileoPosition;
    duration?: number | null;
    icon?: Snippet | null;
    classes?: SileoClasses;
    styles?: SileoStyles;
    fill?: string;
    roundness?: number;
    autopilot?: boolean | { expand?: number; collapse?: number };
    button?: SileoButton | null;
}
