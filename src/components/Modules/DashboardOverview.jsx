import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Icons } from '../ui/Icons';
import { Card } from '../ui/Card';
import { formatDate, formatMoney } from '../../utils/helpers';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="p-5 flex items-center justify-between">
        <div>
            <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 bg-${color}-50 text-${color}-600 rounded-lg`}>
            {/* NOTICE: We are using <Icon /> here, matching the prop name 'icon: Icon' */}
            <Icon className="w-6 h-6" />
        </div>
    </Card>
);

export const DashboardOverview = ({ data, actions, setActiveTab }) => {
    const { products, clients, tasks, quotesSent } = data;

    // Calculate Revenue
    const totalRevenue = quotesSent.reduce((acc, q) => acc + (q.sellingPrice * q.moq || 0), 0);

    // Prepare Chart Data
    const chartData = quotesSent.slice(0, 7).map(q => ({ name: q.quoteId, value: q.sellingPrice * q.moq }));

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Executive Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Products" value={products.length} icon={Icons.Product} color="blue" />
                <StatCard title="Active Clients" value={clients.filter(c => c.status === 'Active').length} icon={Icons.Users} color="green" />
                <StatCard title="Pending Tasks" value={tasks.filter(t => t.status !== 'Completed').length} icon={Icons.Task} color="red" />
                <StatCard title="Total Pipeline" value={formatMoney(totalRevenue)} icon={Icons.Money} color="purple" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5">
                    <h3 className="font-bold text-slate-700 mb-4">Recent Sales Activity</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#64748b' }}
                                    dy={10}
                                />
                                <YAxis
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `₹${v / 1000}k`}
                                    tick={{ fill: '#64748b' }}
                                />
                                {/* FIX 1: Make the hover cursor transparent so it doesn't show the huge grey box */}
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                {/* FIX 2: Set barSize to prevent single bars from looking strange */}
                                <Bar
                                    dataKey="value"
                                    fill="#4f46e5"
                                    radius={[4, 4, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card className="p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700">Urgent Tasks</h3>
                        <button onClick={() => setActiveTab('tasks')} className="text-sm text-blue-600 hover:underline">View All</button>
                    </div>
                    <div className="space-y-3">
                        {tasks.filter(t => t.status !== 'Completed').slice(0, 5).map(t => (
                            <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-100">
                                <div className={`w-2 h-2 rounded-full ${t.priority === 'High' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-slate-800">{t.title}</div>
                                    <div className="text-xs text-slate-500">{formatDate(t.dueDate)} • {t.assignee}</div>
                                </div>
                                <button onClick={() => actions.update('tasks', t.id, { status: 'Completed' })} className="text-xs border border-slate-200 px-2 py-1 rounded bg-white hover:bg-green-50 text-slate-600 hover:text-green-600">Done</button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};