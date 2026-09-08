import { Field as FieldPrimitive } from '@shardsui/svelte/field';
import type { ComponentProps } from 'svelte';

export type FieldValidityProps = ComponentProps<typeof FieldPrimitive.Validity>;

export type { FieldControlProps } from './field-control.svelte';
export { default as Control, default as FieldControl } from './field-control.svelte';
export type { FieldDescriptionProps } from './field-description.svelte';
export { default as Description, default as FieldDescription } from './field-description.svelte';
export type { FieldErrorProps } from './field-error.svelte';
export { default as Error, default as FieldError } from './field-error.svelte';
export type { FieldItemProps } from './field-item.svelte';
export { default as FieldItem, default as Item } from './field-item.svelte';
export type { FieldLabelProps } from './field-label.svelte';
export { default as FieldLabel, default as Label } from './field-label.svelte';
export type { FieldRootProps } from './field-root.svelte';
export { default as Field, default as FieldRoot, default as Root } from './field-root.svelte';

const FieldValidity: typeof FieldPrimitive.Validity = FieldPrimitive.Validity;

export { FieldPrimitive, FieldValidity as Validity, FieldValidity };
