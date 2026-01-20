import React from 'react';

// Make sure "export" is right here
export const Card = ({ children, className = "" }) => (
    <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${className}`}>
        {children}
    </div>
);