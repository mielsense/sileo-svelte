declare module 'motion' {
    export function animate(
        element: Element,
        keyframes: Keyframe[] | PropertyIndexedKeyframes,
        options?: KeyframeAnimationOptions
    ): { finished: Promise<unknown>; cancel: () => void };
}
