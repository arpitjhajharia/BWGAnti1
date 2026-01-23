import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../utils/helpers';

export const ORSMaster = ({ data, actions, setModal }) => {
    // Added 'clients' to destructuring
    const { ors = [], vendors, clients, skus, products, formulations = [] } = data;
    const [searchTerm, setSearchTerm] = useState('');

    const getVendorName = (id) => vendors.find(v => v.id === id)?.companyName || 'Unknown Vendor';
    const getClientName = (id) => clients.find(c => c.id === id)?.companyName || 'Unknown Client';

    const getSkuDetails = (skuId) => {
        const s = skus.find(x => x.id === skuId);
        const p = products.find(x => x.id === s?.productId);
        return s && p ? `${p.name} - ${s.variant} (${s.packSize}${s.unit})` : 'Unknown Item';
    };

    const filtered = ors.filter(o =>
        getVendorName(o.vendorId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(o.clientId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const generatePDF = (e, item) => {
        e.stopPropagation();

        const type = item.recipientType || 'Vendor';

        // --- Helper Function to Create One PDF ---
        const createDoc = (targetName, suffix) => {
            const doc = new jsPDF();
            const sku = skus.find(s => s.id === item.skuId);
            const product = products.find(p => p.id === sku?.productId);
            const formulation = formulations.find(f => f.skuId === sku?.id);

            const dateObj = new Date(item.date);
            const dateWithYear = !isNaN(dateObj)
                ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
                : '-';

            const packingMaterials = formulation?.packaging?.length > 0
                ? formulation.packaging.map(p => `${p.item} (${p.qty})`).join(', ')
                : 'None / Not Linked';

            // --- Header ---
            doc.setFontSize(20);
            doc.text("OEM Request Sheet (ORS)", 105, 20, null, null, "center");

            doc.setFontSize(10);
            // Removed PO No. Line
            doc.text(`Date: ${dateWithYear}`, 14, 35);
            doc.text(`To: ${targetName}`, 14, 40); // Adjusted Y position

            // --- Main Details Table ---
            const tableBody = [
                ['Product', product?.name || '-'],
                ['Variant', sku?.variant || '-'],
                ['Flavour', sku?.flavour || '-'],
                ['Pack Details', sku ? `${sku.packSize} ${sku.unit} (${sku.packType})` : '-'],
                ['Packing Materials', packingMaterials],
                ['Quantity', `${item.qty || 0} units`],
                ['Price Terms', item.priceTerms || '-'],
                ['Country of Sale', item.countryOfSale || '-'],
                ['Lead Time', `${item.leadTime || 0} weeks`],
                ['Shelf Life', `${item.shelfLife || 0} months`],
            ];

            autoTable(doc, {
                startY: 50, // Adjusted startY
                head: [['Field', 'Value']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [51, 65, 85] },
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } }
            });

            let finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 150;

            // --- Formulation Table ---
            if (formulation?.ingredients?.length > 0) {
                if (finalY > 230) { doc.addPage(); finalY = 20; }

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text("Formulation Details:", 14, finalY + 10);
                doc.setFont(undefined, 'normal');

                const ingBody = formulation.ingredients.map(ing => [
                    ing.name,
                    ing.type || 'Active',
                    ing.per100g || '-',
                    ing.perServing || '-',
                    ing.perSku || '-'
                ]);

                autoTable(doc, {
                    startY: finalY + 15,
                    head: [['Ingredient', 'Type', 'Qty / 100g', 'Qty / Serving', 'Qty / Unit']],
                    body: ingBody,
                    theme: 'striped',
                    headStyles: { fillColor: [100, 116, 139] },
                    styles: { fontSize: 9, cellPadding: 1.5 },
                });

                finalY = doc.lastAutoTable.finalY;
            }

            // --- Documents Checklist ---
            const docsList = Object.entries(item.requiredDocs || {})
                .filter(([_, required]) => required)
                .map(([docName]) => [docName, "Required"]);

            if (docsList.length > 0) {
                if (finalY > 240) { doc.addPage(); finalY = 20; }

                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text("Required Documents:", 14, finalY + 10);
                doc.setFont(undefined, 'normal');

                autoTable(doc, {
                    startY: finalY + 15,
                    body: docsList,
                    theme: 'plain',
                    styles: { fontSize: 9, cellPadding: 1 },
                    columnStyles: { 0: { cellWidth: 100 }, 1: { fontStyle: 'bold' } }
                });
            }

            // Update filename: removed poNumber
            doc.save(`ORS_${dateWithYear}_${suffix}.pdf`);
        };

        try {
            // --- LOGIC FOR 3 SCENARIOS ---
            if (type === 'Vendor' || type === 'Both') {
                const vName = getVendorName(item.vendorId);
                createDoc(vName, 'Vendor');
            }

            if (type === 'Client' || type === 'Both') {
                const cName = getClientName(item.clientId);
                if (type === 'Both') {
                    setTimeout(() => createDoc(cName, 'Client'), 500);
                } else {
                    createDoc(cName, 'Client');
                }
            }

        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert(`Failed to generate PDF: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">OEM Request Sheets</h2>
                    <p className="text-sm text-slate-500">Manage manufacturing orders</p>
                </div>
                <div className="flex gap-2">
                    <input
                        placeholder="Search Vendor or Client..."
                        className="p-2 border rounded text-sm w-64 focus:ring-2 focus:ring-blue-100 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Button icon={Icons.Plus} onClick={() => setModal({ open: true, type: 'ors' })}>New ORS</Button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Vendor / Client</th>
                            <th className="p-4">SKU</th>
                            <th className="p-4">Qty & Cost</th>
                            <th className="p-4">Terms</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {filtered.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 group">
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{formatDate(item.date)}</div>
                                </td>
                                <td className="p-4">
                                    {/* Smart Display of Parties */}
                                    {(item.recipientType === 'Both' || !item.recipientType) && (
                                        <>
                                            <div className="text-slate-700 font-medium">V: {getVendorName(item.vendorId)}</div>
                                            <div className="text-slate-500 text-xs">C: {getClientName(item.clientId)}</div>
                                        </>
                                    )}
                                    {item.recipientType === 'Vendor' && <div className="text-slate-700 font-medium">{getVendorName(item.vendorId)}</div>}
                                    {item.recipientType === 'Client' && <div className="text-slate-700 font-medium">{getClientName(item.clientId)}</div>}
                                </td>
                                <td className="p-4">
                                    <div className="text-slate-800 font-medium max-w-[200px] truncate" title={getSkuDetails(item.skuId)}>
                                        {getSkuDetails(item.skuId)}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-slate-800">{item.qty} units</div>
                                    <div className="text-xs text-slate-500 font-mono">
                                        {item.currency} {item.costPerUnit}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Badge color="blue">{item.priceTerms || '-'}</Badge>
                                    <div className="text-[10px] text-slate-400 mt-1">{item.countryOfSale}</div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={(e) => generatePDF(e, item)}
                                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                            title="Download PDF"
                                        >
                                            <Icons.File className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setModal({ open: true, type: 'ors', data: item, isEdit: true })}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        >
                                            <Icons.Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => actions.del('ors', item.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Icons.Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">No ORS records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};