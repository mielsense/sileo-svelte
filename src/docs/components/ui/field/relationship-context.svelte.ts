import { getContext, hasContext, setContext } from 'svelte';

export class FieldRelationshipState {
    #defaultControlId: string;
    #readControlId: () => string | undefined;
    #readLabelId: () => string | undefined;
    #readDescribedBy: () => string | undefined;
    #writeLabelId: (id: string | undefined) => void;
    #writeDescribedBy: (ids: string | undefined) => void;
    #writeControlId: (id: string | undefined) => void;
    #readDisabled: () => boolean;
    #readInvalid: () => boolean;
    #readName: () => string | undefined;
    #initialControlIds: string[] = [];
    #controlRegistrations: { id: string; token: symbol }[] = [];
    #initialLabelId: string | undefined;
    // Registration bookkeeping is read only by imperative registration methods.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    #initialMessageIds = new Set<string>();
    constructor(
        defaultControlId: string,
        readControlId: () => string | undefined,
        writeControlId: (id: string | undefined) => void,
        readLabelId: () => string | undefined,
        writeLabelId: (id: string | undefined) => void,
        readDescribedBy: () => string | undefined,
        writeDescribedBy: (ids: string | undefined) => void,
        readName: () => string | undefined = () => undefined,
        readDisabled: () => boolean = () => false,
        readInvalid: () => boolean = () => false
    ) {
        this.#defaultControlId = defaultControlId;
        this.#readControlId = readControlId;
        this.#writeControlId = writeControlId;
        this.#readLabelId = readLabelId;
        this.#writeLabelId = writeLabelId;
        this.#readDescribedBy = readDescribedBy;
        this.#writeDescribedBy = writeDescribedBy;
        this.#readName = readName;
        this.#readDisabled = readDisabled;
        this.#readInvalid = readInvalid;
    }

    get controlId(): string | undefined {
        return this.#readControlId();
    }

    get defaultControlId(): string {
        return this.#defaultControlId;
    }

    resolveDefaultControlId(fallbackId: string): string {
        const defaultIsRegistered =
            this.#initialControlIds.includes(this.#defaultControlId) ||
            this.#controlRegistrations.some(({ id }) => id === this.#defaultControlId);
        return defaultIsRegistered ? fallbackId : this.#defaultControlId;
    }

    get describedBy(): string | undefined {
        return this.#readDescribedBy();
    }

    get disabled(): boolean {
        return this.#readDisabled();
    }

    get invalid(): boolean {
        return this.#readInvalid();
    }

    get name(): string | undefined {
        return this.#readName();
    }

    get labelledBy(): string | undefined {
        return this.#readLabelId();
    }

    registerInitialControlId(id: string): void {
        if (!this.#initialControlIds.includes(id)) this.#initialControlIds.push(id);
        this.#syncControlId();
    }

    registerControlId(id: string): () => void {
        const initialIndex = this.#initialControlIds.indexOf(id);
        if (initialIndex !== -1) this.#initialControlIds.splice(initialIndex, 1);
        const token = Symbol();
        this.#controlRegistrations.push({ id, token });
        this.#syncControlId();
        return () => {
            const index = this.#controlRegistrations.findIndex((registration) => registration.token === token);
            if (index === -1) return;
            this.#controlRegistrations.splice(index, 1);
            this.#syncControlId();
        };
    }

    #syncControlId(): void {
        this.#writeControlId(this.#controlRegistrations[0]?.id ?? this.#initialControlIds[0] ?? this.#defaultControlId);
    }

    registerInitialLabelId(id: string): void {
        this.#initialLabelId = id;
        this.#writeLabelId(id);
    }

    registerLabelId(id: string): () => void {
        if (this.#initialLabelId === id) this.#initialLabelId = undefined;
        this.#writeLabelId(id);
        return () => {
            if (this.#readLabelId() === id) this.#writeLabelId(undefined);
        };
    }

    registerInitialMessageId(id: string): void {
        this.#initialMessageIds.add(id);
        if (!this.#readMessageIds().includes(id)) {
            this.#writeMessageIds([...this.#readMessageIds(), id]);
        }
    }

    registerMessageId(id: string): () => void {
        this.#initialMessageIds.delete(id);
        if (!this.#readMessageIds().includes(id)) {
            this.#writeMessageIds([...this.#readMessageIds(), id]);
        }
        return () => {
            this.#writeMessageIds(this.#readMessageIds().filter((messageId) => messageId !== id));
        };
    }

    #readMessageIds(): string[] {
        return this.#readDescribedBy()?.split(/\s+/).filter(Boolean) ?? [];
    }

    #writeMessageIds(ids: string[]): void {
        this.#writeDescribedBy(ids.join(' ') || undefined);
    }
}

const fieldRelationshipContextKey = Symbol('coss-field-relationship');

export function setFieldRelationshipContext(context: FieldRelationshipState): FieldRelationshipState {
    return setContext(fieldRelationshipContextKey, context);
}

export function getFieldRelationshipContext(): FieldRelationshipState | undefined {
    return hasContext(fieldRelationshipContextKey)
        ? getContext<FieldRelationshipState>(fieldRelationshipContextKey)
        : undefined;
}
