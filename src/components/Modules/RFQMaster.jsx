import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Correct import for Vite
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate, formatMoney } from '../../utils/helpers';

export const RFQMaster = ({ data, actions, setModal }) => {
    // Added 'formulations' to destructuring
    const { rfqs = [], vendors, skus, products, formulations = [] } = data;
    const [searchTerm, setSearchTerm] = useState('');

    const getVendorName = (id) => vendors.find(v => v.id === id)?.companyName || 'Unknown Vendor';

    // Helper to get display details based on Type
    const getRfqDetails = (item) => {
        if (item.requestType === 'Custom') {
            return {
                title: item.customProductName || 'Custom Item',
                subtitle: item.customDescription || '-'
            };
        } else {
            const s = skus.find(x => x.id === item.skuId);
            const p = products.find(x => x.id === s?.productId);
            return {
                title: p ? `${p.name} (${s?.variant})` : 'Unknown Product',
                subtitle: s ? `${s.packSize} ${s.unit} ${s.packType}` : '-'
            };
        }
    };

    const filtered = rfqs.filter(r => {
        const vendor = getVendorName(r.vendorId).toLowerCase();
        const details = getRfqDetails(r);
        const search = searchTerm.toLowerCase();
        return vendor.includes(search) || details.title.toLowerCase().includes(search);
    });

    const generatePDF = (e, item) => {
        e.stopPropagation(); // Prevent row click
        try {
            const doc = new jsPDF();
            const vendor = vendors.find(v => v.id === item.vendorId);

            // --- DATE WITH YEAR ---
            let displayDate = '-';
            if (item.createdAt) {
                const d = new Date(item.createdAt.seconds ? item.createdAt.seconds * 1000 : item.createdAt);
                if (!isNaN(d.getTime())) {
                    displayDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
                }
            }

            // --- Header ---
            doc.setFontSize(20);
            doc.text("Request for Quotation (RFQ)", 105, 20, null, null, "center");

            doc.setFontSize(10);
            doc.text(`Date: ${displayDate}`, 14, 35);
            doc.text(`Vendor: ${vendor?.companyName || 'Unknown Vendor'}`, 14, 40);

            // --- Construct Body based on Type ---
            let tableBody = [];

            if (item.requestType === 'Custom') {
                tableBody = [
                    ['Request Type', 'Custom Item'],
                    ['Product Name', item.customProductName || '-'],
                    ['Description', item.customDescription || '-'],
                    ['Quantity', `${item.qty || 0} units`],
                    ['Target Price', item.targetPrice ? `${item.currency} ${item.targetPrice}` : 'N/A'],
                    ['Country of Sale', item.countryOfSale || '-']
                ];
            } else {
                const s = skus.find(x => x.id === item.skuId);
                const p = products.find(x => x.id === s?.productId);

                // --- NEW LOGIC START: Find Formulation & Packing ---
                const formulation = formulations.find(f => f.skuId === s?.id);
                const packingMaterials = formulation?.packaging?.length > 0
                    ? formulation.packaging.map(pk => `${pk.item} (${pk.qty})`).join(', ')
                    : 'None / Not Linked';
                // --- NEW LOGIC END ---

                tableBody = [
                    ['Request Type', 'Standard SKU'],
                    ['Product', p?.name || '-'],
                    ['Variant', s?.variant || '-'],
                    ['Pack Details', s ? `${s.packSize} ${s.unit} (${s.packType})` : '-'],
                    ['Packing Materials', packingMaterials], // <--- Added here
                    ['Quantity', `${item.qty || 0} units`],
                    ['Target Price', item.targetPrice ? `${item.currency} ${item.targetPrice}` : 'N/A'],
                    ['Country of Sale', item.countryOfSale || '-']
                ];
            }

            // --- Generate Table ---
            autoTable(doc, {
                startY: 50,
                head: [['Field', 'Value']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [51, 65, 85] }, // Slate-700
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } } // Bold keys
            });

            // --- NEW: Add Formulation Table (If SKU type and formulation exists) ---
            if (item.requestType !== 'Custom') {
                const s = skus.find(x => x.id === item.skuId);
                const formulation = formulations.find(f => f.skuId === s?.id);
                let finalY = doc.lastAutoTable.finalY;

                if (formulation?.ingredients?.length > 0) {
                    if (finalY > 230) { doc.addPage(); finalY = 20; }

                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.text("Formulation Details:", 14, finalY + 10);
                    doc.setFont(undefined, 'normal');

                    // UPDATED: Added 'perServing' column
                    const ingBody = formulation.ingredients.map(ing => [
                        ing.name,
                        ing.type || 'Active',
                        ing.per100g || '-',
                        ing.perServing || '-', // <--- Added this
                        ing.perSku || '-'
                    ]);

                    autoTable(doc, {
                        startY: finalY + 15,
                        // UPDATED Header to match columns
                        head: [['Ingredient', 'Type', 'Qty / 100g', 'Qty / Serving', 'Qty / Unit']],
                        body: ingBody,
                        theme: 'striped',
                        headStyles: { fillColor: [100, 116, 139] },
                        styles: { fontSize: 9, cellPadding: 1.5 },
                    });
                }
            }

            // --- Save ---
            const filename = `RFQ_${vendor?.companyName || 'Vendor'}_${displayDate}.pdf`;
            doc.save(filename);

        } catch (error) {
            console.error("RFQ PDF Error:", error);
            alert("Failed to generate PDF. See console for details.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Request for Quotation (RFQ)</h2>
                    <p className="text-sm text-slate-500">Manage pricing requests to vendors</p>
                </div>
                <div className="flex gap-2">
                    <input
                        placeholder="Search RFQs..."
                        className="p-2 border rounded text-sm w-64 focus:ring-2 focus:ring-blue-100 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Button icon={Icons.Plus} onClick={() => setModal({ open: true, type: 'rfq' })}>New RFQ</Button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Vendor</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Item Details</th>
                            <th className="p-4">Qty / Target</th>
                            <th className="p-4">Country</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {filtered.map(item => {
                            const details = getRfqDetails(item);
                            return (
                                <tr key={item.id} className="hover:bg-slate-50 group">
                                    <td className="p-4 text-xs text-slate-500">{formatDate(item.createdAt)}</td>
                                    <td className="p-4 font-medium text-slate-700">{getVendorName(item.vendorId)}</td>
                                    <td className="p-4">
                                        <Badge color={item.requestType === 'Custom' ? 'purple' : 'blue'}>{item.requestType}</Badge>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{details.title}</div>
                                        <div className="text-xs text-slate-500 max-w-[200px] truncate" title={details.subtitle}>{details.subtitle}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-slate-800">{item.qty} units</div>
                                        {item.targetPrice && (
                                            <div className="text-xs text-slate-500 font-mono">
                                                Target: {item.currency} {item.targetPrice}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-slate-600">{item.countryOfSale || '-'}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* PDF Button */}
                                            <button
                                                onClick={(e) => generatePDF(e, item)}
                                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                title="Download PDF"
                                            >
                                                <Icons.File className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setModal({ open: true, type: 'rfq', data: item, isEdit: true })}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                            >
                                                <Icons.Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => actions.del('rfqs', item.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Icons.Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">No RFQs found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};