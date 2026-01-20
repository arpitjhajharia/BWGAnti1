import React from 'react';

export const Badge = ({ children, color = "blue", size = "sm" }) => {
    const colors = {
        blue: "bg-blue-100 text-blue-800",
        green: "bg-green-100 text-green-800",
        yellow: "bg-yellow-100 text-yellow-800",
        red: "bg-red-100 text-red-800",
        purple: "bg-purple-100 text-purple-800",
        slate: "bg-slate-100 text-slate-800",
        cyan: "bg-cyan-100 text-cyan-800",
        orange: "bg-orange-100 text-orange-800",
        pink: "bg-pink-100 text-pink-800"
    };

    return (
        <span className={`rounded-full font-medium ${colors[color] || colors.slate} ${size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'}`}>
            {children}
        </span>
    );
};