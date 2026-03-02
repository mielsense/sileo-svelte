declare module 'motion' {
    export function animate(
        element: Element,
        keyframes: Keyframe[] | PropertyIndexedKeyframes,
        options?: KeyframeAnimationOptions | Record<string, unknown>
    ): { finished: Promise<unknown>; cancel: () => void };
}
