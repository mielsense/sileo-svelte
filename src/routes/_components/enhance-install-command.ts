import { mount, unmount } from 'svelte';
import InstallCommand from './InstallCommand.svelte';

/** Keep plain install commands in Markdown and add the chooser in the browser. */
export function enhanceInstallCommand(block: HTMLPreElement): (() => void) | undefined {
    const command = /^(?:npm install|(?:pnpm|bun|yarn) add) (sileo-svelte(?:@[^\s]+)?)$/.exec(
        block.textContent?.trim() ?? ''
    );
    if (!command) return;

    const host = document.createElement('div');
    block.replaceWith(host);
    const component = mount(InstallCommand, { target: host, props: { packageName: command[1] } });

    return () => {
        void unmount(component);
        host.replaceWith(block);
    };
}
