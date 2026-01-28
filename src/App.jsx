import logo from './assets/logo.png';
import React, { useState } from 'react';
import { Icons } from './components/ui/Icons';
import { useBiowearthData } from './hooks/useBiowearthData';
import { LoginScreen } from './components/LoginScreen';

// Modules
import { DashboardOverview } from './components/modules/DashboardOverview';
import { ProductMaster } from './components/modules/ProductMaster';
import { Formulations } from './components/modules/Formulations';
import { CompanyMaster } from './components/modules/CompanyMaster';
import { QuotesTab } from './components/modules/QuotesTab';
import { TaskBoard } from './components/modules/TaskBoard';
import { AdminPanel } from './components/modules/AdminPanel';
import { ORSMaster } from './components/modules/ORSMaster';
import { RFQMaster } from './components/modules/RFQMaster'; // <--- Import RFQMaster

// Modals
import { AppModal } from './components/modals/AppModal';
import { DetailDashboard } from './components/modals/DetailDashboard';
import { ActiveQuotesModal } from './components/modals/ActiveQuotesModal';

function App() {
  const { loading, data, actions, currentUser, setCurrentUser } = useBiowearthData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // UI State
  const [modal, setModal] = useState({ open: false, type: null, data: null, isEdit: false });
  const [detailView, setDetailView] = useState({ open: false, type: null, data: null });
  const [activeQuotesView, setActiveQuotesView] = useState({ open: false, productId: null });
  const [targetFormulationId, setTargetFormulationId] = useState(null);

  if (loading) return <div className="h-screen flex items-center justify-center text-slate-400">Loading Biowearth OS...</div>;
  if (!currentUser) return <LoginScreen userProfiles={data.userProfiles} onLogin={setCurrentUser} />;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'products', label: 'Products', icon: Icons.Product },
    { id: 'formulations', label: 'Formulations', icon: Icons.List },
    { id: 'ors', label: 'ORS', icon: Icons.File },
    { id: 'rfq', label: 'RFQs', icon: Icons.Mail }, // <--- Added RFQ Menu Item
    { id: 'vendors', label: 'Vendors', icon: Icons.Factory },
    { id: 'clients', label: 'Clients', icon: Icons.Users },
    { id: 'quotes', label: 'Quotes', icon: Icons.Money },
    { id: 'tasks', label: 'Tasks', icon: Icons.Task },
  ];

  if (currentUser.role === 'Admin') {
    navItems.push({ id: 'admin', label: 'Admin', icon: Icons.Admin });
  }

  const handleNavClick = (id) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
    setTargetFormulationId(null);
  };

  const handleFormulationNavigation = (skuId) => {
    const found = data.formulations.find(f => f.skuId === skuId);
    if (found) {
      setTargetFormulationId(found.id);
      setActiveTab('formulations');
    } else {
      if (confirm("No formulation found for this SKU. Create one now?")) {
        setActiveTab('formulations');
        setModal({ open: true, type: 'formulation', data: { skuId } });
      }
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-slate-50 flex flex-col">

      {/* --- TOP HEADER --- */}
      <header className="fixed top-0 w-full h-16 bg-slate-900 text-white z-40 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
            <Icons.Menu className="w-6 h-6" />
          </button>
          {/* --- BRANDING / LOGO --- */}
          <div className="flex items-center gap-3 select-none cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <img
              src={logo}
              alt="Biowearth Dashboard"
              className="h-12 w-auto object-contain" /* Adjust h-10 to h-12 if you want it bigger */
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold">{currentUser.name}</div>
            <div className="text-[10px] text-blue-400 uppercase tracking-wider">{currentUser.role}</div>
          </div>
          <button onClick={() => setCurrentUser(null)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Logout"><Icons.Logout className="w-5 h-5" /></button>
        </div>
      </header>

      {/* --- SIDEBAR --- */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <span className="font-bold text-slate-800 text-lg">Menu</span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-red-500"><Icons.X className="w-6 h-6" /></button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-70px)]">
          {navItems.map(i => (
            <button key={i.id} onClick={() => handleNavClick(i.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === i.id ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <i.icon className={`w-5 h-5 ${activeTab === i.id ? 'text-blue-600' : 'text-slate-400'}`} />
              {i.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* --- CONTENT --- */}
      <main className="flex-1 pt-20 pb-6 px-4 lg:px-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {activeTab === 'dashboard' && <DashboardOverview data={data} actions={actions} setActiveTab={setActiveTab} />}
          {activeTab === 'products' && <ProductMaster data={data} actions={actions} setModal={setModal} setActiveQuotesView={setActiveQuotesView} onNavigateToFormulation={handleFormulationNavigation} />}
          {activeTab === 'formulations' && <Formulations data={data} actions={actions} setModal={setModal} targetFormulationId={targetFormulationId} />}
          {activeTab === 'ors' && <ORSMaster data={data} actions={actions} setModal={setModal} />}
          {activeTab === 'rfq' && <RFQMaster data={data} actions={actions} setModal={setModal} />} {/* <--- Render RFQ */}
          {activeTab === 'vendors' && <CompanyMaster type="vendor" data={data} actions={actions} setModal={setModal} setDetailView={setDetailView} />}
          {activeTab === 'clients' && <CompanyMaster type="client" data={data} actions={actions} setModal={setModal} setDetailView={setDetailView} />}
          {activeTab === 'quotes' && <QuotesTab data={data} actions={actions} setModal={setModal} />}
          {activeTab === 'tasks' && <TaskBoard data={data} actions={actions} setModal={setModal} />}
          {activeTab === 'admin' && <AdminPanel currentUser={currentUser} data={data} actions={actions} setModal={setModal} />}
        </div>
      </main>

      <AppModal modal={modal} setModal={setModal} data={data} actions={actions} currentUser={currentUser} />
      <DetailDashboard detailView={detailView} setDetailView={setDetailView} data={data} actions={actions} setModal={setModal} userProfiles={data.userProfiles} />
      <ActiveQuotesModal activeQuotesView={activeQuotesView} setActiveQuotesView={setActiveQuotesView} data={data} />
    </div>
  );
}

export default App;