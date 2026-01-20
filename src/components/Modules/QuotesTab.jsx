import React, { useState } from 'react';
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatMoney } from '../../utils/helpers';

export const QuotesTab = ({ data, actions, setModal }) => {
    const { quotesReceived, quotesSent, vendors, clients, skus } = data;
    const [view, setView] = useState('purchase');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex bg-slate-200 p-1 rounded-lg">
                    <button onClick={() => setView('purchase')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'purchase' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Purchase Quotes (In)</button>
                    <button onClick={() => setView('sales')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'sales' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sales Quotes (Out)</button>
                </div>
                <Button icon={Icons.Plus} onClick={() => setModal({ open: true, type: view === 'purchase' ? 'quoteReceived' : 'quoteSent' })}>New Quote</Button>
            </div>
            <Card className="overflow-hidden">
                <div className="overflow-x-auto scroller">
                    {view === 'purchase' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">ID</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">Vendor</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">SKU</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">MOQ</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b text-right">Price</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b text-right">Total</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">Sales Ref</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">Doc</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotesReceived.map(q => {
                                    const v = vendors.find(x => x.id === q.vendorId);
                                    const s = skus.find(x => x.id === q.skuId);
                                    const linkedSQ = quotesSent.find(sq => sq.baseCostId === q.id);
                                    return (
                                        <tr key={q.id} className="group hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                            <td className="px-4 py-3 text-xs font-bold text-slate-500">{q.quoteId}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{v?.companyName || 'Unknown'}</td>
                                            <td className="px-4 py-3 text-xs text-slate-600">{s?.name || 'Unknown SKU'}</td>
                                            <td className="px-4 py-3">{q.moq}</td>
                                            <td className="px-4 py-3 text-right text-slate-700">{formatMoney(q.price, q.currency)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">{formatMoney(q.price * q.moq, q.currency)}</td>
                                            <td className="px-4 py-3">{linkedSQ ? <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 font-medium">{linkedSQ.quoteId}</span> : <span className="text-xs text-slate-400">-</span>}</td>
                                            <td className="px-4 py-3">{q.driveLink && <a href={q.driveLink} target="_blank" className="text-blue-500 hover:text-blue-700"><Icons.File /></a>}</td>
                                            <td className="px-4 py-3 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setModal({ open: true, type: 'quoteReceived', data: q, isEdit: true })} className="text-slate-400 hover:text-blue-500 p-1"><Icons.Edit className="w-4 h-4" /></button>
                                                <button onClick={() => actions.del('quotesReceived', q.id)} className="text-slate-400 hover:text-red-500 p-1"><Icons.X className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">ID</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">Client</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">SKU</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">MOQ</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b text-right">Price</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b text-right">Total</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">Status</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">Base Cost</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">Margin</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b">Doc</th>
                                    <th className="px-4 py-3 bg-slate-50 text-xs font-bold text-slate-500 border-b"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotesSent.map(q => {
                                    const c = clients.find(x => x.id === q.clientId);
                                    const s = skus.find(x => x.id === q.skuId);
                                    const baseQuote = quotesReceived.find(bq => bq.id === q.baseCostId);
                                    const baseVendor = vendors.find(v => v.id === baseQuote?.vendorId);
                                    const totalRevenue = q.sellingPrice * q.moq;
                                    const totalCost = q.baseCostPrice * q.moq;
                                    const totalMargin = totalRevenue - totalCost;
                                    const marginPct = totalCost ? ((totalMargin / totalCost) * 100).toFixed(1) : 0;

                                    return (
                                        <tr key={q.id} className="group hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                            <td className="px-4 py-3 text-xs font-bold text-slate-500">{q.quoteId}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{c?.companyName || 'Unknown'}</td>
                                            <td className="px-4 py-3 text-xs text-slate-600">{s?.name || 'Unknown SKU'}</td>
                                            <td className="px-4 py-3">{q.moq}</td>
                                            <td className="px-4 py-3 text-right text-slate-700">{formatMoney(q.sellingPrice)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800">{formatMoney(totalRevenue)}</td>
                                            <td className="px-4 py-3"><Badge color={q.status === 'Active' ? 'green' : q.status === 'Closed' ? 'slate' : 'yellow'}>{q.status || 'Draft'}</Badge></td>
                                            <td className="px-4 py-3">
                                                {baseQuote ? (
                                                    <div className="text-xs wrap-text text-slate-500">
                                                        <span className="font-medium text-slate-700">{baseVendor?.companyName || 'Unknown'}</span> @ {formatMoney(baseQuote.price)}
                                                    </div>
                                                ) : <span className="text-xs text-red-400">Missing Base</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-xs">
                                                    <span className={`font-bold ${marginPct > 20 ? 'text-green-600' : marginPct > 10 ? 'text-yellow-600' : 'text-red-600'}`}>{formatMoney(totalMargin)}</span>
                                                    <span className="text-slate-400 ml-1">({marginPct}%)</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{q.driveLink && <a href={q.driveLink} target="_blank" className="text-blue-500 hover:text-blue-700"><Icons.File /></a>}</td>
                                            <td className="px-4 py-3 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setModal({ open: true, type: 'quoteSent', data: q, isEdit: true })} className="text-slate-400 hover:text-blue-500 p-1"><Icons.Edit className="w-4 h-4" /></button>
                                                <button onClick={() => actions.del('quotesSent', q.id)} className="text-slate-400 hover:text-red-500 p-1"><Icons.X className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
    );
};