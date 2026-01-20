import React, { useState } from 'react';
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate, formatMoney } from '../../utils/helpers';

export const RFQMaster = ({ data, actions, setModal }) => {
    const { rfqs, products, skus, vendors, clients } = data;
    const [filterType, setFilterType] = useState('All');

    // HELPER: Get Clean SKU Details for Table (Robust Fix)
    const getRelatedDetails = (rfq) => {
        // If it has a linkedId, treat it as an SKU lookup
        if (rfq.linkedId && rfq.rfqType !== 'Other') {
            const s = skus.find(x => String(x.id) === String(rfq.linkedId));
            const p = products.find(x => x.id === s?.productId);

            if (!s || !p) return { title: 'Unknown SKU', subtitle: 'Item details missing' };

            // Title: "Whey Protein - Isolate Chocolate"
            const title = `${p.name} - ${s.variant} ${s.flavour || ''}`;
            // Subtitle: "Format: Powder • Pack: 1kg Jar"
            const subtitle = `Format: ${p.format || '-'} • Pack: ${s.packSize}${s.unit} ${s.packType}`;
            return { title, subtitle };
        } else {
            // Fallback for Custom Items
            return { title: rfq.customName || 'Custom Item', subtitle: rfq.customDetails || '-' };
        }
    };

    const getCompanyName = (id) => {
        const v = vendors.find(x => x.id === id);
        if (v) return v.companyName;
        const c = clients.find(x => x.id === id);
        return c ? c.companyName : '-';
    };

    const filteredRfqs = rfqs.filter(r => filterType === 'All' || r.rfqType === filterType);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Request for Quotation (RFQ)</h2>
                    <p className="text-sm text-slate-500">Manage procurement and pricing requests</p>
                </div>
                <div className="flex gap-2">
                    <select className="text-sm border rounded p-2" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="All">All Types</option>
                        <option value="SKU">SKU RFQs</option>
                        <option value="Other">Custom RFQs</option>
                    </select>
                    <Button icon={Icons.Plus} onClick={() => setModal({ open: true, type: 'rfq' })}>New RFQ</Button>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Type</th>
                            <th className="p-4">Item Details</th>
                            <th className="p-4">Vendor/Client</th>
                            <th className="p-4">Qty / Target</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredRfqs.map(rfq => {
                            const details = getRelatedDetails(rfq);
                            return (
                                <tr key={rfq.id} className="hover:bg-slate-50">
                                    <td className="p-4 text-slate-500">{formatDate(rfq.createdAt)}</td>
                                    <td className="p-4">
                                        <Badge color={rfq.rfqType === 'Other' ? 'purple' : 'blue'}>{rfq.rfqType || 'SKU'}</Badge>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{details.title}</div>
                                        <div className="text-xs text-slate-500">{details.subtitle}</div>
                                    </td>
                                    <td className="p-4 font-medium text-slate-600">{getCompanyName(rfq.companyId)}</td>
                                    <td className="p-4">
                                        <div className="text-slate-800">{rfq.qty} units</div>
                                        {rfq.targetPrice && <div className="text-xs text-slate-400">Target: {formatMoney(rfq.targetPrice)}</div>}
                                    </td>
                                    <td className="p-4">
                                        <Badge color={rfq.status === 'Open' ? 'green' : 'slate'}>{rfq.status || 'Open'}</Badge>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => setModal({ open: true, type: 'rfq', data: rfq, isEdit: true })} className="p-1 text-slate-400 hover:text-blue-600"><Icons.Edit className="w-4 h-4" /></button>
                                        <button onClick={() => actions.del('rfqs', rfq.id)} className="p-1 text-slate-400 hover:text-red-600"><Icons.Trash className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredRfqs.length === 0 && (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">No RFQs found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};