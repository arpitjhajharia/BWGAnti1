import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../ui/Icons';

export const FilterHeader = ({ label, sortKey, currentSort, onSort, filterType, filterValue, onFilter, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => { if (ref.current && !ref.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMultiSelect = (option) => {
        const current = Array.isArray(filterValue) ? filterValue : [];
        const updated = current.includes(option) ? current.filter(i => i !== option) : [...current, option];
        onFilter(updated);
    };

    return (
        <div className="flex flex-col gap-1 align-bottom">
            <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600 group" onClick={() => onSort(sortKey)}>
                <span>{label}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-blue-500">
                    {currentSort.key === sortKey ? (currentSort.dir === 'asc' ? '↑' : '↓') : '↕'}
                </span>
            </div>

            {filterType === 'text' && (
                <input
                    className="w-full text-xs p-1 border rounded font-normal bg-white focus:ring-1 focus:ring-blue-200 outline-none"
                    placeholder="Filter..."
                    value={filterValue || ''}
                    onChange={e => onFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                />
            )}

            {filterType === 'multi-select' && (
                <div className="relative" ref={ref}>
                    <div
                        className="w-full text-xs p-1 border rounded font-normal bg-white cursor-pointer flex justify-between items-center"
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    >
                        <span className="truncate">
                            {(!filterValue || filterValue.length === 0) ? 'All' : `${filterValue.length} selected`}
                        </span>
                        <Icons.ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                    {isOpen && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 rounded shadow-lg z-50 p-2 max-h-60 overflow-y-auto">
                            <div className="mb-2 pb-2 border-b border-slate-100 flex justify-between">
                                <button className="text-[10px] text-blue-600 hover:underline" onClick={() => onFilter([])}>Clear</button>
                                <button className="text-[10px] text-blue-600 hover:underline" onClick={() => onFilter(options)}>Select All</button>
                            </div>
                            {options.map(opt => (
                                <label key={opt} className="flex items-center gap-2 p-1 hover:bg-slate-50 cursor-pointer text-xs">
                                    <input
                                        type="checkbox"
                                        checked={(filterValue || []).includes(opt)}
                                        onChange={() => handleMultiSelect(opt)}
                                        className="rounded text-blue-600 focus:ring-0 w-3 h-3"
                                    />
                                    <span className="truncate">{opt}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {filterType === 'boolean' && (
                <select
                    className="w-full text-xs p-1 border rounded font-normal bg-white focus:ring-1 focus:ring-blue-200 outline-none"
                    value={filterValue || 'All'}
                    onChange={e => onFilter(e.target.value)}
                    onClick={e => e.stopPropagation()}
                >
                    <option value="All">All</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                </select>
            )}
        </div>
    );
};