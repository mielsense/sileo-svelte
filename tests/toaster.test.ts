import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { readFile } from 'node:fs/promises';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Toaster, sileo } from '../src/lib/index.js';
import Sileo from '../src/lib/Sileo.svelte';
import { store } from '../src/lib/store.svelte.ts';

class ResizeObserverMock {
    static observers: ResizeObserverMock[] = [];

    private targets = new Set<Element>();

    constructor(private callback: ResizeObserverCallback) {
        ResizeObserverMock.observers.push(this);
    }

    observe(target: Element) {
        this.targets.add(target);
    }

    unobserve(target: Element) {
        this.targets.delete(target);
    }

    disconnect() {
        this.targets.clear();
    }

    static reset() {
        ResizeObserverMock.observers = [];
    }

    static resize(target: Element, width: number, height: number) {
        const entry = {
            target,
            contentRect: { width, height },
            borderBoxSize: [{ inlineSize: width, blockSize: height }]
        } as unknown as ResizeObserverEntry;

        for (const observer of ResizeObserverMock.observers) {
            if (observer.targets.has(target)) observer.callback([entry], observer as unknown as ResizeObserver);
        }
    }
}

function dispatchPointer(target: Element, type: string, clientY: number, pointerId = 1) {
    target.dispatchEvent(
        new PointerEvent(type, {
            bubbles: true,
            clientY,
            pointerId,
            pointerType: 'touch'
        })
    );
}

function stubHoverCapability(matches: boolean) {
    vi.stubGlobal(
        'matchMedia',
        vi.fn(() => ({
            matches,
            media: '(hover: hover) and (pointer: fine)',
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn()
        }))
    );
}

describe('Toaster', () => {
    beforeEach(() => {
        ResizeObserverMock.reset();
        vi.stubGlobal('ResizeObserver', ResizeObserverMock);
        stubHoverCapability(true);
        store.toasts = [];
        store.position = 'top-right';
        store.globalOptions = undefined;
    });

    afterEach(() => {
        cleanup();
        store.toasts = [];
        store.position = 'top-right';
        store.globalOptions = undefined;
    });

    test('renders a toast through Toaster', async () => {
        sileo.success('Saved');
        const { getByText } = render(Toaster);

        await tick();

        expect(getByText('Saved')).toBeTruthy();
    });

    test('applies position and global options from Toaster', async () => {
        render(Toaster, {
            position: 'bottom-left',
            options: { fill: '#123456', roundness: 24 }
        });

        await tick();
        const id = sileo.show('Configured');

        expect(store.toasts).toContainEqual(
            expect.objectContaining({
                id,
                position: 'bottom-left',
                fill: '#123456',
                roundness: 24
            })
        );
    });

    test('morphs the title and description after an update', async () => {
        const id = sileo.show({ title: 'Draft', description: 'Saving', autopilot: false });
        const { getByText } = render(Toaster);

        await tick();
        sileo.update(id, { title: 'Published', description: 'Saved', autopilot: false });
        await tick();

        expect(getByText('Published')).toBeTruthy();
        expect(getByText('Saved')).toBeTruthy();
    });

    test('invokes an action button callback with its toast id', async () => {
        const onClick = vi.fn();
        const id = sileo.action({ title: 'Action', button: { title: 'Undo', onClick } });
        const { getByRole } = render(Toaster);

        await tick();
        await fireEvent.click(getByRole('button', { name: 'Undo' }));

        expect(onClick).toHaveBeenCalledWith(id);
    });

    test('expands and collapses described content on a hover-capable fine pointer', async () => {
        stubHoverCapability(true);
        sileo.show({ title: 'Details', description: 'More information', autopilot: false });
        const { getByRole, getByText } = render(Toaster);

        await tick();
        const toast = getByRole('group');

        await fireEvent.mouseEnter(toast);
        expect(toast.getAttribute('data-expanded')).toBe('true');
        expect(getByText('More information').parentElement?.getAttribute('data-visible')).toBe('true');

        await fireEvent.mouseLeave(toast);
        expect(toast.getAttribute('data-expanded')).toBe('false');
    });

    test('keeps a touched stacked toast open after a synthesized mouseleave', async () => {
        stubHoverCapability(false);
        sileo.action({
            title: 'Older mobile action',
            description: 'Older touch details',
            autopilot: false,
            button: { title: 'Older button', onClick: vi.fn() }
        });
        sileo.action({
            title: 'Newer mobile action',
            description: 'Newer touch details',
            autopilot: false,
            button: { title: 'Newer button', onClick: vi.fn() }
        });
        const { getByText } = render(Toaster);

        await tick();

        const olderToast = getByText('Older mobile action').closest('[data-sileo-toast]') as HTMLElement;
        const newerToast = getByText('Newer mobile action').closest('[data-sileo-toast]') as HTMLElement;
        const olderTrigger = olderToast.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        olderToast.setPointerCapture = vi.fn();

        expect(olderToast.getAttribute('data-expanded')).toBe('false');
        expect(newerToast.getAttribute('data-expanded')).toBe('false');

        dispatchPointer(olderTrigger, 'pointerdown', 10);
        olderTrigger.click();
        await tick();
        expect(olderToast.getAttribute('data-expanded')).toBe('true');

        await fireEvent.mouseLeave(olderToast);
        expect(olderToast.getAttribute('data-expanded')).toBe('true');
        expect(newerToast.getAttribute('data-expanded')).toBe('false');
    });

    test('announces through a polite live viewport', async () => {
        sileo.info('Notice');
        const { container } = render(Toaster);

        await tick();

        expect(container.querySelector('[data-sileo-viewport]')?.getAttribute('aria-live')).toBe('polite');
    });

    test('renders one polite live region for each active position', async () => {
        sileo.success({ title: 'First', position: 'top-right' });
        sileo.info({ title: 'Second', position: 'top-right' });
        sileo.warning({ title: 'Third', position: 'bottom-left' });
        const { container } = render(Toaster);

        await tick();

        expect(container.querySelectorAll('[data-sileo-viewport][data-position="top-right"]')).toHaveLength(1);
        expect(container.querySelectorAll('[data-sileo-viewport][data-position="bottom-left"]')).toHaveLength(1);
        expect(container.querySelectorAll('[data-sileo-viewport][aria-live="polite"]')).toHaveLength(2);
    });

    test('ships a reduced-motion stylesheet contract', async () => {
        const stylesheet = await readFile('src/lib/styles.css', 'utf8');

        expect(stylesheet).toContain('@media (prefers-reduced-motion: reduce)');
    });

    test('uses default dimensions for every collapsed geometry layer', async () => {
        // Happy DOM does not calculate title width. Real pill/header alignment remains pending browser QA.
        sileo.success('Default geometry');
        const { container } = render(Toaster);

        await tick();

        const svg = container.querySelector('[data-sileo-svg]') as SVGElement;
        const body = container.querySelector('[data-sileo-body]') as SVGRectElement;

        expect(svg.getAttribute('width')).toBe('350');
        expect(svg.getAttribute('height')).toBe('40');
        expect(svg.getAttribute('viewBox')).toBe('0 0 350 40');
        expect(body.getAttribute('width')).toBe('350');
        expect(body.getAttribute('y')).toBe('40');
    });

    test('updates aligned geometry when the public width changes at runtime', async () => {
        sileo.success('Responsive geometry');
        const { container } = render(Toaster);

        await tick();

        const toast = container.querySelector('[data-sileo-toast]') as HTMLElement;
        const svg = container.querySelector('[data-sileo-svg]') as SVGElement;
        const body = container.querySelector('[data-sileo-body]') as SVGRectElement;

        toast.style.setProperty('--sileo-width', '300px');
        ResizeObserverMock.resize(toast, 300, 40);
        await tick();

        expect(svg.getAttribute('width')).toBe('300');
        expect(svg.getAttribute('viewBox')).toBe('0 0 300 40');
        expect(body.getAttribute('width')).toBe('300');

        toast.style.setProperty('--sileo-width', '400px');
        ResizeObserverMock.resize(toast, 400, 40);
        await tick();

        expect(svg.getAttribute('width')).toBe('400');
        expect(svg.getAttribute('viewBox')).toBe('0 0 400 40');
        expect(body.getAttribute('width')).toBe('400');
    });

    test('updates vertical geometry when the public height changes at runtime', async () => {
        sileo.success('Tall geometry');
        const { container } = render(Toaster);

        await tick();

        const toast = container.querySelector('[data-sileo-toast]') as HTMLElement;
        const header = container.querySelector('[data-sileo-header]') as HTMLElement;
        const svg = container.querySelector('[data-sileo-svg]') as SVGElement;
        const body = container.querySelector('[data-sileo-body]') as SVGRectElement;

        toast.style.setProperty('--sileo-height', '56px');
        ResizeObserverMock.resize(header, 300, 56);
        await tick();

        expect(svg.getAttribute('height')).toBe('56');
        expect(svg.getAttribute('viewBox')).toBe('0 0 350 56');
        expect(body.getAttribute('y')).toBe('56');
        expect(toast.style.getPropertyValue('--_h')).toBe('56px');
    });

    test('clamps a toast to the usable width of a 320px viewport', async () => {
        sileo.success('Narrow geometry');
        const { container } = render(Toaster);

        await tick();

        const toast = container.querySelector('[data-sileo-toast]') as HTMLElement;
        const svg = container.querySelector('[data-sileo-svg]') as SVGElement;
        const body = container.querySelector('[data-sileo-body]') as SVGRectElement;
        const stylesheet = await readFile('src/lib/styles.css', 'utf8');

        ResizeObserverMock.resize(toast, 296, 40);
        await tick();

        expect(stylesheet).toContain('width: min(var(--sileo-width), calc(100vw - 1.5rem));');
        expect(svg.getAttribute('width')).toBe('296');
        expect(body.getAttribute('width')).toBe('296');
    });

    test('does not render a fallback icon or badge when icon is null', async () => {
        sileo.success({ title: 'Iconless', icon: null });
        const { container } = render(Toaster);

        await tick();

        const current = container.querySelector('[data-sileo-header-inner][data-layer="current"]');
        expect(current?.querySelector('[data-sileo-badge]')).toBeNull();
        expect(current?.querySelector('svg')).toBeNull();
    });

    test('morphs icons through default, null, custom, and default states', async () => {
        const customIcon = createRawSnippet(() => ({
            render: () => '<svg data-custom-icon aria-hidden="true"></svg>'
        }));
        const { container, rerender } = render(Sileo, {
            id: 'icon-morph',
            title: 'Default icon',
            toastState: 'success'
        });

        await tick();
        let current = container.querySelector('[data-sileo-header-inner][data-layer="current"]');
        expect(current?.querySelector('[data-sileo-badge] svg')).toBeTruthy();

        await rerender({
            id: 'icon-morph',
            title: 'No icon',
            toastState: 'success',
            icon: null
        });
        current = container.querySelector('[data-sileo-header-inner][data-layer="current"]');
        expect(current?.querySelector('[data-sileo-badge]')).toBeNull();

        await rerender({
            id: 'icon-morph',
            title: 'Custom icon',
            toastState: 'success',
            icon: customIcon
        });
        current = container.querySelector('[data-sileo-header-inner][data-layer="current"]');
        expect(current?.querySelector('[data-custom-icon]')).toBeTruthy();

        await rerender({
            id: 'icon-morph',
            title: 'Default again',
            toastState: 'success',
            icon: undefined
        });
        current = container.querySelector('[data-sileo-header-inner][data-layer="current"]');
        expect(current?.querySelector('[data-sileo-badge] svg')).toBeTruthy();
    });

    test('hides decorative canvas and state icons from assistive technology', async () => {
        sileo.success('Success');
        sileo.loading('Loading');
        sileo.error('Error');
        sileo.warning('Warning');
        sileo.info('Info');
        sileo.action('Action');
        const { container } = render(Toaster);

        await tick();

        const canvases = container.querySelectorAll('[data-sileo-svg]');
        const icons = container.querySelectorAll('[data-sileo-badge] svg');

        expect(canvases).toHaveLength(6);
        expect(icons).toHaveLength(6);
        for (const svg of [...canvases, ...icons]) {
            expect(svg.getAttribute('aria-hidden')).toBe('true');
            expect(svg.querySelector('title')).toBeNull();
        }
    });

    test('hides the previous header layer from assistive technology during a morph', async () => {
        const id = sileo.success({ title: 'Previous title', duration: null });
        const { container } = render(Toaster);

        await tick();
        sileo.update(id, { state: 'info', title: 'Current title', duration: null });
        await tick();

        const current = container.querySelector('[data-sileo-header-inner][data-layer="current"]');
        const previous = container.querySelector('[data-sileo-header-inner][data-layer="prev"]');

        expect(current?.textContent).toContain('Current title');
        expect(current?.getAttribute('aria-hidden')).toBeNull();
        expect(previous?.textContent).toContain('Previous title');
        expect(previous?.getAttribute('aria-hidden')).toBe('true');
        expect(
            container.querySelectorAll('[data-sileo-header-inner][data-layer="current"] [data-sileo-title]')
        ).toHaveLength(1);
    });

    test('expands action content on focus and stays open while focus moves to its button', async () => {
        sileo.action({
            title: 'Keyboard action',
            description: 'Choose an action',
            autopilot: false,
            button: { title: 'Continue', onClick: vi.fn() }
        });
        const { container, getByRole } = render(Toaster);

        await tick();

        const toast = container.querySelector('[data-sileo-toast]') as HTMLElement;
        const trigger = container.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        const button = getByRole('button', { name: 'Continue' });
        const content = container.querySelector('[data-sileo-content]') as HTMLElement;

        expect(toast.hasAttribute('tabindex')).toBe(false);
        expect(toast.hasAttribute('aria-expanded')).toBe(false);
        expect(trigger.getAttribute('tabindex')).toBe('0');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(trigger.getAttribute('aria-controls')).toBe(content.id);

        trigger.focus();
        await fireEvent.focusIn(trigger);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');

        button.focus();
        await fireEvent.focusOut(trigger, { relatedTarget: button });
        await fireEvent.focusIn(button, { relatedTarget: trigger });
        expect(trigger.getAttribute('aria-expanded')).toBe('true');

        await fireEvent.focusOut(button, { relatedTarget: document.body });
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    test('collapses expanded action content with Escape', async () => {
        sileo.action({
            title: 'Escape action',
            description: 'Choose an action',
            autopilot: false,
            button: { title: 'Continue', onClick: vi.fn() }
        });
        const { container, getByRole } = render(Toaster);

        await tick();

        const trigger = container.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        const button = getByRole('button', { name: 'Continue' });

        trigger.focus();
        await fireEvent.focusIn(trigger);
        button.focus();
        await fireEvent.keyDown(button, { key: 'Escape' });

        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(trigger);
    });

    test('does not add a noninteractive status toast to the tab order', async () => {
        sileo.success({
            title: 'Status details',
            description: 'Nothing to operate',
            autopilot: false
        });
        const { container } = render(Toaster);

        await tick();

        const toast = container.querySelector('[data-sileo-toast]') as HTMLElement;
        const trigger = container.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        expect(toast.hasAttribute('tabindex')).toBe(false);
        expect(trigger.getAttribute('tabindex')).toBe('-1');
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    test('toggles described content through its semantic header button on a fine pointer', async () => {
        sileo.success({
            title: 'Click for details',
            description: 'Pointer-accessible content',
            autopilot: false
        });
        const { container } = render(Toaster);

        await tick();

        const trigger = container.querySelector('[data-sileo-trigger]') as HTMLButtonElement;

        trigger.click();
        await tick();
        expect(trigger.getAttribute('aria-expanded')).toBe('true');

        trigger.click();
        await tick();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    test('keeps a native pointer-focus-click activation open exactly once', async () => {
        sileo.action({
            title: 'Native activation',
            description: 'Pointer-accessible action',
            autopilot: false,
            button: { title: 'Apply', onClick: vi.fn() }
        });
        const { container } = render(Toaster);

        await tick();

        const toast = container.querySelector('[data-sileo-toast]') as HTMLElement;
        const trigger = container.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        toast.setPointerCapture = vi.fn();

        dispatchPointer(trigger, 'pointerdown', 10);
        trigger.focus();
        trigger.click();
        await tick();

        expect(trigger.getAttribute('aria-expanded')).toBe('true');

        trigger.click();
        await tick();
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    test('allows an older stacked toast to expand from keyboard focus', async () => {
        sileo.action({
            title: 'Older keyboard toast',
            description: 'Older action',
            autopilot: false,
            button: { title: 'Older action', onClick: vi.fn() }
        });
        sileo.action({
            title: 'Newer keyboard toast',
            description: 'Newer action',
            autopilot: false,
            button: { title: 'Newer action', onClick: vi.fn() }
        });
        const { getByText } = render(Toaster);

        await tick();

        const olderToast = getByText('Older keyboard toast').closest('[data-sileo-toast]') as HTMLElement;
        const olderTrigger = olderToast.querySelector('[data-sileo-trigger]') as HTMLButtonElement;

        olderTrigger.focus();
        await tick();

        expect(olderTrigger.getAttribute('aria-expanded')).toBe('true');
    });

    test('allows an older stacked toast to expand from touch activation', async () => {
        sileo.success({
            title: 'Older touch toast',
            description: 'Older details',
            autopilot: false
        });
        sileo.success({
            title: 'Newer touch toast',
            description: 'Newer details',
            autopilot: false
        });
        const { getByText } = render(Toaster);

        await tick();

        const olderToast = getByText('Older touch toast').closest('[data-sileo-toast]') as HTMLElement;
        const olderTrigger = olderToast.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        olderToast.setPointerCapture = vi.fn();

        dispatchPointer(olderTrigger, 'pointerdown', 10);
        olderTrigger.click();
        await tick();

        expect(olderTrigger.getAttribute('aria-expanded')).toBe('true');
    });

    test('expands when pointer capture retargets a touch click to the toast root', async () => {
        sileo.success({
            title: 'Captured touch toast',
            description: 'Captured details',
            autopilot: false
        });
        const { container } = render(Toaster);

        await tick();

        const toast = container.querySelector('[data-sileo-toast]') as HTMLElement;
        const trigger = container.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        toast.setPointerCapture = vi.fn();

        dispatchPointer(trigger, 'pointerdown', 10);
        toast.click();
        await tick();

        expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    test('does not expand when a click follows a touch drag that returns near its origin', async () => {
        sileo.success({
            title: 'Drag for details',
            description: 'Touch-accessible content',
            autopilot: false
        });
        const { container } = render(Toaster);

        await tick();

        const toast = container.querySelector('[data-sileo-toast]') as HTMLElement;
        const trigger = container.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        toast.setPointerCapture = vi.fn();

        dispatchPointer(trigger, 'pointerdown', 10);
        dispatchPointer(toast, 'pointermove', 30);
        dispatchPointer(toast, 'pointermove', 11);
        dispatchPointer(toast, 'pointerup', 11);
        trigger.click();
        await tick();

        expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    test('resets touch-drag suppression when the gesture is cancelled', async () => {
        sileo.success({
            title: 'Cancelled drag',
            description: 'Touch-accessible content',
            autopilot: false
        });
        const { container } = render(Toaster);

        await tick();

        const toast = container.querySelector('[data-sileo-toast]') as HTMLElement;
        const trigger = container.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        toast.setPointerCapture = vi.fn();

        dispatchPointer(trigger, 'pointerdown', 10);
        dispatchPointer(toast, 'pointermove', 30);
        dispatchPointer(toast, 'pointercancel', 30);
        trigger.click();
        await tick();

        expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    test('uses collision-safe disclosure content ids', async () => {
        const first = render(Sileo, {
            id: 'same value',
            title: 'First collision',
            description: 'First details'
        });
        const second = render(Sileo, {
            id: 'same?value',
            title: 'Second collision',
            description: 'Second details'
        });

        await tick();

        const firstTrigger = first.container.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        const secondTrigger = second.container.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        const firstContent = first.container.querySelector('[data-sileo-content]') as HTMLElement;
        const secondContent = second.container.querySelector('[data-sileo-content]') as HTMLElement;

        expect(firstTrigger.getAttribute('aria-controls')).toBe(firstContent.id);
        expect(secondTrigger.getAttribute('aria-controls')).toBe(secondContent.id);
        expect(firstContent.id).not.toBe(secondContent.id);
    });

    test('invokes a touch action exactly once without collapsing its toast', async () => {
        const onClick = vi.fn();
        const id = sileo.action({
            title: 'Tap action',
            description: 'Touch-accessible action',
            autopilot: false,
            button: { title: 'Apply', onClick }
        });
        const { container, getByRole } = render(Toaster);

        await tick();

        const toast = container.querySelector('[data-sileo-toast]') as HTMLElement;
        const trigger = container.querySelector('[data-sileo-trigger]') as HTMLButtonElement;
        toast.setPointerCapture = vi.fn();

        dispatchPointer(trigger, 'pointerdown', 10);
        trigger.click();
        await tick();
        await fireEvent.click(getByRole('button', { name: 'Apply' }));

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledWith(id);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });
});
