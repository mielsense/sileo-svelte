import type { Attachment } from 'svelte/attachments';

export function reconcileAriaRelationship(
    attribute: 'aria-describedby' | 'aria-labelledby',
    value: string | null | undefined
): Attachment<HTMLInputElement> {
    return (node) => {
        if (value === undefined) return;

        if (value !== null) {
            node.setAttribute(attribute, value);
            return () => {
                if (node.getAttribute(attribute) === value) node.removeAttribute(attribute);
            };
        }

        const remove = () => {
            if (node.hasAttribute(attribute)) node.removeAttribute(attribute);
        };
        remove();
        const observer = new MutationObserver(remove);
        observer.observe(node, { attributeFilter: [attribute], attributes: true });
        return () => observer.disconnect();
    };
}
