import React, { useState, useMemo } from 'react';
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { FilterHeader } from '../shared/FilterHeader';
import { formatDate } from '../../utils/helpers';

export const CompanyMaster = ({ type, data, actions, setModal, setDetailView }) => {
    const { vendors, clients, skus, products, quotesReceived, quotesSent, tasks, settings } = data;
    const isVendor = type === 'vendor';
    const listData = isVendor ? vendors : clients;
    const statusOptions = (isVendor ? settings?.vendorStatuses : settings?.leadStatuses) || [];

    const [viewMode, setViewMode] = useState('list');
    const [propertiesOpen, setPropertiesOpen] = useState(false);
    const [visibleProps, setVisibleProps] = useState({
        products: true,
        status: true,
        rollup: true,
        leadDate: true,
        source: type === 'client',
        hot: type === 'client',
        website: false
    });

    const [sort, setSort] = useState({ key: 'companyName', dir: 'asc' });
    const [colFilters, setColFilters] = useState({
        name: '',
        status: [],
        source: [],
        products: '',
        website: '',
        hot: 'All',
        nextAction: '',
        date: ''
    });

    const enrichedData = useMemo(() => {
        return listData.map(item => {
            const relatedSkus = skus.filter(s => {
                if (isVendor) {
                    const vendorQuotes = quotesReceived.filter(q => q.vendorId === item.id);
                    return vendorQuotes.some(q => q.skuId === s.id);
                } else {
                    const clientQuotes = quotesSent.filter(q => q.clientId === item.id);
                    return clientQuotes.some(q => q.skuId === s.id);
                }
            });

            const productNames = [...new Set(relatedSkus.map(s => {
                const p = products.find(prod => prod.id === s.productId);
                return p ? p.name : null;
            }).filter(Boolean))];

            const pendingTasks = tasks.filter(t => (t.relatedId === item.id || t.relatedClientId === item.id || t.relatedVendorId === item.id) && t.status !== 'Completed')
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

            return {
                ...item,
                rollupProducts: productNames,
                rollupPendingTasks: pendingTasks
            };
        });
    }, [listData, skus, products, quotesReceived, quotesSent, tasks, isVendor]);

    const filteredData = useMemo(() => {
        return enrichedData.filter(item => {
            if (colFilters.name && !item.companyName.toLowerCase().includes(colFilters.name.toLowerCase())) return false;
            if (colFilters.status.length > 0 && !colFilters.status.includes(item.status)) return false;
            if (type === 'client' && colFilters.source.length > 0 && !colFilters.source.includes(item.leadSource)) return false;

            if (colFilters.products) {
                const searchStr = colFilters.products.toLowerCase();
                if (!item.rollupProducts.some(p => p.toLowerCase().includes(searchStr))) return false;
            }

            if (colFilters.website && (!item.website || !item.website.toLowerCase().includes(colFilters.website.toLowerCase()))) return false;

            if (colFilters.hot !== 'All') {
                const isHot = item.status === 'Hot Lead';
                if (colFilters.hot === 'Yes' && !isHot) return false;
                if (colFilters.hot === 'No' && isHot) return false;
            }

            if (colFilters.nextAction) {
                const actionText = item.rollupPendingTasks.map(t => t.title).join(' ').toLowerCase();
                if (!actionText.includes(colFilters.nextAction.toLowerCase())) return false;
            }

            if (colFilters.date) {
                const dateStr = (item.leadDate || (item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : '')).toLowerCase();
                if (!dateStr.includes(colFilters.date.toLowerCase())) return false;
            }

            return true;
        }).sort((a, b) => {
            let valA, valB;
            if (sort.key === 'rollupProducts') {
                valA = a.rollupProducts.join(', ');
                valB = b.rollupProducts.join(', ');
            } else if (sort.key === 'rollupPendingTasks') {
                valA = a.rollupPendingTasks[0]?.dueDate || '9999-12-31';
                valB = b.rollupPendingTasks[0]?.dueDate || '9999-12-31';
            } else {
                valA = (a[sort.key] || '');
                valB = (b[sort.key] || '');
            }

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sort.dir === 'asc' ? -1 : 1;
            if (valA > valB) return sort.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [enrichedData, colFilters, sort, type]);

    const handleSort = (key) => {
        setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
    };

    const StatusBadge = ({ item }) => (
        <span className={`text-[10px] font-bold uppercase tracking-wider rounded px-2 py-1 border ${item.status === 'Active' || item.status === 'Hot Lead' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                item.status === 'On Hold' || item.status === 'Cold' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                    item.status === 'Blacklisted' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
            {item.status || 'Active'}
        </span>
    );

    const StatusSelect = ({ item }) => (
        <select
            className={`text-[10px] font-bold uppercase tracking-wider rounded px-2 py-1 border cursor-pointer focus:ring-0 outline-none appearance-none ${item.status === 'Active' || item.status === 'Hot Lead' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    item.status === 'On Hold' || item.status === 'Cold' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        item.status === 'Blacklisted' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                }`}
            value={item.status || ''}
            onChange={(e) => actions.update(isVendor ? 'vendors' : 'clients', item.id, { status: e.target.value })}
            onClick={(e) => e.stopPropagation()}
        >
            <option value="">Status...</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
    );

    return (
        <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="font-bold text-lg text-slate-800">{isVendor ? 'Vendors' : 'Clients'}</h2>
                    <div className="h-6 w-px bg-slate-300 mx-1"></div>
                    <div className="flex bg-slate-100 rounded p-0.5">
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`} title="List View"><Icons.Table className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('board')} className={`p-1.5 rounded ${viewMode === 'board' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`} title="Board View"><Icons.Columns className="w-4 h-4" /></button>
                    </div>
                </div>
                <div className="flex items-center gap-2 relative">
                    <div className="relative">
                        <button onClick={() => setPropertiesOpen(!propertiesOpen)} className={`text-xs font-medium px-3 py-1.5 rounded border flex items-center gap-2 hover:bg-slate-50 ${propertiesOpen ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600'}`}>
                            <Icons.Eye className="w-3.5 h-3.5" /> Properties
                        </button>
                        {propertiesOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 animate-fade-in">
                                <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider px-2">Show in list</div>
                                {Object.keys(visibleProps).map(key => (
                                    <label key={key} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded cursor-pointer">
                                        <span className="text-sm text-slate-700 capitalize">{key}</span>
                                        <input type="checkbox" checked={visibleProps[key]} onChange={() => setVisibleProps(prev => ({ ...prev, [key]: !prev[key] }))} className="rounded text-blue-600 focus:ring-0" />
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                    <Button icon={Icons.Plus} onClick={() => setModal({ open: true, type })}>New</Button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm relative">
                {viewMode === 'list' ? (
                    <div className="absolute inset-0 overflow-auto scroller">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th className="w-64">
                                        <FilterHeader label="Name" sortKey="companyName" currentSort={sort} onSort={handleSort} filterType="text" filterValue={colFilters.name} onFilter={v => setColFilters(p => ({ ...p, name: v }))} />
                                    </th>
                                    {visibleProps.status && (
                                        <th className="w-32">
                                            <FilterHeader label="Status" sortKey="status" currentSort={sort} onSort={handleSort} filterType="multi-select" filterValue={colFilters.status} onFilter={v => setColFilters(p => ({ ...p, status: v }))} options={statusOptions} />
                                        </th>
                                    )}
                                    {visibleProps.products && (
                                        <th className="w-48">
                                            <FilterHeader label="Products" sortKey="rollupProducts" currentSort={sort} onSort={handleSort} filterType="text" filterValue={colFilters.products} onFilter={v => setColFilters(p => ({ ...p, products: v }))} />
                                        </th>
                                    )}
                                    {visibleProps.rollup && (
                                        <th className="w-64">
                                            <FilterHeader label="Next Action" sortKey="rollupPendingTasks" currentSort={sort} onSort={handleSort} filterType="text" filterValue={colFilters.nextAction} onFilter={v => setColFilters(p => ({ ...p, nextAction: v }))} />
                                        </th>
                                    )}
                                    {visibleProps.leadDate && (
                                        <th className="w-32">
                                            <FilterHeader label={isVendor ? 'Created' : 'Lead Date'} sortKey={isVendor ? 'createdAt' : 'leadDate'} currentSort={sort} onSort={handleSort} filterType="text" filterValue={colFilters.date} onFilter={v => setColFilters(p => ({ ...p, date: v }))} />
                                        </th>
                                    )}
                                    {visibleProps.source && (
                                        <th className="w-32">
                                            <FilterHeader label="Source" sortKey="leadSource" currentSort={sort} onSort={handleSort} filterType="multi-select" filterValue={colFilters.source} onFilter={v => setColFilters(p => ({ ...p, source: v }))} options={settings?.leadSources || []} />
                                        </th>
                                    )}
                                    {visibleProps.hot && (
                                        <th className="w-24">
                                            <FilterHeader label="Hot?" sortKey="status" currentSort={sort} onSort={handleSort} filterType="boolean" filterValue={colFilters.hot} onFilter={v => setColFilters(p => ({ ...p, hot: v }))} />
                                        </th>
                                    )}
                                    {visibleProps.website && (
                                        <th className="w-48">
                                            <FilterHeader label="Website" sortKey="website" currentSort={sort} onSort={handleSort} filterType="text" filterValue={colFilters.website} onFilter={v => setColFilters(p => ({ ...p, website: v }))} />
                                        </th>
                                    )}
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(item => (
                                    <tr key={item.id} onClick={() => setDetailView({ open: true, type, data: item })} className="group cursor-pointer hover:bg-slate-50">
                                        <td className="font-bold text-slate-800 px-4 py-3 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm ${isVendor ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{item.companyName.charAt(0)}</div>
                                                {item.companyName}
                                            </div>
                                        </td>
                                        {visibleProps.status && (
                                            <td className="px-4 py-3 border-b border-slate-100">
                                                {isVendor ? <StatusBadge item={item} /> : <StatusSelect item={item} />}
                                            </td>
                                        )}
                                        {visibleProps.products && (
                                            <td className="px-4 py-3 border-b border-slate-100">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.rollupProducts.length > 0 ?
                                                        item.rollupProducts.slice(0, 2).map((p, i) => <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] border border-slate-200">{p}</span>)
                                                        : <span className="text-slate-300 text-xs italic">-</span>
                                                    }
                                                    {item.rollupProducts.length > 2 && <span className="text-[10px] text-slate-400">+{item.rollupProducts.length - 2}</span>}
                                                </div>
                                            </td>
                                        )}
                                        {visibleProps.rollup && (
                                            <td className="px-4 py-3 border-b border-slate-100">
                                                <div className="flex flex-col gap-1">
                                                    {item.rollupPendingTasks.length > 0 ? (
                                                        item.rollupPendingTasks.slice(0, 2).map(t => (
                                                            <div key={t.id} className="flex items-start gap-2">
                                                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${t.priority === 'High' ? 'bg-red-500' : 'bg-blue-400'}`}></div>
                                                                <div className="text-xs">
                                                                    <div className="font-medium text-slate-700 hover:text-blue-600 hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); setModal({ open: true, type: 'task', data: t, isEdit: true }) }}>{t.title}</div>
                                                                    <div className="text-slate-400 text-[10px]">{formatDate(t.dueDate)}</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : <span className="text-slate-300 text-xs">-</span>}
                                                    {item.rollupPendingTasks.length > 2 && (
                                                        <div className="text-[10px] text-slate-400 pl-3.5">+{item.rollupPendingTasks.length - 2} more</div>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {visibleProps.leadDate && <td className="text-slate-500 text-xs px-4 py-3 border-b border-slate-100">{item.leadDate ? formatDate(item.leadDate) : (item.createdAt ? formatDate(item.createdAt) : '-')}</td>}
                                        {visibleProps.source && <td className="px-4 py-3 border-b border-slate-100"><span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs border border-orange-100">{item.leadSource || 'Unknown'}</span></td>}
                                        {visibleProps.hot && <td className="px-4 py-3 border-b border-slate-100">{item.status === 'Hot Lead' && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200">HOT</span>}</td>}
                                        {visibleProps.website && (
                                            <td className="text-blue-500 text-xs truncate max-w-[150px] px-4 py-3 border-b border-slate-100">
                                                {item.website ? <a href={item.website} target="_blank" onClick={e => e.stopPropagation()} className="hover:underline flex items-center gap-1"><Icons.Link className="w-3 h-3" /> {item.website}</a> : '-'}
                                            </td>
                                        )}
                                        <td className="text-right px-4 py-3 border-b border-slate-100">
                                            <button onClick={(e) => { e.stopPropagation(); setDetailView({ open: true, type, data: item }) }} className="text-slate-400 hover:text-blue-600 p-1 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110">Open</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="absolute inset-0 overflow-x-auto overflow-y-hidden p-4 flex gap-4 bg-slate-50">
                        {statusOptions.map(status => {
                            const itemsInStatus = filteredData.filter(i => (i.status || 'Active') === status);
                            return (
                                <div key={status} className="w-72 flex-shrink-0 flex flex-col h-full">
                                    <div className="flex justify-between items-center mb-3 px-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${status === 'Active' || status === 'Hot Lead' ? 'bg-green-200 text-green-800' :
                                                    status === 'On Hold' || status === 'Cold' ? 'bg-slate-200 text-slate-700' :
                                                        status === 'Blacklisted' ? 'bg-red-200 text-red-800' :
                                                            'bg-blue-200 text-blue-800'
                                                }`}>{status}</span>
                                            <span className="text-xs text-slate-400 font-medium">{itemsInStatus.length}</span>
                                        </div>
                                        <button className="text-slate-400 hover:text-slate-600"><Icons.Plus className="w-4 h-4" /></button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto scroller pr-1 space-y-2">
                                        {itemsInStatus.map(item => (
                                            <div key={item.id} onClick={() => setDetailView({ open: true, type, data: item })} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-slate-800 text-sm">{item.companyName}</h4>
                                                    <button onClick={(e) => { e.stopPropagation(); setModal({ open: true, type, data: item, isEdit: true }) }} className="text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100"><Icons.Edit className="w-3 h-3" /></button>
                                                </div>
                                                {visibleProps.products && item.rollupProducts.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {item.rollupProducts.slice(0, 3).map((p, i) => <span key={i} className="text-[10px] px-1.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-100 rounded">{p}</span>)}
                                                    </div>
                                                )}
                                                {visibleProps.rollup && item.rollupPendingTasks.length > 0 && (
                                                    <div className="mt-3 pt-2 border-t border-slate-50 space-y-1">
                                                        {item.rollupPendingTasks.slice(0, 2).map(t => (
                                                            <div key={t.id} className="flex items-start gap-2">
                                                                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${t.priority === 'High' ? 'bg-red-500' : 'bg-blue-400'}`}></div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-xs text-slate-600 truncate">{t.title}</div>
                                                                    <div className="text-[10px] text-slate-400">{formatDate(t.dueDate)}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {item.rollupPendingTasks.length > 2 && <div className="text-[10px] text-slate-400 pl-3.5">+{item.rollupPendingTasks.length - 2} more</div>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};