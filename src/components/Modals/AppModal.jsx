import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { formatMoney } from '../../utils/helpers';
import { REQUIRED_DOCS } from '../../utils/constants';

export const AppModal = ({ modal, setModal, data, actions }) => {
    if (!modal.open) return null;

    const { products, skus, vendors, clients, userProfiles, quotesReceived, settings } = data;
    const [form, setForm] = useState(modal.data || {});
    // --- NEW FIX: Initialize Defaults for Dropdowns ---
    useEffect(() => {
        if (modal.open && !modal.isEdit) {
            if (modal.type === 'sku') {
                setForm(prev => ({
                    ...prev,
                    unit: prev.unit || settings?.units?.[0] || 'kg',
                    packType: prev.packType || settings?.packTypes?.[0] || 'Bag',
                    variant: prev.variant || '',
                    flavour: prev.flavour || '',
                    packSize: prev.packSize || ''
                }));
            }
            if (modal.type === 'formulation') {
                setForm(prev => ({
                    ...prev,
                    ingredients: prev.ingredients || [],
                    packaging: prev.packaging || []
                }));
            }
        }
    }, [modal.open, modal.type, modal.isEdit, settings]);

    // --- AUTOMATIONS & CALCULATIONS ---

    // Default Task Context
    useEffect(() => {
        if (modal.type === 'task' && !modal.isEdit && !form.contextType) {
            setForm(f => ({ ...f, contextType: 'Internal', priority: 'Normal' }));
        }
    }, [modal.type, modal.isEdit, form.contextType]);

    // Order Calculations
    useEffect(() => {
        if (modal.type === 'order') {
            const qty = parseFloat(form.qty) || 0;
            const rate = parseFloat(form.rate) || 0;
            const taxRate = parseFloat(form.taxRate) || 0;
            const baseAmount = qty * rate;
            const taxAmount = (baseAmount * taxRate) / 100;
            const total = baseAmount + taxAmount;
            setForm(f => ({ ...f, amount: total, taxAmount: taxAmount }));
        }
    }, [form.qty, form.rate, form.taxRate, modal.type]);

    // Auto-generate SKU Code
    // Auto-generate SKU Code (Updated)
    useEffect(() => {
        if (modal.type === 'sku' && !modal.isEdit) {
            const {
                productName = 'PROD',
                variant = '',
                packSize = '',
                unit = settings?.units?.[0] || 'kg',
                packType = settings?.packTypes?.[0] || 'Bag',
                flavour = ''
            } = form;

            const skuCode = `${productName}-${variant}-${packSize}${unit}-${packType}-${flavour}`
                .toUpperCase()
                .replace(/-+/g, '-')
                .replace(/-$/, '');

            setForm(f => {
                if (f.name === skuCode) return f;
                return { ...f, name: skuCode };
            });
        }
    }, [form.variant, form.packSize, form.unit, form.packType, form.flavour, modal.type, modal.isEdit, settings]);

    // Filter SKUs for Vendor Orders
    const isVendorOrder = vendors.some(v => v.id === form.companyId);
    const availableSkus = useMemo(() => {
        if (modal.type === 'order' && isVendorOrder) {
            return skus.filter(s => quotesReceived.some(q => q.vendorId === form.companyId && q.skuId === s.id));
        }
        return skus;
    }, [skus, quotesReceived, isVendorOrder, form.companyId, modal.type]);

    // --- HANDLERS ---

    const submit = async () => {
        const map = { product: 'products', sku: 'skus', vendor: 'vendors', client: 'clients', contact: 'contacts', quoteReceived: 'quotesReceived', quoteSent: 'quotesSent', task: 'tasks', user: 'users', order: 'orders', formulation: 'formulations', rfq: 'rfqs' };
        const col = map[modal.type];

        // Task Linking Logic
        if (col === 'tasks' && form.contextType !== 'Internal') {
            if (form.contextType === 'Client') {
                form.relatedClientId = form.relatedId;
                if (form.secondaryVendorId) form.relatedVendorId = form.secondaryVendorId;
            } else {
                form.relatedVendorId = form.relatedId;
                if (form.secondaryClientId) form.relatedClientId = form.secondaryClientId;
            }
        }

        // Order Validation
        if (col === 'orders') {
            const totalPercent = (form.paymentTerms || []).reduce((sum, t) => sum + (parseFloat(t.percent) || 0), 0);
            if (Math.abs(totalPercent - 100) > 0.1) {
                alert(`Payment milestones must sum to 100%. Current sum: ${totalPercent}%`);
                return;
            }
        }

        if (col) {
            if (modal.isEdit) await actions.update(col, modal.data.id, form);
            else await actions.add(col, form);
            setModal({ open: false, type: null, data: null, isEdit: false });
        }
    };

    // Dynamic Row Handlers (For Formulation)
    const handleArrayAdd = (field, emptyObj) => {
        const current = form[field] || [];
        setForm({ ...form, [field]: [...current, emptyObj] });
    };
    const handleArrayChange = (field, idx, subField, val) => {
        const current = [...(form[field] || [])];
        current[idx][subField] = val;
        setForm({ ...form, [field]: current });
    };
    const handleArrayDel = (field, idx) => {
        const current = [...(form[field] || [])];
        current.splice(idx, 1);
        setForm({ ...form, [field]: current });
    };

    // Payment Terms Handlers
    const handlePaymentTermAdd = () => {
        const currentTerms = form.paymentTerms || [];
        setForm({ ...form, paymentTerms: [...currentTerms, { label: '', percent: 0, status: 'Pending' }] });
    };
    const handlePaymentTermChange = (idx, field, value) => {
        const newTerms = [...(form.paymentTerms || [])];
        newTerms[idx][field] = value;
        setForm({ ...form, paymentTerms: newTerms });
    };
    const handlePaymentTermDelete = (idx) => {
        const newTerms = [...(form.paymentTerms || [])];
        newTerms.splice(idx, 1);
        setForm({ ...form, paymentTerms: newTerms });
    };
    const handleRequiredDocToggle = (docName) => {
        const currentDocs = form.docRequirements || {};
        if (currentDocs[docName]) {
            const newDocs = { ...currentDocs };
            delete newDocs[docName];
            setForm({ ...form, docRequirements: newDocs });
        } else {
            setForm({ ...form, docRequirements: { ...currentDocs, [docName]: { required: true, received: false, link: '' } } });
        }
    };

    // --- RENDER CONTENT SWITCHER ---
    const renderContent = () => {
        switch (modal.type) {
            case 'product': return (<div className="space-y-4"><h3 className="font-bold text-lg">{modal.isEdit ? 'Edit' : 'New'} Product</h3><input placeholder="Product Name" className="w-full p-2 border rounded" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /><select className="w-full p-2 border rounded" value={form.format || ''} onChange={e => setForm({ ...form, format: e.target.value })}><option value="">Select Format...</option>{(settings?.formats || []).map(f => <option key={f} value={f}>{f}</option>)}</select><input placeholder="Drive Link" className="w-full p-2 border rounded" value={form.driveLink || ''} onChange={e => setForm({ ...form, driveLink: e.target.value })} /></div>);
            case 'sku': return (<div className="space-y-4"><h3 className="font-bold text-lg">{modal.isEdit ? 'Edit' : 'New'} SKU</h3><div className="grid grid-cols-2 gap-4"><input placeholder="Variant" className="p-2 border rounded" value={form.variant || ''} onChange={e => setForm({ ...form, variant: e.target.value })} /><input placeholder="Flavour" className="p-2 border rounded" value={form.flavour || ''} onChange={e => setForm({ ...form, flavour: e.target.value })} /></div><div className="grid grid-cols-3 gap-2"><input type="number" placeholder="Size" className="p-2 border rounded" value={form.packSize || ''} onChange={e => setForm({ ...form, packSize: e.target.value })} /><select className="p-2 border rounded" value={form.unit || ''} onChange={e => setForm({ ...form, unit: e.target.value })}>{(settings?.units || []).map(u => <option key={u} value={u}>{u}</option>)}</select><select className="p-2 border rounded" value={form.packType || ''} onChange={e => setForm({ ...form, packType: e.target.value })}>{(settings?.packTypes || []).map(p => <option key={p} value={p}>{p}</option>)}</select></div><input type="number" placeholder="Std MOQ" className="w-full p-2 border rounded" value={form.standardMoq || ''} onChange={e => setForm({ ...form, standardMoq: e.target.value })} /><div className="bg-slate-100 p-2 text-xs font-mono rounded text-center font-bold text-slate-600">{form.name}</div></div>);
            case 'vendor': case 'client': return (<div className="space-y-4"><h3 className="font-bold text-lg capitalize">{modal.isEdit ? 'Edit' : 'Add'} {modal.type}</h3><input placeholder="Company Name" className="w-full p-2 border rounded" value={form.companyName || ''} onChange={e => setForm({ ...form, companyName: e.target.value })} /><div className="grid grid-cols-2 gap-4"><input placeholder="Website" className="p-2 border rounded" value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} /><input placeholder="Country" className="p-2 border rounded" value={form.country || ''} onChange={e => setForm({ ...form, country: e.target.value })} /></div>{modal.type === 'client' && (<div className="grid grid-cols-2 gap-4"><select className="p-2 border rounded" value={form.leadSource || ''} onChange={e => setForm({ ...form, leadSource: e.target.value })}><option>Source...</option>{(settings?.leadSources || []).map(s => <option key={s} value={s}>{s}</option>)}</select><input type="date" className="p-2 border rounded" value={form.leadDate || ''} onChange={e => setForm({ ...form, leadDate: e.target.value })} /></div>)}<input placeholder="Drive Folder Link" className="w-full p-2 border rounded" value={form.driveLink || ''} onChange={e => setForm({ ...form, driveLink: e.target.value })} />{modal.type === 'client' && (<select className="w-full p-2 border rounded" value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })}><option>Status...</option>{(settings?.leadStatuses || []).map(s => <option key={s} value={s}>{s}</option>)}</select>)}</div>);
            case 'task': return (<div className="space-y-4"><h3 className="font-bold text-lg">{modal.isEdit ? 'Edit' : 'New'} Task</h3><input placeholder="Title" className="w-full p-2 border rounded" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /><div className="grid grid-cols-2 gap-4"><select className="p-2 border rounded" value={form.contextType || ''} onChange={e => { setForm({ ...form, contextType: e.target.value, relatedId: null, relatedName: null }); }}><option value="Internal">Internal</option><option value="Client">Client</option><option value="Vendor">Vendor</option></select><select className="p-2 border rounded" value={form.priority || ''} onChange={e => setForm({ ...form, priority: e.target.value })}><option>Normal</option><option>High</option></select></div>{form.contextType === 'Internal' && <select className="w-full p-2 border rounded" value={form.taskGroup || ''} onChange={e => setForm({ ...form, taskGroup: e.target.value })}><option value="">Select Group...</option>{(settings?.taskGroups || []).map(g => <option key={g} value={g}>{g}</option>)}</select>}{form.contextType === 'Client' && (<><select className="w-full p-2 border rounded bg-blue-50" value={form.relatedId || ''} onChange={e => { const c = clients.find(x => x.id === e.target.value); setForm({ ...form, relatedId: c.id, relatedName: c.companyName }); }}><option>Select Client...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select><select className="w-full p-2 border rounded bg-purple-50" value={form.secondaryVendorId || ''} onChange={e => setForm({ ...form, secondaryVendorId: e.target.value })}><option value="">Link Vendor (Optional)...</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.companyName}</option>)}</select></>)}{form.contextType === 'Vendor' && (<><select className="w-full p-2 border rounded bg-purple-50" value={form.relatedId || ''} onChange={e => { const v = vendors.find(x => x.id === e.target.value); setForm({ ...form, relatedId: v.id, relatedName: v.companyName }); }}><option>Select Vendor...</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.companyName}</option>)}</select><select className="w-full p-2 border rounded bg-blue-50" value={form.secondaryClientId || ''} onChange={e => setForm({ ...form, secondaryClientId: e.target.value })}><option value="">Link Client (Optional)...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select></>)}<div className="grid grid-cols-2 gap-4"><select className="p-2 border rounded" value={form.assignee || ''} onChange={e => setForm({ ...form, assignee: e.target.value })}><option value="">Assignee...</option>{userProfiles.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}</select><input type="date" className="p-2 border rounded" value={form.dueDate || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div></div>);
            case 'quoteReceived': case 'quoteSent': return (<div className="space-y-4"><h3 className="font-bold text-lg">{modal.isEdit ? 'Edit' : 'New'} {modal.type === 'quoteReceived' ? 'Purchase Quote' : 'Sales Quote'}</h3><div className="grid grid-cols-2 gap-4"><input placeholder="Quote ID" className="p-2 border rounded" value={form.quoteId || ''} onChange={e => setForm({ ...form, quoteId: e.target.value })} /><input type="number" placeholder="MOQ" className="p-2 border rounded" value={form.moq || ''} onChange={e => setForm({ ...form, moq: e.target.value })} /></div><div className="grid grid-cols-2 gap-4">{modal.type === 'quoteReceived' ? (<select className="p-2 border rounded" value={form.vendorId || ''} onChange={e => setForm({ ...form, vendorId: e.target.value })}><option>Select Vendor...</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.companyName}</option>)}</select>) : (<select className="p-2 border rounded" value={form.clientId || ''} onChange={e => setForm({ ...form, clientId: e.target.value })}><option>Select Client...</option>{clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}</select>)}<select className="p-2 border rounded" value={form.skuId || ''} onChange={e => setForm({ ...form, skuId: e.target.value })}><option>Select SKU...</option>{skus.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>{(modal.type === 'quoteReceived' || modal.type === 'quoteSent') && (<input placeholder="Quote Doc (Drive Link)" className="w-full p-2 border rounded" value={form.driveLink || ''} onChange={e => setForm({ ...form, driveLink: e.target.value })} />)}{modal.type === 'quoteSent' && form.skuId && (<div className="bg-slate-50 p-2 rounded text-xs border border-slate-200"><p className="font-bold mb-2">Base Cost Link (Select one):</p><div className="max-h-24 overflow-y-auto">{quotesReceived.filter(q => q.skuId === form.skuId).map(q => { const v = vendors.find(x => x.id === q.vendorId); return <label key={q.id} className="block cursor-pointer hover:bg-slate-100 p-1"><input type="radio" name="baseCost" checked={form.baseCostId === q.id} onChange={() => setForm({ ...form, baseCostId: q.id, baseCostPrice: q.price })} /><span className="ml-2">{q.quoteId} ({v?.companyName}) - {formatMoney(q.price, q.currency)} (MOQ: {q.moq})</span></label> })}</div></div>)}<div className="grid grid-cols-2 gap-4"><input type="number" placeholder="Price" className="p-2 border rounded" value={modal.type === 'quoteReceived' ? form.price : form.sellingPrice} onChange={e => setForm({ ...form, [modal.type === 'quoteReceived' ? 'price' : 'sellingPrice']: e.target.value })} /><select className="p-2 border rounded" value={form.currency || 'INR'} onChange={e => setForm({ ...form, currency: e.target.value })}><option>INR</option><option>USD</option></select></div>{modal.type === 'quoteSent' && (<select className="w-full p-2 border rounded mt-4" value={form.status || ''} onChange={e => setForm({ ...form, status: e.target.value })}><option>Draft</option><option>Active</option><option>Closed</option></select>)}</div>);
            case 'order':
                const totalMilestonePercent = (form.paymentTerms || []).reduce((sum, t) => sum + (parseFloat(t.percent) || 0), 0);
                const percentError = Math.abs(totalMilestonePercent - 100) > 0.1;

                return (
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                        <h3 className="font-bold text-lg">{modal.isEdit ? 'Edit' : 'New'} Order</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" className="p-2 border rounded" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
                            <input placeholder="Order ID" className="p-2 border rounded" value={form.orderId || ''} onChange={e => setForm({ ...form, orderId: e.target.value })} />
                        </div>
                        <select className="w-full p-2 border rounded" value={form.skuId || ''} onChange={e => setForm({ ...form, skuId: e.target.value })}>
                            <option value="">Select SKU...</option>
                            {availableSkus.map(s => <option key={s.id} value={s.id}>{s.name} ({s.variant})</option>)}
                        </select>
                        <div className="grid grid-cols-3 gap-2">
                            <input type="number" placeholder="Qty" className="p-2 border rounded" value={form.qty || ''} onChange={e => setForm({ ...form, qty: e.target.value })} />
                            <input type="number" placeholder="Rate" className="p-2 border rounded" value={form.rate || ''} onChange={e => setForm({ ...form, rate: e.target.value })} />
                            <div className="relative">
                                <input type="number" placeholder="Tax %" className="p-2 border rounded w-full pr-6" value={form.taxRate || ''} onChange={e => setForm({ ...form, taxRate: e.target.value })} />
                                <span className="absolute right-2 top-2 text-slate-400 text-sm">%</span>
                            </div>
                        </div>
                        <div className="text-right font-bold text-lg text-slate-700 bg-slate-50 p-2 rounded">
                            Total: {formatMoney(form.amount)}
                            <div className="text-[10px] text-slate-400 font-normal">Includes Tax: {formatMoney(form.taxAmount)}</div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="font-bold text-sm text-slate-700">Payment Terms</label>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold ${percentError ? 'text-red-500' : 'text-green-500'}`}>Total: {totalMilestonePercent}%</span>
                                    <button onClick={handlePaymentTermAdd} className="text-xs text-blue-600 hover:underline">+ Add Milestone</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {(form.paymentTerms || []).map((term, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-1 rounded">
                                        <input placeholder="Label (e.g. Advance)" className="text-xs p-1 border rounded flex-1" value={term.label} onChange={e => handlePaymentTermChange(idx, 'label', e.target.value)} />
                                        <input type="number" placeholder="%" className="text-xs p-1 border rounded w-12" value={term.percent} onChange={e => handlePaymentTermChange(idx, 'percent', parseFloat(e.target.value))} />
                                        <span className="text-xs text-slate-500 w-16 text-right">{formatMoney((form.amount || 0) * (term.percent / 100))}</span>
                                        <button onClick={() => handlePaymentTermDelete(idx)} className="text-red-400 hover:text-red-600"><Icons.X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                                {(form.paymentTerms?.length === 0 || !form.paymentTerms) && <div className="text-xs text-slate-400 italic">No payment terms defined.</div>}
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <label className="font-bold text-sm text-slate-700 mb-2 block">Required Documents Configuration</label>
                            <div className="grid grid-cols-2 gap-2">
                                {REQUIRED_DOCS.map(doc => {
                                    const isRequired = form.docRequirements?.[doc];
                                    return (
                                        <label key={doc} className={`flex items-center gap-2 text-xs cursor-pointer p-1 rounded border transition-colors ${isRequired ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                                            <input
                                                type="checkbox"
                                                checked={!!isRequired}
                                                onChange={() => handleRequiredDocToggle(doc)}
                                                className="rounded text-blue-600 focus:ring-0"
                                            />
                                            {doc}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            case 'formulation': return (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    <h3 className="font-bold text-lg">{modal.isEdit ? 'Edit' : 'New'} Formulation</h3>

                    {/* Header Info */}
                    <div className="space-y-3 p-3 bg-slate-50 rounded border border-slate-100">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Linked SKU</label>
                        <select className="w-full p-2 border rounded bg-white" value={form.skuId || ''} onChange={e => setForm({ ...form, skuId: e.target.value })}>
                            <option value="">Select SKU...</option>
                            {skus.map(s => {
                                const p = products.find(x => x.id === s.productId);
                                return <option key={s.id} value={s.id}>{p?.name} ({s.variant})</option>
                            })}
                        </select>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serving Size</label>
                                <input placeholder="e.g. 30g" className="w-full p-2 border rounded" value={form.servingSize || ''} onChange={e => setForm({ ...form, servingSize: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Batch Size (Ref)</label>
                                <input placeholder="e.g. 100kg" className="w-full p-2 border rounded" value={form.batchSize || ''} onChange={e => setForm({ ...form, batchSize: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Ingredients Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-1">
                            <h4 className="font-bold text-slate-700 text-sm">Ingredients</h4>
                            {/* Updated Add Button to include new fields */}
                            <button onClick={() => handleArrayAdd('ingredients', { name: '', type: 'Active', per100g: '', perServing: '', perSku: '' })} className="text-xs text-blue-600 hover:underline">+ Add Ingredient</button>
                        </div>
                        <div className="space-y-2">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                <div>Name</div>
                                <div>Type</div>
                                <div>/100g</div>
                                <div>/Serv</div>
                                <div>/SKU</div>
                                <div></div>
                            </div>
                            {(form.ingredients || []).map((ing, i) => (
                                <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                                    <input placeholder="Name" className="text-xs p-2 border rounded" value={ing.name} onChange={e => handleArrayChange('ingredients', i, 'name', e.target.value)} />

                                    {/* Type Selector */}
                                    <select className="text-xs p-2 border rounded bg-white" value={ing.type || 'Active'} onChange={e => handleArrayChange('ingredients', i, 'type', e.target.value)}>
                                        <option value="Active">Active</option>
                                        <option value="Other">Other</option>
                                    </select>

                                    <input placeholder="0" type="number" step="any" className="text-xs p-2 border rounded" value={ing.per100g} onChange={e => handleArrayChange('ingredients', i, 'per100g', e.target.value)} />
                                    <input placeholder="0" type="number" step="any" className="text-xs p-2 border rounded" value={ing.perServing} onChange={e => handleArrayChange('ingredients', i, 'perServing', e.target.value)} />
                                    {/* New Dosage Per SKU Field */}
                                    <input placeholder="0" type="number" step="any" className="text-xs p-2 border rounded" value={ing.perSku} onChange={e => handleArrayChange('ingredients', i, 'perSku', e.target.value)} />

                                    <button onClick={() => handleArrayDel('ingredients', i)} className="text-slate-400 hover:text-red-500"><Icons.X className="w-4 h-4" /></button>
                                </div>
                            ))}
                            {(form.ingredients?.length === 0 || !form.ingredients) && <div className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded">No ingredients added yet.</div>}
                        </div>
                    </div>

                    {/* Packaging Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-1">
                            <h4 className="font-bold text-slate-700 text-sm">Packaging Materials</h4>
                            <button onClick={() => handleArrayAdd('packaging', { item: '', qty: '' })} className="text-xs text-blue-600 hover:underline">+ Add Material</button>
                        </div>
                        <div className="space-y-2">
                            {(form.packaging || []).map((pack, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input placeholder="Item Name (e.g. Jar, Scoop)" className="text-xs p-2 border rounded flex-[3]" value={pack.item} onChange={e => handleArrayChange('packaging', i, 'item', e.target.value)} />
                                    <input placeholder="Qty" className="text-xs p-2 border rounded flex-1" value={pack.qty} onChange={e => handleArrayChange('packaging', i, 'qty', e.target.value)} />
                                    <button onClick={() => handleArrayDel('packaging', i)} className="text-slate-400 hover:text-red-500"><Icons.X className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
            case 'rfq':
                // --- HELPER: Determine Type & IDs safely ---
                // Default to 'SKU' if undefined, or handle 'Other'
                const currentType = (form.rfqType === 'Other') ? 'Other' : 'SKU';
                const safeLinkedId = String(form.linkedId || '');

                // --- HELPER: Find Formulation (Safety Checked) ---
                // We use ?. to ensure we don't crash if data.formulations is loading
                const activeFormulation = (data.formulations || []).find(f => String(f?.skuId) === safeLinkedId);

                // --- HELPER: Get Related Item Name (Safe) ---
                const getItemName = () => {
                    try {
                        if (currentType === 'SKU' && safeLinkedId) {
                            const s = (skus || []).find(x => String(x.id) === safeLinkedId);
                            if (!s) return 'Unknown SKU';

                            const p = (products || []).find(x => x.id === s.productId);
                            return p ? `${p.name} - ${s.variant}` : 'Unknown Product';
                        }
                        return form.customName || 'Custom Item';
                    } catch (e) { return 'Item'; }
                };

                // --- HELPER: Filter Contacts ---
                const companyContacts = (data.contacts || []).filter(c => c.companyId === form.companyId);

                // --- HELPER: Generate Email Body (Crash Proof) ---
                const generateBody = () => {
                    try {
                        const s = (skus || []).find(x => String(x.id) === safeLinkedId);
                        const p = s ? (products || []).find(x => x.id === s.productId) : null;

                        let body = `Dear ${form.emailToName || 'Partner'},\n\nI hope this email finds you well.\n\nWe are looking to procure the following item:\n`;

                        if (currentType === 'SKU' && s && p) {
                            // Standard Details (With fallbacks for everything)
                            body += `\nProduct: ${p.name || '-'}`;
                            body += `\nFormat: ${p.format || '-'}`;
                            body += `\nVariant: ${s.variant || '-'}`;
                            body += `\nFlavour: ${s.flavour || 'N/A'}`;
                            body += `\nPack Size: ${s.packSize || ''}${s.unit || ''} ${s.packType || ''}`;

                            // OPTIONAL: Formulation Table
                            if (activeFormulation?.ingredients && Array.isArray(activeFormulation.ingredients)) {
                                if (activeFormulation.ingredients.length > 0) {
                                    body += `\n\nFORMULATION / ACTIVE INGREDIENTS:`;
                                    body += `\n-------------------------------------------------------------`;
                                    body += `\nIngredient Name       | Type       | Dosage`;
                                    body += `\n-------------------------------------------------------------`;

                                    activeFormulation.ingredients.forEach(ing => {
                                        const name = (ing?.name || '').padEnd(22, ' ');
                                        const type = (ing?.type || 'Active').padEnd(11, ' ');
                                        const dosage = (ing?.perSku || ing?.perServing || ing?.per100g || '-');
                                        body += `\n${name}| ${type}| ${dosage}`;
                                    });
                                    body += `\n-------------------------------------------------------------`;
                                }
                            }

                            // OPTIONAL: Packaging List
                            if (activeFormulation?.packaging && Array.isArray(activeFormulation.packaging)) {
                                if (activeFormulation.packaging.length > 0) {
                                    body += `\n\nPACKAGING REQUIREMENTS:`;
                                    activeFormulation.packaging.forEach(pack => {
                                        body += `\n- ${pack?.item || 'Item'}: ${pack?.qty || '-'}`;
                                    });
                                }
                            }

                        } else if (form.customDetails) {
                            body += `\n\nItem: ${form.customName || ''}`;
                            body += `\nSpecifications:\n${form.customDetails || ''}`;
                        }

                        // Common Footer
                        body += `\n\nQuantity: ${form.qty || 'TBD'}`;
                        body += `\nTarget Price: ${form.targetPrice ? formatMoney(form.targetPrice) : 'Best feasible'}`;
                        body += `\n\nCould you please provide your best quote and lead time for this?`;
                        body += `\n\nRFQ Ref: ${modal.data?.id ? modal.data.id.substr(0, 8) : 'New'}`;
                        body += `\n\nBest regards,`;

                        return body;
                    } catch (error) {
                        return "Error generating email preview. Please check item details.";
                    }
                };

                const rfqSubject = `RFQ ${form.orderId || 'Request'}: Quote for ${getItemName()} - Biowearth`;
                const rfqBody = generateBody();

                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">{modal.isEdit ? 'Edit' : 'New'} RFQ</h3>
                            {modal.isEdit && modal.data?.id && <Badge color="blue">ID: {modal.data.id.substr(0, 8)}</Badge>}
                        </div>

                        {/* 1. SELECTION TYPE */}
                        <div className="p-3 bg-slate-50 rounded border border-slate-100">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Request Type</label>
                            <div className="flex gap-4">
                                {['SKU', 'Other'].map(type => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="rfqType"
                                            checked={currentType === type}
                                            onChange={() => setForm({ ...form, rfqType: type, linkedId: '', customName: '' })}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">{type === 'Other' ? 'Custom / Service' : 'Product SKU'}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 2. ITEM DETAILS */}
                        <div className="space-y-3">
                            {currentType === 'SKU' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select SKU</label>
                                    <select
                                        className="w-full p-2 border rounded font-medium text-slate-700"
                                        value={form.linkedId || ''}
                                        onChange={e => setForm({ ...form, linkedId: e.target.value })}
                                    >
                                        <option value="">Choose an SKU...</option>
                                        {(skus || []).map(s => {
                                            const p = (products || []).find(x => x.id === s.productId);
                                            // Safe rendering even if product name is missing
                                            return (
                                                <option key={s.id} value={s.id}>
                                                    {p?.name || 'Unknown'} - {s.variant} {s.flavour} ({s.packSize}{s.unit})
                                                </option>
                                            )
                                        })}
                                    </select>
                                </div>
                            )}

                            {currentType === 'Other' && (
                                <div className="space-y-2">
                                    <input placeholder="Item Name / Service" className="w-full p-2 border rounded" value={form.customName || ''} onChange={e => setForm({ ...form, customName: e.target.value })} />
                                    <textarea placeholder="Detailed Specs..." className="w-full p-2 border rounded h-16 text-xs" value={form.customDetails || ''} onChange={e => setForm({ ...form, customDetails: e.target.value })} />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Qty" className="p-2 border rounded" value={form.qty || ''} onChange={e => setForm({ ...form, qty: e.target.value })} />
                                <input type="number" placeholder="Target Price" className="p-2 border rounded" value={form.targetPrice || ''} onChange={e => setForm({ ...form, targetPrice: e.target.value })} />
                            </div>
                        </div>

                        {/* 3. VENDOR & CONTACT SELECTION */}
                        <div className="border-t border-slate-100 pt-4 space-y-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Recipient Details</label>
                            <select className="w-full p-2 border rounded font-bold text-slate-700" value={form.companyId || ''} onChange={e => setForm({ ...form, companyId: e.target.value, emailTo: '', emailCc: [] })}>
                                <option value="">Select Vendor/Client...</option>
                                <optgroup label="Vendors">{vendors.map(v => <option key={v.id} value={v.id}>{v.companyName}</option>)}</optgroup>
                                <optgroup label="Clients">{clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}</optgroup>
                            </select>

                            {form.companyId && (
                                <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded border border-blue-100">
                                    <div>
                                        <label className="block text-[10px] font-bold text-blue-500 uppercase mb-1">Email To</label>
                                        <select
                                            className="w-full p-1.5 text-sm border rounded"
                                            value={form.emailTo || ''}
                                            onChange={e => {
                                                const c = companyContacts.find(x => x.email === e.target.value);
                                                setForm({ ...form, emailTo: e.target.value, emailToName: c?.name });
                                            }}
                                        >
                                            <option value="">Select Contact...</option>
                                            {companyContacts.map(c => <option key={c.id} value={c.email}>{c.name} ({c.email})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-blue-500 uppercase mb-1">CC (Hold Cmd/Ctrl to Select)</label>
                                        <select
                                            multiple
                                            className="w-full p-1.5 text-sm border rounded h-20"
                                            value={form.emailCc || []}
                                            onChange={e => setForm({ ...form, emailCc: Array.from(e.target.selectedOptions, o => o.value) })}
                                        >
                                            {companyContacts.filter(c => c.email !== form.emailTo).map(c => <option key={c.id} value={c.email}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. EMAIL GENERATOR PREVIEW */}
                        {form.companyId && (
                            <div className="border-t border-slate-100 pt-4">
                                <label className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase mb-2">
                                    <span>Generated Email Preview</span>
                                    <span className="text-[10px] font-normal text-slate-400">Copy-paste to your email client</span>
                                </label>
                                <div className="bg-slate-800 text-slate-200 rounded-lg p-3 text-xs font-mono space-y-3">
                                    {/* TO / CC Section */}
                                    <div className="pb-2 border-b border-slate-700">
                                        <div className="flex gap-2 mb-1">
                                            <span className="text-slate-500 w-8">To:</span>
                                            <span className="text-white select-all">{form.emailTo || '...'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-slate-500 w-8">CC:</span>
                                            {/* SAFETY: Check if emailCc is array before join */}
                                            <span className="text-slate-400 select-all">{Array.isArray(form.emailCc) ? form.emailCc.join('; ') : ''}</span>
                                        </div>
                                    </div>

                                    {/* Subject Line */}
                                    <div className="flex gap-2 items-center group">
                                        <span className="text-slate-500 w-8 shrink-0">Sub:</span>
                                        <div className="flex-1 text-yellow-400 select-all whitespace-nowrap overflow-x-auto">{rfqSubject}</div>
                                        <button onClick={() => navigator.clipboard.writeText(rfqSubject)} className="opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-slate-700 hover:bg-white hover:text-slate-900 rounded text-[10px] transition-all">Copy</button>
                                    </div>

                                    {/* Body */}
                                    <div className="relative group pt-2 border-t border-slate-700">
                                        <div className="whitespace-pre-wrap select-all">{rfqBody}</div>
                                        <button onClick={() => navigator.clipboard.writeText(rfqBody)} className="absolute top-2 right-0 opacity-0 group-hover:opacity-100 px-2 py-0.5 bg-slate-700 hover:bg-white hover:text-slate-900 rounded text-[10px] transition-all">Copy Body</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status for saving */}
                        <div className="text-right pt-2">
                            <label className="text-xs text-slate-400 mr-2">Internal Status:</label>
                            <select className="p-1 border rounded text-xs" value={form.status || 'Open'} onChange={e => setForm({ ...form, status: e.target.value })}>
                                <option value="Open">Open</option>
                                <option value="Sent">Sent</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                    </div>
                );
            case 'user': return (<div className="space-y-4"><h3 className="font-bold text-lg">{modal.isEdit ? 'Edit' : 'Add'} User</h3><input placeholder="Full Name" className="w-full p-2 border rounded" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /><input placeholder="Username" className="w-full p-2 border rounded" value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} /><input placeholder="Password" type="password" className="w-full p-2 border rounded" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} /><select className="w-full p-2 border rounded" value={form.role || ''} onChange={e => setForm({ ...form, role: e.target.value })}><option value="Staff">Staff</option><option value="Admin">Admin</option></select></div>);
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[95vh] overflow-y-auto">
                {renderContent()}
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="secondary" onClick={() => setModal({ open: false, type: null, data: null, isEdit: false })}>Cancel</Button>
                    <Button onClick={submit}>Save Changes</Button>
                </div>
            </div>
        </div>
    );
};

