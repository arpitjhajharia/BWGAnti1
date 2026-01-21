import React, { useState } from 'react';
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate, formatMoney } from '../../utils/helpers';

export const ORSMaster = ({ data, actions, setModal }) => {
    const { ors, vendors, skus, products } = data;
    const [searchTerm, setSearchTerm] = useState('');

    const getVendorName = (id) => vendors.find(v => v.id === id)?.companyName || 'Unknown Vendor';

    const getSkuDetails = (skuId) => {
        const s = skus.find(x => x.id === skuId);
        const p = products.find(x => x.id === s?.productId);
        return s && p ? `${p.name} - ${s.variant} (${s.packSize}${s.unit})` : 'Unknown Item';
    };

    const filtered = ors.filter(o =>
        (o.poNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVendorName(o.vendorId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">OEM Request Sheets (ORS)</h2>
                    <p className="text-sm text-slate-500">Production orders and manufacturing specifications</p>
                </div>
                <div className="flex gap-2">
                    <input
                        placeholder="Search PO or Vendor..."
                        className="p-2 border rounded text-sm w-64"
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
                            <th className="p-4">Date / PO #</th>
                            <th className="p-4">Vendor</th>
                            <th className="p-4">Product SKU</th>
                            <th className="p-4">Commercials</th>
                            <th className="p-4">Lead Time</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {filtered.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{item.poNumber || 'Draft'}</div>
                                    <div className="text-xs text-slate-500">{formatDate(item.date)}</div>
                                </td>
                                <td className="p-4 font-medium text-slate-600">{getVendorName(item.vendorId)}</td>
                                <td className="p-4">
                                    <div className="text-slate-800 font-medium">{getSkuDetails(item.skuId)}</div>
                                    <Badge color="slate">{item.countryOfSale || 'Domestic'}</Badge>
                                </td>
                                <td className="p-4">
                                    <div className="text-slate-800">{item.qty} units</div>
                                    <div className="text-xs text-slate-500 font-mono">
                                        {/* Display Currency and Amount to 2 decimals */}
                                        {item.currency || 'INR'} {parseFloat(item.price || 0).toFixed(2)}
                                    </div>
                                    <div className="text-[10px] text-slate-400">{item.priceTerms}</div>
                                </td>
                                <td className="p-4 text-slate-600">
                                    <div className="flex items-center gap-1">
                                        <Icons.Task className="w-4 h-4 text-slate-400" />
                                        <span>{item.leadTimeWeeks ? `${item.leadTimeWeeks} Weeks` : '-'}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => setModal({ open: true, type: 'ors', data: item, isEdit: true })} className="p-1 text-slate-400 hover:text-blue-600"><Icons.Edit className="w-4 h-4" /></button>
                                    <button onClick={() => actions.del('ors', item.id)} className="p-1 text-slate-400 hover:text-red-600"><Icons.Trash className="w-4 h-4" /></button>
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