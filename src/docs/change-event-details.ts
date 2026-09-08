export type ChangeEventDetails<Reason extends string, CustomProperties extends object = object> = Reason extends string
    ? {
          readonly event: Event;
          readonly isCanceled: boolean;
          readonly isPropagationAllowed: boolean;
          readonly reason: Reason;
          readonly trigger: Element | undefined;
          allowPropagation(): void;
          cancel(): void;
      } & CustomProperties
    : never;

export type GenericEventDetails<Reason extends string, CustomProperties extends object = object> = Reason extends string
    ? {
          readonly event: Event;
          readonly reason: Reason;
      } & CustomProperties
    : never;

export type SelectionChangeEventReason =
    | 'cancel-open'
    | 'chip-remove-press'
    | 'clear-press'
    | 'close-press'
    | 'escape-key'
    | 'focus-out'
    | 'input-change'
    | 'input-clear'
    | 'item-press'
    | 'list-navigation'
    | 'none'
    | 'outside-press'
    | 'trigger-press'
    | 'window-resize';

export type SelectionChangeEventDetails = ChangeEventDetails<SelectionChangeEventReason>;
export type SelectionHighlightEventDetails = GenericEventDetails<
    'keyboard' | 'none' | 'pointer',
    { readonly index: number }
>;

export function createChangeEventDetails<Reason extends string, CustomProperties extends object = object>(
    reason: Reason,
    event?: Event,
    trigger?: Element,
    customProperties?: CustomProperties
): ChangeEventDetails<Reason, CustomProperties> {
    let canceled = false;
    let propagationAllowed = false;

    return {
        allowPropagation() {
            propagationAllowed = true;
        },
        cancel() {
            canceled = true;
        },
        event: event ?? new Event('base-ui'),
        get isCanceled() {
            return canceled;
        },
        get isPropagationAllowed() {
            return propagationAllowed;
        },
        reason,
        trigger,
        ...(customProperties ?? ({} as CustomProperties))
    } as ChangeEventDetails<Reason, CustomProperties>;
}

export function createGenericEventDetails<Reason extends string, CustomProperties extends object = object>(
    reason: Reason,
    event?: Event,
    customProperties?: CustomProperties
): GenericEventDetails<Reason, CustomProperties> {
    return {
        event: event ?? new Event('base-ui'),
        reason,
        ...(customProperties ?? ({} as CustomProperties))
    } as GenericEventDetails<Reason, CustomProperties>;
}
