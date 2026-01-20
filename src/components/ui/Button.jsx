import React from 'react';

// Make sure "export" is right here
export const Button = ({ children, onClick, variant = "primary", icon: I, className = "", size = "md" }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center rounded font-medium transition-colors ${variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'} ${size === 'sm' ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'} ${className}`}
    >
        {I && <I className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />}
        {children}
    </button>
);