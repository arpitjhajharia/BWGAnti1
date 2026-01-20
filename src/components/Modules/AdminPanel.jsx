import React, { useState } from 'react';
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

const SettingsCard = ({ title, settingKey, items, actions }) => {
    const [newItem, setNewItem] = useState('');
    const add = () => {
        if (newItem && !items.includes(newItem)) {
            actions.updateSetting(settingKey, [...items, newItem]);
            setNewItem('');
        }
    };
    const remove = (item) => {
        if (confirm(`Remove ${item}?`)) actions.updateSetting(settingKey, items.filter(i => i !== item));
    };
    return (
        <Card className="p-4 h-full flex flex-col">
            <h3 className="font-bold text-slate-700 mb-3">{title}</h3>
            <div className="flex gap-2 mb-2">
                <input className="border rounded text-sm p-1 flex-1" placeholder="Add new..." value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
                <Button size="sm" onClick={add}>+</Button>
            </div>
            <div className="flex-1 overflow-y-auto max-h-40 space-y-1">
                {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-1 bg-slate-50 rounded group">
                        <span>{item}</span>
                        <button onClick={() => remove(item)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">×</button>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export const AdminPanel = ({ currentUser, data, actions, setModal }) => {
    if (currentUser.role !== 'Admin') return <div className="p-10 text-center text-red-500">Access Denied</div>;

    const [subTab, setSubTab] = useState('users');
    const { userProfiles, settings } = data;

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-slate-200 pb-2">
                <button onClick={() => setSubTab('users')} className={`px-4 py-2 font-bold ${subTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Users</button>
                <button onClick={() => setSubTab('settings')} className={`px-4 py-2 font-bold ${subTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>System Settings</button>
            </div>
            {subTab === 'users' ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-700">User Management</h2>
                        <Button icon={Icons.Plus} onClick={() => setModal({ open: true, type: 'user' })}>Add User</Button>
                    </div>
                    <Card className="overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead><tr><th className="px-4 py-3 border-b">Name</th><th className="px-4 py-3 border-b">Username</th><th className="px-4 py-3 border-b">Role</th><th className="px-4 py-3 border-b">Actions</th></tr></thead>
                            <tbody>
                                {userProfiles.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 border-b last:border-0 border-slate-100">
                                        <td className="font-medium px-4 py-3">{u.name}</td>
                                        <td className="px-4 py-3">{u.username}</td>
                                        <td className="px-4 py-3"><Badge color={u.role === 'Admin' ? 'purple' : 'blue'}>{u.role}</Badge></td>
                                        <td className="flex gap-2 px-4 py-3">
                                            <button onClick={() => setModal({ open: true, type: 'user', data: u, isEdit: true })} className="text-blue-500"><Icons.Edit className="w-4 h-4" /></button>
                                            {u.username !== 'admin' && <button onClick={() => actions.del('users', u.id)} className="text-red-500"><Icons.X className="w-4 h-4" /></button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-700">Dropdown Configuration</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SettingsCard title="Product Formats" settingKey="formats" items={settings.formats} actions={actions} />
                        <SettingsCard title="SKU Units" settingKey="units" items={settings.units} actions={actions} />
                        <SettingsCard title="Pack Types" settingKey="packTypes" items={settings.packTypes} actions={actions} />
                        <SettingsCard title="Lead Sources" settingKey="leadSources" items={settings.leadSources} actions={actions} />
                        <SettingsCard title="Lead Statuses" settingKey="leadStatuses" items={settings.leadStatuses} actions={actions} />
                        <SettingsCard title="Internal Task Groups" settingKey="taskGroups" items={settings.taskGroups} actions={actions} />
                        <SettingsCard title="Vendor Statuses" settingKey="vendorStatuses" items={settings.vendorStatuses} actions={actions} />
                    </div>
                </div>
            )}
        </div>
    );
};