import React, { useState } from 'react';
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../utils/helpers';

export const Formulations = ({ data, actions, setModal }) => {
    const { formulations, skus, products } = data;
    const [expandedId, setExpandedId] = useState(null);

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
                                        <Icons.File className="w-5 h-5" />
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
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Packaging</div>
                                        <div className="font-bold text-slate-700">{(f.packaging || []).length} items</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setModal({ open: true, type: 'formulation', data: f, isEdit: true }) }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-600"><Icons.Edit className="w-4 h-4" /></button>
                                        <button onClick={(e) => { e.stopPropagation(); actions.del('formulations', f.id) }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-600"><Icons.Trash className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>

                            {/* EXPANDED DETAILS */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-6 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
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
                                                        <th className="px-3 py-2 text-right">Dosage / 100g</th>
                                                        <th className="px-3 py-2 text-right">Dosage / Serv.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(f.ingredients || []).map((ing, idx) => (
                                                        <tr key={idx}>
                                                            <td className="px-3 py-2 font-medium text-slate-700">{ing.name}</td>
                                                            <td className="px-3 py-2 text-right text-slate-600">{ing.per100g}</td>
                                                            <td className="px-3 py-2 text-right text-slate-600">{ing.perServing}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
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

                {formulations.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                        No formulations added yet. Click "New Formulation" to start.
                    </div>
                )}
            </div>
        </div>
    );
};