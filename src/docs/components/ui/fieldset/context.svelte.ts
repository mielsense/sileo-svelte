import { getContext, setContext, untrack } from 'svelte';

export type FieldsetCompositionState = {
    disabled: boolean;
};

export type FieldsetCompositionContext = {
    readonly disabled: boolean;
    readonly legendId: string | undefined;
    readonly state: FieldsetCompositionState;
    registerLegend: (id: string) => () => void;
};

const fieldsetCompositionContextKey = Symbol('coss-fieldset-composition');

function getOptionalFieldsetCompositionContext(): FieldsetCompositionContext | undefined {
    return getContext<FieldsetCompositionContext | undefined>(fieldsetCompositionContextKey);
}

function setFieldsetCompositionContext(context: FieldsetCompositionContext): void {
    setContext(fieldsetCompositionContextKey, context);
}

export function getFieldsetCompositionContext(): FieldsetCompositionContext {
    const context = getOptionalFieldsetCompositionContext();
    if (!context) {
        throw new Error('COSS: Fieldset.Legend must be rendered inside Fieldset.Root or Field.Root.');
    }
    return context;
}

export function createFieldsetCompositionContext(
    getDisabled: () => boolean,
    ownsContext: () => boolean = () => true,
    getDefaultLegendId: () => string | undefined = () => undefined
): FieldsetCompositionContext {
    const parent = getOptionalFieldsetCompositionContext();
    let legendIds = $state<string[]>([]);

    const isDisabled = () => getDisabled() || (parent?.disabled ?? false);

    const context: FieldsetCompositionContext = {
        get disabled() {
            return isDisabled();
        },
        get legendId() {
            if (!ownsContext() && parent) return parent.legendId;
            return legendIds[0] ?? getDefaultLegendId();
        },
        get state() {
            return { disabled: isDisabled() };
        },
        registerLegend(id) {
            if (!ownsContext() && parent) return parent.registerLegend(id);
            untrack(() => {
                legendIds = [...legendIds.filter((value) => value !== id), id];
            });
            return () => {
                untrack(() => {
                    legendIds = legendIds.filter((value) => value !== id);
                });
            };
        }
    };

    setFieldsetCompositionContext(context);
    return context;
}
