import { useState } from 'react';
import { X, FileText, Loader2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import type { InventoryItem } from './InventoryCard';
import { getImgSrc } from './InventoryCard';

interface ReportGeneratorProps {
    items: InventoryItem[];
    itemType: 'asset' | 'consumable';
    onClose: () => void;
}

const ITEMS_PER_PAGE_OPTIONS = [1, 2, 4, 6, 8, 10] as const;

const fmt = (n: number) => 'Rs. ' + Math.round(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

/**
 * Load an image URL and return a base64 data URL with natural dimensions, or null on failure.
 */
async function loadImageAsBase64(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject();
            reader.readAsDataURL(blob);
        });
        // Get natural dimensions via HTMLImageElement
        const dims: { width: number; height: number } = await new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ width: 1, height: 1 });
            img.src = dataUrl;
        });
        return { dataUrl, width: dims.width, height: dims.height };
    } catch {
        return null;
    }
}

/**
 * Get layout configuration based on items per page.
 */
function getLayoutConfig(itemsPerPage: number) {
    const isLandscape = itemsPerPage === 1;
    const pageW = isLandscape ? 297 : 210;
    const pageH = isLandscape ? 210 : 297;
    const marginX = 10, marginY = 10;
    const usableW = pageW - 2 * marginX;
    const usableH = pageH - 2 * marginY;
    const headerH = 12;
    const footerH = 8;
    const contentH = usableH - headerH - footerH;

    let cols: number, rows: number;
    switch (itemsPerPage) {
        case 1:  cols = 1; rows = 1; break;
        case 2:  cols = 1; rows = 2; break;
        case 4:  cols = 2; rows = 2; break;
        case 6:  cols = 2; rows = 3; break;
        case 8:  cols = 2; rows = 4; break;
        case 10: cols = 2; rows = 5; break;
        default: cols = 2; rows = 5; break;
    }

    const gap = 4;
    const cellW = (usableW - (cols - 1) * gap) / cols;
    const cellH = (contentH - (rows - 1) * gap) / rows;

    let fontSize: number, lineHeight: number;
    if (itemsPerPage === 1) { fontSize = 11.5; lineHeight = 6.0; }
    else if (itemsPerPage === 2) { fontSize = 9.5; lineHeight = 4.8; }
    else if (itemsPerPage <= 4) { fontSize = 8; lineHeight = 4.0; }
    else if (itemsPerPage <= 6) { fontSize = 7; lineHeight = 3.5; }
    else if (itemsPerPage <= 8) { fontSize = 6.5; lineHeight = 3.2; }
    else { fontSize = 6; lineHeight = 3.0; }

    return { cols, rows, cellW, cellH, fontSize, lineHeight, marginX, marginY, headerH, footerH, gap, usableW, pageW, pageH, isLandscape };
}

/**
 * Draw a single item cell at position (x, y) with given dimensions.
 * Images are drawn preserving their original aspect ratio.
 * Text details are arranged in two columns for compactness.
 */
function drawItemCell(
    pdf: jsPDF,
    item: InventoryItem,
    imageInfo: { dataUrl: string; width: number; height: number } | null,
    x: number, y: number,
    cellW: number, cellH: number,
    itemType: 'asset' | 'consumable',
    itemIndex: number,
    itemsPerPage: number
) {
    const pad = 3;
    const innerW = cellW - 2 * pad;
    const innerH = cellH - 2 * pad;

    // Draw card container border & subtle background
    pdf.setDrawColor(220, 225, 230);
    pdf.setLineWidth(0.3);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, cellW, cellH, 2, 2, 'FD');

    const isLandscape = cellW > 250;

    // Determine font sizes & line heights dynamically based on itemsPerPage
    let titleFontSize: number, titleLineHeight: number;
    let detailFontSize: number, detailLineHeight: number;
    let valueFontSize: number, valueLineHeight: number;
    let badgeFontSize: number;
    let imgRatio: number;

    if (itemsPerPage === 1) {
        titleFontSize = 22; titleLineHeight = 11.5;
        detailFontSize = 15; detailLineHeight = 10.5;
        valueFontSize = 18; valueLineHeight = 12.0;
        badgeFontSize = 26; imgRatio = 0.46;
    } else if (itemsPerPage === 2) {
        titleFontSize = 16; titleLineHeight = 8.5;
        detailFontSize = 12.5; detailLineHeight = 7.5;
        valueFontSize = 15; valueLineHeight = 9.0;
        badgeFontSize = 20; imgRatio = 0.42;
    } else if (itemsPerPage <= 4) {
        titleFontSize = 12.5; titleLineHeight = 6.8;
        detailFontSize = 10; detailLineHeight = 5.8;
        valueFontSize = 11.5; valueLineHeight = 6.8;
        badgeFontSize = 14; imgRatio = 0.40;
    } else if (itemsPerPage <= 6) {
        titleFontSize = 10.5; titleLineHeight = 5.5;
        detailFontSize = 8.5; detailLineHeight = 4.5;
        valueFontSize = 9.5; valueLineHeight = 5.5;
        badgeFontSize = 12; imgRatio = 0.40;
    } else if (itemsPerPage <= 8) {
        titleFontSize = 9; titleLineHeight = 4.5;
        detailFontSize = 7.2; detailLineHeight = 3.8;
        valueFontSize = 8.2; valueLineHeight = 4.5;
        badgeFontSize = 10.5; imgRatio = 0.38;
    } else {
        titleFontSize = 8; titleLineHeight = 3.8;
        detailFontSize = 6.2; detailLineHeight = 3.2;
        valueFontSize = 7.2; valueLineHeight = 3.8;
        badgeFontSize = 9.5; imgRatio = 0.36;
    }

    // Top-Right Prominent Badge
    pdf.setFontSize(badgeFontSize);
    pdf.setFont('helvetica', 'bold');
    const badgeText = `#${itemIndex}`;
    const badgeTextWidth = pdf.getTextWidth(badgeText);
    const badgeW = badgeTextWidth + (itemsPerPage <= 2 ? 8 : 4);
    const badgeH = badgeFontSize * 0.45 + (itemsPerPage <= 2 ? 3.5 : 2.0);

    const badgeX = x + cellW - pad - badgeW - 1;
    const badgeY = y + pad + 1;

    // --- UNIFIED SIDE-BY-SIDE LAYOUT ---
    const imgBoxW = innerW * imgRatio;
    const imgBoxH = innerH;
    const gapBetween = itemsPerPage <= 2 ? (isLandscape ? 8 : 6) : 3;
    const textX = x + pad + imgBoxW + gapBetween;
    const textW = innerW - imgBoxW - gapBetween;

    // Left Column: Image Rendering with Aspect Ratio Preservation
    if (imageInfo) {
        try {
            const format = imageInfo.dataUrl.includes('image/png') ? 'PNG' : 'JPEG';
            const aspectRatio = imageInfo.width / imageInfo.height;

            let drawW = imgBoxW;
            let drawH = drawW / aspectRatio;
            if (drawH > imgBoxH) {
                drawH = imgBoxH;
                drawW = drawH * aspectRatio;
            }

            const offsetX = (imgBoxW - drawW) / 2;
            const offsetY = (imgBoxH - drawH) / 2;

            pdf.setFillColor(248, 249, 250);
            pdf.roundedRect(x + pad, y + pad, imgBoxW, imgBoxH, 1.5, 1.5, 'F');
            pdf.addImage(imageInfo.dataUrl, format, x + pad + offsetX, y + pad + offsetY, drawW, drawH);
        } catch {
            pdf.setFillColor(248, 249, 250);
            pdf.roundedRect(x + pad, y + pad, imgBoxW, imgBoxH, 1.5, 1.5, 'F');
            pdf.setFontSize(detailFontSize);
            pdf.setTextColor(160, 160, 160);
            pdf.text('No Image', x + pad + imgBoxW / 2, y + pad + imgBoxH / 2, { align: 'center' });
        }
    } else {
        pdf.setFillColor(248, 249, 250);
        pdf.roundedRect(x + pad, y + pad, imgBoxW, imgBoxH, 1.5, 1.5, 'F');
        pdf.setFontSize(detailFontSize);
        pdf.setTextColor(160, 160, 160);
        pdf.text('No Image', x + pad + imgBoxW / 2, y + pad + imgBoxH / 2, { align: 'center' });
    }

    // Right Column: Key-Value Details
    const useShortLabels = itemsPerPage >= 4;
    const details: { label: string; val: string }[] = [];
    if (item.Category) details.push({ label: useShortLabels ? 'Cat' : 'Category', val: item.Category });
    if (itemType === 'asset' && item.Material) details.push({ label: useShortLabels ? 'Mat' : 'Material', val: item.Material });
    if (itemType !== 'asset' && item.UOM) details.push({ label: 'UOM', val: item.UOM });
    if (item.WeightGrams) details.push({ label: useShortLabels ? 'Wt' : 'Weight', val: `${item.WeightGrams} g` });
    if (item.Purity) details.push({ label: 'Purity', val: `${item.Purity}%` });
    details.push({ label: useShortLabels ? 'Qty' : 'Quantity', val: `${item.Quantity}` });

    // Calculate total text block height for vertical centering
    pdf.setFontSize(titleFontSize);
    pdf.setFont('helvetica', 'bold');
    const titleWidthAvailable = (textX + textW > badgeX) ? (textW - badgeW - 2) : textW;
    const nameLines = pdf.splitTextToSize(item.Name, Math.max(20, titleWidthAvailable));
    const maxNameLines = itemsPerPage >= 8 ? Math.min(nameLines.length, 1) : Math.min(nameLines.length, 2);

    const textBlockH = (maxNameLines * titleLineHeight + 2) +
                       (details.length * detailLineHeight + 2) +
                       valueLineHeight;

    const startTextY = y + pad + Math.max(1, (imgBoxH - textBlockH) / 2);
    let curY = startTextY;

    // 1. Item Name Title
    pdf.setFontSize(titleFontSize);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(20, 20, 20);
    for (let i = 0; i < maxNameLines; i++) {
        pdf.text(nameLines[i], textX, curY);
        curY += titleLineHeight;
    }
    curY += 1;

    // 2. Key-Value Details with bold labels
    pdf.setFontSize(detailFontSize);
    for (const d of details) {
        if (curY > y + cellH - pad - valueLineHeight) break;
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(60, 60, 60);
        const labelStr = `${d.label}: `;
        pdf.text(labelStr, textX, curY);

        const labelW = pdf.getTextWidth(labelStr);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(30, 30, 30);
        pdf.text(d.val, textX + labelW, curY);

        curY += detailLineHeight;
    }
    curY += 1;

    // 3. Total Value
    if (curY <= y + cellH - pad) {
        if (itemsPerPage <= 4) {
            curY += 2;
            pdf.setDrawColor(230, 235, 240);
            pdf.setLineWidth(0.3);
            pdf.line(textX, curY - 3, textX + textW, curY - 3);
        }
        pdf.setFontSize(valueFontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(16, 130, 90);
        pdf.text(`Total Value: ${fmt(item.TotalValue || 0)}`, textX, curY);
    }

    // --- DRAW PROMINENT TOP-RIGHT BADGE ---
    pdf.setFillColor(16, 185, 129); // Emerald Fill
    pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.2, 1.2, 'F');
    pdf.setFontSize(badgeFontSize);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(badgeText, badgeX + badgeW / 2, badgeY + badgeH * 0.74, { align: 'center' });
}

export default function ReportGenerator({ items, itemType, onClose }: ReportGeneratorProps) {
    const [itemsPerPage, setItemsPerPage] = useState<number>(4);
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState('');

    const handleGenerate = async () => {
        if (items.length === 0) return;
        setGenerating(true);
        setProgress('Loading images...');

        try {
            const config = getLayoutConfig(itemsPerPage);
            const pdf = new jsPDF({
                orientation: config.isLandscape ? 'landscape' : 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // Preload all images
            const imageMap = new Map<number, { dataUrl: string; width: number; height: number } | null>();
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const src = getImgSrc(item.ImageLink, item.Category);
                if (src) {
                    setProgress(`Loading image ${i + 1} of ${items.length}...`);
                    const data = await loadImageAsBase64(src);
                    imageMap.set(item.ItemId, data);
                } else {
                    imageMap.set(item.ItemId, null);
                }
            }

            setProgress('Generating PDF...');

            const totalPages = Math.ceil(items.length / itemsPerPage);
            const title = itemType === 'asset' ? 'Fixed Asset Register' : 'Consumable Register';
            const dateStr = new Date().toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            for (let page = 0; page < totalPages; page++) {
                if (page > 0) pdf.addPage('a4', config.isLandscape ? 'landscape' : 'portrait');

                const startIdx = page * itemsPerPage;
                const pageItems = items.slice(startIdx, startIdx + itemsPerPage);

                // Header
                pdf.setFillColor(30, 30, 30);
                pdf.rect(0, 0, config.pageW, config.marginY + config.headerH - 2, 'F');

                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(255, 255, 255);
                pdf.text(title, config.marginX, config.marginY + 5);

                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(200, 200, 200);
                pdf.text(`Generated: ${dateStr}`, config.pageW - config.marginX, config.marginY + 5, { align: 'right' });

                pdf.setFontSize(7);
                pdf.text(
                    `Items ${startIdx + 1}–${Math.min(startIdx + itemsPerPage, items.length)} of ${items.length}`,
                    config.marginX,
                    config.marginY + 10
                );

                // Draw item cells
                const contentStartY = config.marginY + config.headerH;

                for (let i = 0; i < pageItems.length; i++) {
                    const item = pageItems[i];
                    const col = i % config.cols;
                    const row = Math.floor(i / config.cols);
                    const cellX = config.marginX + col * (config.cellW + config.gap);
                    const cellY = contentStartY + row * (config.cellH + config.gap);

                    drawItemCell(
                        pdf, item, imageMap.get(item.ItemId) || null,
                        cellX, cellY,
                        config.cellW, config.cellH,
                        itemType, startIdx + i + 1,
                        itemsPerPage
                    );
                }

                // Footer
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(150, 150, 150);
                pdf.text(
                    `Page ${page + 1} of ${totalPages}`,
                    config.pageW / 2,
                    config.pageH - 6,
                    { align: 'center' }
                );
            }

            // Summary page at the end
            pdf.addPage('a4', config.isLandscape ? 'landscape' : 'portrait');
            pdf.setFillColor(30, 30, 30);
            pdf.rect(0, 0, config.pageW, 30, 'F');
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text(`${title} — Summary`, config.marginX, 20);

            let sy = 40;
            pdf.setTextColor(30, 30, 30);
            pdf.setFontSize(10);
            pdf.text(`Total Items: ${items.length}`, config.marginX, sy); sy += 7;
            const totalVal = items.reduce((s, i) => s + (i.TotalValue || 0), 0);
            pdf.text(`Total Valuation: ${fmt(totalVal)}`, config.marginX, sy); sy += 7;
            pdf.text(`Report Date: ${dateStr}`, config.marginX, sy); sy += 12;

            // Material breakdown
            const matMap = new Map<string, { count: number; value: number }>();
            for (const item of items) {
                const mat = item.Material || 'Other';
                const existing = matMap.get(mat) || { count: 0, value: 0 };
                existing.count++;
                existing.value += item.TotalValue || 0;
                matMap.set(mat, existing);
            }

            if (matMap.size > 0) {
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'bold');
                pdf.text('By Material:', config.marginX, sy); sy += 6;

                pdf.setFontSize(8);
                pdf.setFont('helvetica', 'normal');
                // Table header
                pdf.setFillColor(240, 240, 240);
                pdf.rect(config.marginX, sy - 3, config.usableW, 6, 'F');
                pdf.setFont('helvetica', 'bold');
                pdf.text('Material', config.marginX + 2, sy);
                pdf.text('Count', config.marginX + 70, sy);
                pdf.text('Total Value', config.marginX + 100, sy);
                sy += 6;

                pdf.setFont('helvetica', 'normal');
                for (const [mat, data] of matMap.entries()) {
                    pdf.text(mat, config.marginX + 2, sy);
                    pdf.text(String(data.count), config.marginX + 70, sy);
                    pdf.text(fmt(data.value), config.marginX + 100, sy);
                    sy += 5;
                }
            }

            pdf.setFontSize(7);
            pdf.setTextColor(150, 150, 150);
            pdf.text(
                `Page ${totalPages + 1} of ${totalPages + 1}`,
                config.pageW / 2,
                config.pageH - 6,
                { align: 'center' }
            );

            // Download
            const filename = `${itemType === 'asset' ? 'Asset' : 'Consumable'}_Register_${new Date().toISOString().slice(0, 10)}_${itemsPerPage}perpage.pdf`;
            pdf.save(filename);

            setProgress('');
            onClose();
        } catch (err: any) {
            setProgress(`Error: ${err.message || 'Failed to generate report'}`);
        }
        setGenerating(false);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-[var(--bg-dark)] border border-[var(--glass-border)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-5 py-3.5 border-b border-[var(--glass-border)] bg-black/10 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                        <FileText size={18} className="text-blue-500" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">Generate Report</h2>
                    </div>
                    <button onClick={onClose} disabled={generating} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] disabled:opacity-30">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Info */}
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium">
                        <p>Generate a PDF report of <strong>{items.length}</strong> items with images and details.</p>
                    </div>

                    {/* Items per page selector */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-[var(--text-secondary)] mb-2">Items per page</label>
                        <div className="grid grid-cols-6 gap-2">
                            {ITEMS_PER_PAGE_OPTIONS.map(n => (
                                <button
                                    key={n}
                                    onClick={() => setItemsPerPage(n)}
                                    disabled={generating}
                                    className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                        itemsPerPage === n
                                            ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                                            : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-blue-500/50'
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Layout preview hint */}
                    <div className="text-xs text-[var(--text-secondary)] p-3 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                        {itemsPerPage === 1 && (
                            <p>📋 <strong>Landscape mode</strong> — 1 item per page, horizontal card side-by-side layout</p>
                        )}
                        {itemsPerPage === 2 && (
                            <p>📋 <strong>Portrait mode</strong> — 2 items per page, horizontal cards stacked vertically</p>
                        )}
                        {itemsPerPage >= 4 && (
                            <p>📊 <strong>Grid layout (Portrait mode)</strong> — {getLayoutConfig(itemsPerPage).cols} columns × {getLayoutConfig(itemsPerPage).rows} rows per page</p>
                        )}
                        <p className="mt-1">Total pages: {Math.ceil(items.length / itemsPerPage) + 1} (including summary)</p>
                    </div>

                    {/* Progress */}
                    {progress && (
                        <div className="flex items-center gap-2 text-xs text-amber-500 font-medium">
                            <Loader2 size={14} className="animate-spin" />
                            {progress}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-2 border-t border-[var(--glass-border)]">
                        <button
                            onClick={onClose}
                            disabled={generating}
                            className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] font-bold text-sm hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={generating || items.length === 0}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-colors"
                        >
                            {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            {generating ? 'Generating...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
