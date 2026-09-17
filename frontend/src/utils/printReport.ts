/**
 * Specialized multi-page print utility for tabular entity reports (Devotees, Sevas).
 * 
 * Features:
 * - Opens a clean dedicated print window so the current application UI is untouched.
 * - Paginates items cleanly according to the requested itemsPerPage.
 * - Adds a standardized clean header on each page:
 *     "${title} - page X out of Y total pages"
 * - Suppresses all headers/footers, margins, sidebar, or UI noise.
 */

export interface PrintColumn<T> {
    header: string;
    render: (item: T, index: number) => React.ReactNode | string | number;
    className?: string;
    headerClassName?: string;
}

export interface PrintReportOptions<T> {
    title: string;
    items: T[];
    itemsPerPage: number;
    columns: PrintColumn<T>[];
}

export function printTabularReport<T>({
    title,
    items,
    itemsPerPage,
    columns,
}: PrintReportOptions<T>) {
    if (!items || items.length === 0) {
        alert('ಮುದ್ರಿಸಲು ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ (No records to print)');
        return;
    }

    const pageSize = Math.max(1, itemsPerPage);
    const totalPages = Math.ceil(items.length / pageSize);

    // Split items into page chunks
    const pages: T[][] = [];
    for (let i = 0; i < items.length; i += pageSize) {
        pages.push(items.slice(i, i + pageSize));
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('ದಯವಿಟ್ಟು ಪಾಪ್-ಅಪ್ ಅನುಮತಿಸಿ (Please allow popups to print)');
        return;
    }

    const pagesHtml = pages.map((pageItems, pageIndex) => {
        const pageNum = pageIndex + 1;
        const rowsHtml = pageItems.map((item, itemIdx) => {
            const globalIndex = pageIndex * pageSize + itemIdx + 1;
            const cellsHtml = columns.map(col => {
                const val = col.render(item, globalIndex);
                const valStr = (val === null || val === undefined) ? '—' : String(val);
                return `<td class="${col.className || ''}">${valStr}</td>`;
            }).join('');
            return `<tr>${cellsHtml}</tr>`;
        }).join('');

        const headersHtml = columns.map(col => `<th class="${col.headerClassName || ''}">${col.header}</th>`).join('');

        return `
            <div class="report-page ${pageNum < totalPages ? 'page-break' : ''}">
                <div class="report-header">
                    <div class="report-title">${title} - page ${pageNum} out of ${totalPages} total pages</div>
                </div>
                <table class="report-table">
                    <thead>
                        <tr>${headersHtml}</tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }).join('');

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8" />
                <title>${title}</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 12mm 15mm 12mm 15mm;
                    }
                    @media print {
                        html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                            background: #fff !important;
                            color: #000 !important;
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            font-size: 11pt;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .page-break {
                            page-break-after: always;
                            break-after: page;
                        }
                    }
                    body {
                        margin: 0;
                        padding: 10px;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        color: #111;
                        background: #fff;
                    }
                    .report-page {
                        width: 100%;
                        box-sizing: border-box;
                    }
                    .report-header {
                        text-align: center;
                        padding-bottom: 12px;
                        margin-bottom: 14px;
                        border-bottom: 1.5px solid #222;
                    }
                    .report-title {
                        font-size: 13pt;
                        font-weight: 700;
                        letter-spacing: 0.3px;
                        color: #000;
                    }
                    .report-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 9.5pt;
                        line-height: 1.35;
                    }
                    .report-table th, .report-table td {
                        padding: 7px 9px;
                        border-bottom: 1px solid #ddd;
                        text-align: left;
                        vertical-align: top;
                    }
                    .report-table th {
                        background-color: #f3f4f6;
                        color: #111;
                        font-weight: 700;
                        text-transform: uppercase;
                        font-size: 8pt;
                        letter-spacing: 0.5px;
                        border-top: 1px solid #111;
                        border-bottom: 1.5px solid #111;
                    }
                    .report-table tr:nth-child(even) td {
                        background-color: #fafafa;
                    }
                    .text-right {
                        text-align: right !important;
                    }
                    .text-center {
                        text-align: center !important;
                    }
                    .font-mono {
                        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    }
                    .font-bold {
                        font-weight: 700;
                    }
                </style>
            </head>
            <body>
                ${pagesHtml}
                <script>
                    window.onload = function() {
                        window.focus();
                        window.onafterprint = function() {
                            try { window.close(); } catch (e) {}
                        };
                        setTimeout(function() {
                            window.print();
                        }, 300);
                    };
                </script>
            </body>
        </html>
    `);

    printWindow.document.close();
}
