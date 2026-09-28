/**
 * WorkspaceContainer — full-width, full-height content wrapper.
 * Replaces the constrained max-w-6xl content area from the old layout.
 */
interface WorkspaceContainerProps {
    children: React.ReactNode;
    /** Remove default padding (for modules that manage their own layout) */
    noPadding?: boolean;
}

export default function WorkspaceContainer({ children, noPadding = false }: WorkspaceContainerProps) {
    return (
        <div
            className={`
                flex-1 w-full min-w-0 flex flex-col overflow-hidden
                print:block print:overflow-visible print:flex-none
                ${noPadding ? '' : 'px-4 md:px-6 py-4 md:py-6'}
            `}
        >
            {children}
        </div>
    );
}
