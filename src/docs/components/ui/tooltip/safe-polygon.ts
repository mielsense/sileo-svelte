const CURSOR_SPEED_THRESHOLD = 0.1;
const CURSOR_SPEED_THRESHOLD_SQUARED = CURSOR_SPEED_THRESHOLD * CURSOR_SPEED_THRESHOLD;
const LANDING_GRACE_MS = 40;
const POLYGON_BUFFER = 2;

export type TooltipSafePolygonSide = 'bottom' | 'left' | 'right' | 'top';

type SafePolygonOptions = {
    floating: HTMLElement;
    leaveX: number;
    leaveY: number;
    onClose: () => void;
    onLanding: () => void;
    reference: HTMLElement;
    side: TooltipSafePolygonSide;
};

type Point = readonly [x: number, y: number];

function contains(element: HTMLElement, target: EventTarget | null): boolean {
    return target instanceof Node && element.contains(target);
}

function isInsideAxisAlignedRect(
    x: number,
    y: number,
    firstX: number,
    firstY: number,
    secondX: number,
    secondY: number
): boolean {
    return (
        x >= Math.min(firstX, secondX) &&
        x <= Math.max(firstX, secondX) &&
        y >= Math.min(firstY, secondY) &&
        y <= Math.max(firstY, secondY)
    );
}

function isInsidePolygon(x: number, y: number, points: readonly Point[]): boolean {
    let inside = false;
    for (let index = 0, previous = points.length - 1; index < points.length; previous = index++) {
        const [currentX, currentY] = points[index] ?? [0, 0];
        const [previousX, previousY] = points[previous] ?? [0, 0];
        if (
            currentY >= y !== previousY >= y &&
            x <= ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX
        ) {
            inside = !inside;
        }
    }
    return inside;
}

function getTrough(
    side: TooltipSafePolygonSide,
    reference: DOMRect,
    floating: DOMRect
): readonly [number, number, number, number] {
    const overlapLeft = Math.max(reference.left, floating.left);
    const overlapRight = Math.min(reference.right, floating.right);
    const overlapTop = Math.max(reference.top, floating.top);
    const overlapBottom = Math.min(reference.bottom, floating.bottom);

    switch (side) {
        case 'top':
            return [overlapLeft, floating.bottom, overlapRight, reference.top];
        case 'bottom':
            return [overlapLeft, reference.bottom, overlapRight, floating.top];
        case 'left':
            return [floating.right, overlapTop, reference.left, overlapBottom];
        case 'right':
            return [reference.right, overlapTop, floating.left, overlapBottom];
    }
}

function getPolygon(side: TooltipSafePolygonSide, leaveX: number, leaveY: number, floating: DOMRect): readonly Point[] {
    switch (side) {
        case 'top':
            return [
                [leaveX - POLYGON_BUFFER, leaveY + 1],
                [leaveX + POLYGON_BUFFER, leaveY + 1],
                [floating.right, floating.bottom - 1],
                [floating.left, floating.bottom - 1]
            ];
        case 'bottom':
            return [
                [leaveX - POLYGON_BUFFER, leaveY - 1],
                [leaveX + POLYGON_BUFFER, leaveY - 1],
                [floating.right, floating.top + 1],
                [floating.left, floating.top + 1]
            ];
        case 'left':
            return [
                [leaveX + 1, leaveY - POLYGON_BUFFER],
                [leaveX + 1, leaveY + POLYGON_BUFFER],
                [floating.right - 1, floating.bottom],
                [floating.right - 1, floating.top]
            ];
        case 'right':
            return [
                [leaveX - 1, leaveY - POLYGON_BUFFER],
                [leaveX - 1, leaveY + POLYGON_BUFFER],
                [floating.left + 1, floating.bottom],
                [floating.left + 1, floating.top]
            ];
    }
}

function movedAwayFromPopup(side: TooltipSafePolygonSide, x: number, y: number, reference: DOMRect): boolean {
    switch (side) {
        case 'top':
            return y >= reference.bottom - 1;
        case 'bottom':
            return y <= reference.top + 1;
        case 'left':
            return x >= reference.right - 1;
        case 'right':
            return x <= reference.left + 1;
    }
}

/**
 * Guards pointer travel between an attached trigger and its Shards popup.
 * The geometry follows the public behavior of Shards' safe polygon without importing internals.
 */
export function createTooltipSafePolygon(options: SafePolygonOptions): {
    destroy(): void;
    pointermove(event: PointerEvent): void;
} {
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastCursorTime = performance.now();
    let landingTimer: ReturnType<typeof setTimeout> | undefined;
    let destroyed = false;

    const clearLandingTimer = (): void => {
        if (landingTimer !== undefined) clearTimeout(landingTimer);
        landingTimer = undefined;
    };

    const destroy = (): void => {
        destroyed = true;
        clearLandingTimer();
    };

    const close = (): void => {
        if (destroyed) return;
        destroy();
        options.onClose();
    };

    const isMovingSlowly = (x: number, y: number): boolean => {
        const currentTime = performance.now();
        const elapsed = currentTime - lastCursorTime;
        if (lastX === null || lastY === null || elapsed === 0) {
            lastX = x;
            lastY = y;
            lastCursorTime = currentTime;
            return false;
        }
        const deltaX = x - lastX;
        const deltaY = y - lastY;
        const distanceSquared = deltaX * deltaX + deltaY * deltaY;
        const thresholdSquared = elapsed * elapsed * CURSOR_SPEED_THRESHOLD_SQUARED;
        lastX = x;
        lastY = y;
        lastCursorTime = currentTime;
        return distanceSquared < thresholdSquared;
    };

    return {
        destroy,
        pointermove(event) {
            if (destroyed) return;
            clearLandingTimer();

            if (contains(options.floating, event.target)) {
                destroy();
                options.onLanding();
                return;
            }
            if (contains(options.reference, event.target)) {
                destroy();
                options.onLanding();
                return;
            }

            const { clientX, clientY } = event;
            const referenceRect = options.reference.getBoundingClientRect();
            const floatingRect = options.floating.getBoundingClientRect();

            if (movedAwayFromPopup(options.side, clientX, clientY, referenceRect)) {
                close();
                return;
            }

            const trough = getTrough(options.side, referenceRect, floatingRect);
            if (isInsideAxisAlignedRect(clientX, clientY, ...trough)) return;

            if (isMovingSlowly(clientX, clientY)) {
                close();
                return;
            }

            if (
                !isInsidePolygon(
                    clientX,
                    clientY,
                    getPolygon(options.side, options.leaveX, options.leaveY, floatingRect)
                )
            ) {
                close();
                return;
            }

            landingTimer = setTimeout(close, LANDING_GRACE_MS);
        }
    };
}
