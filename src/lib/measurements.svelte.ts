interface BoxSize {
    width: number;
    height: number;
}

function boxSize(entry: ResizeObserverEntry): BoxSize {
    const borderSize = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize;
    return {
        width: borderSize?.inlineSize ?? entry.contentRect.width,
        height: borderSize?.blockSize ?? entry.contentRect.height
    };
}

export class ToastMeasurements {
    canvasWidth = $state(350);
    baseHeight = $state(40);
    pillWidth = $state(0);
    contentHeight = $state(0);

    measureToast = (node: HTMLElement) => {
        const measure = () => {
            const width = node.getBoundingClientRect().width;
            if (width > 0) this.canvasWidth = width;
        };
        measure();

        const observer = new ResizeObserver((entries) => {
            const width = boxSize(entries[0]).width;
            if (width > 0) this.canvasWidth = width;
        });
        observer.observe(node);
        return () => observer.disconnect();
    };

    measureHeader = (node: HTMLElement) => {
        const measure = () => {
            const height = node.getBoundingClientRect().height;
            if (height > 0) this.baseHeight = height;
        };
        measure();

        const observer = new ResizeObserver((entries) => {
            const height = boxSize(entries[0]).height;
            if (height > 0) this.baseHeight = height;
        });
        observer.observe(node);
        return () => observer.disconnect();
    };

    measureTitle = (node: HTMLElement) => {
        const header = node.closest<HTMLElement>('[data-sileo-header]');
        const horizontalPadding = header
            ? (() => {
                  const style = getComputedStyle(header);
                  return Number.parseFloat(style.paddingLeft) + Number.parseFloat(style.paddingRight);
              })()
            : 0;
        const measure = () => {
            const width = node.scrollWidth + horizontalPadding + 10;
            if (width > 10) this.pillWidth = width;
        };
        measure();

        let frame = 0;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        });
        observer.observe(node);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    };

    measureContent = (node: HTMLElement) => {
        const measure = () => {
            this.contentHeight = node.scrollHeight;
        };
        measure();

        let frame = 0;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        });
        observer.observe(node);

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    };
}
