import React, { useState, useMemo } from 'react';
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatMoney } from '../../utils/helpers';

// Added onNavigateToFormulation prop
export const ProductMaster = ({ data, actions, setModal, setActiveQuotesView, onNavigateToFormulation }) => {
    const { products, skus, vendors, quotesReceived, quotesSent } = data;
    const { settings } = data;

    const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
    const [filterFormat, setFilterFormat] = useState('All');
    const [localSearch, setLocalSearch] = useState('');
    const [expandedProduct, setExpandedProduct] = useState(null);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (filterFormat !== 'All' && p.format !== filterFormat) return false;
            if (localSearch && !String(p.name).toLowerCase().includes(localSearch.toLowerCase())) return false;
            return true;
        }).sort((a, b) => {
            const valA = (a[sort.key] || '').toLowerCase();
            const valB = (b[sort.key] || '').toLowerCase();
            return sort.dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });
    }, [products, filterFormat, localSearch, sort]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none"><Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 ring-blue-100 outline-none w-full md:w-64" placeholder="Search products..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} /></div>
                    <div className="flex items-center gap-2"><Icons.Filter className="text-slate-400 w-4 h-4" /><select className="text-sm border-none bg-transparent focus:ring-0 font-medium text-slate-600 cursor-pointer" onChange={e => setFilterFormat(e.target.value)}><option value="All">All Formats</option>{(settings?.formats || []).map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                    <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs text-slate-400">Sort:</span>
                        <select className="text-sm border-none bg-transparent focus:ring-0 font-medium text-slate-600 cursor-pointer" onChange={e => setSort(prev => ({ ...prev, key: e.target.value }))}><option value="name">Name</option><option value="format">Format</option></select>
                        <button onClick={() => setSort(prev => ({ ...prev, dir: prev.dir === 'asc' ? 'desc' : 'asc' }))} className="text-slate-500 hover:text-blue-600">{sort.dir === 'asc' ? <Icons.ArrowUp className="w-3 h-3" /> : <Icons.ArrowDown className="w-3 h-3" />}</button>
                    </div>
                </div>
                <Button icon={Icons.Plus} onClick={() => setModal({ open: true, type: 'product' })}>New Product</Button>
            </div>
            <div className="space-y-4">
                {filteredProducts.map(p => {
                    const pSkus = skus.filter(s => s.productId === p.id);
                    const isExpanded = expandedProduct === p.id;
                    const skuIds = pSkus.map(s => s.id);
                    const supplierIds = [...new Set(quotesReceived.filter(q => skuIds.includes(q.skuId)).map(q => q.vendorId))];
                    const suppliers = vendors.filter(v => supplierIds.includes(v.id));
                    const clientIds = [...new Set(quotesSent.filter(q => skuIds.includes(q.skuId)).map(q => q.clientId))];
                    const activeQuotesCount = quotesSent.filter(q => skuIds.includes(q.skuId) && q.status === 'Active').length;

                    return (
                        <div key={p.id} className={`bg-white rounded-lg border border-slate-200 transition-all duration-200 ${isExpanded ? 'ring-2 ring-blue-100 shadow-md' : 'hover:shadow-sm'}`}>
                            <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpandedProduct(isExpanded ? null : p.id)}>
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-slate-600 bg-slate-100`}>{p.name.charAt(0)}</div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-bold text-lg text-slate-800">{p.name}</h3>
                                            <Badge color="slate">{p.format}</Badge>
                                            {p.driveLink && <a href={p.driveLink} target="_blank" onClick={e => e.stopPropagation()} className="text-blue-400 hover:text-blue-600"><Icons.Link className="w-4 h-4" /></a>}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                            <span>{pSkus.length} Variants</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span>{suppliers.length} Suppliers</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span>{clientIds.length} Clients</span>
                                            {activeQuotesCount > 0 && (
                                                <>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span
                                                        onClick={(e) => { e.stopPropagation(); setActiveQuotesView({ open: true, productId: p.id }); }}
                                                        className="text-green-600 font-bold hover:underline cursor-pointer bg-green-50 px-1.5 py-0.5 rounded border border-green-200"
                                                    >
                                                        {activeQuotesCount} Active Quotes
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4"><button onClick={(e) => { e.stopPropagation(); setModal({ open: true, type: 'product', data: p, isEdit: true }) }} className="text-slate-300 hover:text-blue-500"><Icons.Edit className="w-4 h-4" /></button>{isExpanded ? <Icons.ChevronDown className="text-slate-400" /> : <Icons.ChevronRight className="text-slate-400" />}</div>
                            </div>
                            {isExpanded && (<div className="border-t border-slate-100 bg-slate-50/50 p-5 animate-fade-in"><div className="flex justify-between items-center mb-3"><h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">SKU Configuration & Pricing</h4><Button size="sm" variant="secondary" onClick={() => setModal({ open: true, type: 'sku', data: { productId: p.id, productName: p.name } })}>+ Add Variant</Button></div>{pSkus.length > 0 ? (<div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm"><table className="w-full text-sm"><thead className="bg-slate-50 text-xs text-slate-500 font-semibold border-b border-slate-100"><tr><th className="px-4 py-3 text-left">Variant</th><th className="px-4 py-3 text-left">Pack</th><th className="px-4 py-3 text-left">Code</th><th className="px-4 py-3 text-left">Latest Cost</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{pSkus.map(s => {
                                const latestBuy = quotesReceived.filter(q => q.skuId === s.id).sort((a, b) => b.createdAt - a.createdAt)[0]; return (<tr key={s.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-700">{s.variant} {s.flavour && <span className="block text-xs text-slate-400 font-normal">{s.flavour}</span>}</td><td className="px-4 py-3 text-slate-600">{s.packSize}{s.unit} ({s.packType})</td><td className="px-4 py-3 font-mono text-xs text-slate-500">{s.name}</td><td className="px-4 py-3">{latestBuy ? (<div><div className="font-medium text-slate-700">{formatMoney(latestBuy.price, latestBuy.currency)}</div><div className="text-[10px] text-slate-400">via {vendors.find(v => v.id === latestBuy.vendorId)?.companyName}</div></div>) : <span className="text-xs text-slate-400 italic">No quotes</span>}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-2">
                                    <button onClick={() => onNavigateToFormulation(s.id)} className="p-1 hover:bg-purple-50 rounded text-purple-500" title="View Formulation"><Icons.List className="w-3 h-3" /></button>
                                    <button onClick={() => setModal({ open: true, type: 'sku', data: s, isEdit: true })} className="p-1 hover:bg-blue-50 rounded text-blue-500"><Icons.Edit className="w-3 h-3" /></button><button onClick={() => actions.del('skus', s.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Icons.X className="w-3 h-3" /></button></div></td></tr>);
                            })}</tbody></table></div>) : (<div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400">No SKUs added yet. Click "Add Variant" to configure.</div>)}</div>)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};