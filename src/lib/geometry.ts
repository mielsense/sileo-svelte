export type PillAlignment = 'left' | 'center' | 'right';

export interface ToastGeometryInput {
    alignment: PillAlignment;
    baseHeight: number;
    blur: number;
    canvasWidth: number;
    expandedHeight: number;
    hasDescription: boolean;
    open: boolean;
    pillWidth: number;
}

export interface ToastGeometry {
    bodyHeight: number;
    canvasHeight: number;
    pillHeight: number;
    pillWidth: number;
    pillX: number;
    rootHeight: number;
}

export const minimumExpandedHeight = (baseHeight: number) => baseHeight * 2.25;

export function measuredExpandedHeight(baseHeight: number, contentHeight: number, hasDescription: boolean) {
    const minimum = minimumExpandedHeight(baseHeight);
    return hasDescription ? Math.max(minimum, baseHeight + contentHeight) : minimum;
}

export function resolveToastGeometry(input: ToastGeometryInput): ToastGeometry {
    const pillHeight = input.open ? input.baseHeight + input.blur * 3 : input.baseHeight;
    const pillWidth = Math.min(Math.max(input.pillWidth || input.baseHeight, input.baseHeight), input.canvasWidth);
    const pillX =
        input.alignment === 'right'
            ? input.canvasWidth - pillWidth
            : input.alignment === 'center'
              ? (input.canvasWidth - pillWidth) / 2
              : 0;
    const minimum = minimumExpandedHeight(input.baseHeight);
    const canvasHeight = input.hasDescription ? Math.max(input.expandedHeight, minimum) : input.baseHeight;

    return {
        bodyHeight: input.open ? Math.max(0, input.expandedHeight - input.baseHeight) : 0,
        canvasHeight,
        pillHeight,
        pillWidth,
        pillX,
        rootHeight: input.open ? input.expandedHeight : input.baseHeight
    };
}
