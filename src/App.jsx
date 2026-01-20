import React, { useState } from 'react';
import { Icons } from './components/ui/Icons';
import { useBiowearthData } from './hooks/useBiowearthData';
import { LoginScreen } from './components/LoginScreen';

// Modules
import { DashboardOverview } from './components/modules/DashboardOverview';
import { ProductMaster } from './components/modules/ProductMaster';
import { CompanyMaster } from './components/modules/CompanyMaster';
import { QuotesTab } from './components/modules/QuotesTab';
import { TaskBoard } from './components/modules/TaskBoard';
import { AdminPanel } from './components/modules/AdminPanel';

// Modals
import { AppModal } from './components/modals/AppModal';
import { DetailDashboard } from './components/modals/DetailDashboard';
import { ActiveQuotesModal } from './components/modals/ActiveQuotesModal';

function App() {
  const { loading, data, actions, currentUser, setCurrentUser } = useBiowearthData();
  const [activeTab, setActiveTab] = useState('dashboard');

  // UI State
  const [modal, setModal] = useState({ open: false, type: null, data: null, isEdit: false });
  const [detailView, setDetailView] = useState({ open: false, type: null, data: null });
  const [activeQuotesView, setActiveQuotesView] = useState({ open: false, productId: null });

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-400">Loading Biowearth OS...</div>;
  if (!currentUser) return <LoginScreen userProfiles={data.userProfiles} onLogin={setCurrentUser} />;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'products', label: 'Products', icon: Icons.Product },
    { id: 'vendors', label: 'Vendors', icon: Icons.Factory },
    { id: 'clients', label: 'Clients', icon: Icons.Users },
    { id: 'quotes', label: 'Quotes', icon: Icons.Money },
    { id: 'tasks', label: 'Tasks', icon: Icons.Task },
  ];

  if (currentUser.role === 'Admin') {
    navItems.push({ id: 'admin', label: 'Admin', icon: Icons.Admin });
  }

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-50">
      {/* DESKTOP HEADER */}
      <header className="hidden lg:flex fixed top-0 w-full h-16 bg-slate-900 text-white z-40 items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-lg">B</div>
          <span className="font-bold tracking-tight text-lg">Biowearth OS</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map(i => (
            <button key={i.id} onClick={() => setActiveTab(i.id)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === i.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}>
              <i.icon className="w-4 h-4" /> {i.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold">{currentUser.name}</div>
            <div className="text-[10px] text-blue-400 uppercase tracking-wider">{currentUser.role}</div>
          </div>
          <button onClick={() => setCurrentUser(null)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Logout"><Icons.Logout className="w-5 h-5" /></button>
        </div>
      </header>

      {/* MOBILE TOP BAR */}
      <div className="lg:hidden fixed top-0 w-full h-16 bg-slate-900 text-white z-40 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold">B</div>
          <span className="font-bold">Biowearth</span>
        </div>
        <button onClick={() => setCurrentUser(null)} className="text-slate-400"><Icons.Logout className="w-5 h-5" /></button>
      </div>

      <main className="pt-20 pb-24 lg:pt-20 lg:pb-8 px-4 lg:px-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {activeTab === 'dashboard' && <DashboardOverview data={data} actions={actions} setActiveTab={setActiveTab} />}
          {activeTab === 'products' && <ProductMaster data={data} actions={actions} setModal={setModal} setActiveQuotesView={setActiveQuotesView} />}
          {activeTab === 'vendors' && <CompanyMaster type="vendor" data={data} actions={actions} setModal={setModal} setDetailView={setDetailView} />}
          {activeTab === 'clients' && <CompanyMaster type="client" data={data} actions={actions} setModal={setModal} setDetailView={setDetailView} />}
          {activeTab === 'quotes' && <QuotesTab data={data} actions={actions} setModal={setModal} />}
          {activeTab === 'tasks' && <TaskBoard data={data} actions={actions} setModal={setModal} />}
          {activeTab === 'admin' && <AdminPanel currentUser={currentUser} data={data} actions={actions} setModal={setModal} />}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 z-40 flex justify-around py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map(i => (
          <button key={i.id} onClick={() => setActiveTab(i.id)} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${activeTab === i.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <i.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{i.label}</span>
          </button>
        ))}
      </nav>

      {/* OVERLAYS */}
      <AppModal modal={modal} setModal={setModal} data={data} actions={actions} />
      <DetailDashboard detailView={detailView} setDetailView={setDetailView} data={data} actions={actions} setModal={setModal} userProfiles={data.userProfiles} />
      <ActiveQuotesModal activeQuotesView={activeQuotesView} setActiveQuotesView={setActiveQuotesView} data={data} />
    </div>
  );
}

export default App;