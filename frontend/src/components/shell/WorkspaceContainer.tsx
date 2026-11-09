/**
 * WorkspaceContainer — full-width, full-height content wrapper.
 * Replaces the constrained max-w-6xl content area from the old layout.
 */
interface WorkspaceContainerProps {
    children: React.ReactNode;
    /** Remove default padding (for modules that manage their own layout) */
    noPadding?: boolean;
    /** Additional class names to append to container */
    className?: string;
}

export default function WorkspaceContainer({
    children,
    noPadding = false,
    className = '',
}: WorkspaceContainerProps) {
    return (
        <div
            className={`
                flex-1 w-full min-w-0 flex flex-col overflow-hidden relative
                print:block print:overflow-visible print:flex-none
                ${noPadding ? '' : 'px-4 md:px-8 py-4 md:py-5'}
                ${className}
            `}
        >
            {children}
        </div>
    );
}
