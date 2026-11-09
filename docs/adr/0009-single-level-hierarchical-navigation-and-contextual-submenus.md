# Single-Level Hierarchical Navigation and Contextual Sub-Menus

When users enable the vertical Left Navigation Bar (`LeftNavBar`), tabs containing nested sub-catalogs—such as Seva Reports (`SevaReportsTab`)—previously presented an additional internal vertical column (320px width). This resulted in two side-by-side vertical sidebars consuming over 560px of horizontal viewport before presenting any report content, severely compromising wide multi-column tables and print layouts.

We decided to establish a unified single-level hierarchical sub-menu navigation model across the internal application shell:

1. **Declarative Sub-Navigation Items (`navConfig.ts`)**:
   - Primary tabs declare optional single-level child items via `subItems?: SubItem[]`.
   - Each `SubItem` encapsulates an identifier, Kannada label, relative path, optional categorization group, and distinct icon.
   - Centralizing sub-items in `navConfig.ts` maintains a single source of truth for all application routing and eliminates ad-hoc custom sidebar implementations across individual page components.

2. **Strict Single-Level Hierarchy Limit**:
   - Sub-navigation is strictly constrained to exactly one level beneath containing tabs.
   - Deeper multi-level accordion drill-downs (e.g. Module → Tab → Category → Sub-category → Item) are explicitly disallowed.
   - Multi-category items (such as the 7 report definitions across Daily, On-Demand, and Financial groups) are flattened into a single indented vertical list in `LeftNavBar`, grouped cleanly by subtle non-collapsible category dividers.

3. **Contextual Sidebar Suppression via Layout Contract**:
   - The shell layout exposes `navLayoutMode: 'top' | 'left'` via `LayoutContextType`.
   - Child components (such as `SevaReportsTab`) read `navLayoutMode` via React Router's `useOutletContext<LayoutContextType>()`.
   - When `navLayoutMode === 'left'`, the component suppresses its internal 320px catalog sidebar, expanding the primary report viewer to occupy 100% of the available content width.
   - When `navLayoutMode === 'top'`, the component retains its internal catalog sidebar to permit intuitive selection in the absence of a left navigation panel.

4. **URL-Driven Routing and Default Landing**:
   - Child sub-items bind directly to deep URL paths (e.g., `/app/seva/reports/:reportId`).
   - Navigating to a parent tab path without a child parameter automatically redirects to the canonical default item (`/app/seva/reports` → `/app/seva/reports/daily_priest`), maintaining continuous synchronization between the highlighted sub-menu in `LeftNavBar` and the active report view.

