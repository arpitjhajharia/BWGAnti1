import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../utils/helpers';

export const Formulations = ({ data, actions, setModal, targetFormulationId }) => {
    const { formulations, skus, products } = data;
    const [expandedId, setExpandedId] = useState(null);

    // Auto-expand if a specific ID is targeted (from Product Module)
    useEffect(() => {
        if (targetFormulationId) {
            // Fix: Wrap in setTimeout to avoid synchronous state update warning
            setTimeout(() => setExpandedId(targetFormulationId), 0);
        }
    }, [targetFormulationId]);

    const calculateTotal = (ingredients, field) => {
        return ingredients.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0).toFixed(2);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Formulations Database</h2>
                    <p className="text-sm text-slate-500">Manage recipes and packaging BOMs</p>
                </div>
                <Button icon={Icons.Plus} onClick={() => setModal({ open: true, type: 'formulation' })}>New Formulation</Button>
            </div>

            <div className="space-y-4">
                {formulations.map(f => {
                    const s = skus.find(i => i.id === f.skuId);
                    const p = products.find(i => i.id === s?.productId);
                    const isExpanded = expandedId === f.id;

                    return (
                        <div key={f.id} className={`bg-white rounded-lg border border-slate-200 transition-all ${isExpanded ? 'ring-2 ring-blue-100 shadow-md' : 'hover:shadow-sm'}`}>
                            {/* HEADER ROW */}
                            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : f.id)}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                        <Icons.List className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                            {p?.name || 'Unknown Product'}
                                            <span className="text-sm font-normal text-slate-500">({s?.variant})</span>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Serving Size: <span className="font-mono font-bold">{f.servingSize}</span> • Updated: {formatDate(f.createdAt)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Ingredients</div>
                                        <div className="font-bold text-slate-700">{(f.ingredients || []).length} items</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setModal({ open: true, type: 'formulation', data: f, isEdit: true }) }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-600"><Icons.Edit className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); actions.del('formulations', f.id) }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-600"><Icons.Trash className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>

                            {/* EXPANDED DETAILS */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                                    {/* Ingredients Table */}
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                            <Icons.List className="w-4 h-4" /> Ingredient List
                                        </h4>
                                        <div className="bg-white rounded border border-slate-200 overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-xs text-slate-500 font-semibold border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left">Ingredient</th>
                                                        <th className="px-3 py-2 text-left w-20">Type</th>
                                                        <th className="px-3 py-2 text-right">/ 100g</th>
                                                        <th className="px-3 py-2 text-right">/ Serv.</th>
                                                        <th className="px-3 py-2 text-right bg-blue-50/50">/ SKU</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(f.ingredients || []).map((ing, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-3 py-2 font-medium text-slate-700">{ing.name}</td>
                                                            <td className="px-3 py-2">
                                                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${ing.type === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                                    {ing.type || 'Active'}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-right text-slate-600">{ing.per100g}</td>
                                                            <td className="px-3 py-2 text-right text-slate-600">{ing.perServing}</td>
                                                            <td className="px-3 py-2 text-right font-medium text-slate-800 bg-blue-50/30">{ing.perSku}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                {/* Auto-Total Footer */}
                                                <tfoot className="bg-slate-50 font-bold text-xs text-slate-700 border-t border-slate-200">
                                                    <tr>
                                                        <td colSpan="2" className="px-3 py-2 text-right uppercase tracking-wider text-slate-500">Total</td>
                                                        <td className="px-3 py-2 text-right">{calculateTotal(f.ingredients || [], 'per100g')}</td>
                                                        <td className="px-3 py-2 text-right">{calculateTotal(f.ingredients || [], 'perServing')}</td>
                                                        <td className="px-3 py-2 text-right bg-blue-100/30">{calculateTotal(f.ingredients || [], 'perSku')}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Packaging Table */}
                                    <div>
                                        <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                                            <Icons.Box className="w-4 h-4" /> Packaging BOM
                                        </h4>
                                        <div className="bg-white rounded border border-slate-200 overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-xs text-slate-500 font-semibold border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left">Material Item</th>
                                                        <th className="px-3 py-2 text-right">Quantity</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(f.packaging || []).map((pack, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-3 py-2 font-medium text-slate-700">{pack.item}</td>
                                                            <td className="px-3 py-2 text-right text-slate-600">{pack.qty}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};