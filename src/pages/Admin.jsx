import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, LogOut, LayoutGrid, CirclePlus, BarChart2, Tag, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_AUTH_EVENT, adminAuth } from '@/api/base44Client';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminProductForm from '@/components/admin/AdminProductForm';
import AdminProductList from '@/components/admin/AdminProductList';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminCategoryManager from '@/components/admin/AdminCategoryManager';
import AdminHeroManager from '@/components/admin/AdminHeroManager';
import AdminOrderList from '@/components/admin/AdminOrderList';
import AdminCommandPalette from '@/components/admin/AdminCommandPalette';
import BrandLogo from '@/components/brand/BrandLogo';

export default function Admin() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [activeView, setActiveView] = useState('dashboard');
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    let mounted = true;
    adminAuth.getSession().then((session) => {
      if (mounted) setSession(session);
    });

    const handleAuthChange = () => {
      adminAuth.getSession().then((session) => {
        if (mounted) setSession(session);
      });
    };
    window.addEventListener(ADMIN_AUTH_EVENT, handleAuthChange);

    return () => {
      mounted = false;
      window.removeEventListener(ADMIN_AUTH_EVENT, handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    adminAuth.logout();
    setSession(null);
  };

  // Still checking session
  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AdminLogin />;
  }

  const tabs = [
    { id: 'dashboard',  label: 'Tableau de bord', icon: BarChart2 },
    { id: 'orders',     label: 'Commandes',        icon: ShoppingBag },
    { id: 'products',   label: 'Produits',          icon: LayoutGrid },
    { id: 'add',        label: editingProduct ? 'Modifier' : 'Ajouter', icon: CirclePlus },
    { id: 'categories', label: 'Catégories',        icon: Tag },
    { id: 'hero',       label: 'Hero Section',      icon: SlidersHorizontal },
  ];

  const handleCreateTab = () => {
    setEditingProduct(null);
    setActiveView('add');
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setActiveView('add');
  };

  const handleFormSaved = () => {
    setEditingProduct(null);
    setActiveView('products');
  };

  const handleStayEditing = (product) => {
    setEditingProduct(product);
    setActiveView('add');
  };

  const handleFormCancel = () => {
    setEditingProduct(null);
    setActiveView('products');
  };

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/10 bg-[#0d1426]/95 px-4 py-4 lg:flex lg:flex-col">
          <BrandLogo size="md" subtitle="Admin" dark className="mb-8" />

          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeView === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => (id === 'add' ? handleCreateTab() : setActiveView(id))}
                  className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
            <Link to="/">
              <Button variant="ghost" className="h-10 w-full justify-start text-slate-400 hover:bg-white/[0.06] hover:text-white">
                <ExternalLink className="mr-2 h-4 w-4" />
                Voir la boutique
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="h-10 w-full justify-start text-slate-400 hover:bg-white/[0.06] hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1020]/90 backdrop-blur-xl lg:hidden">
            <div className="flex h-16 items-center justify-between px-4">
              <BrandLogo size="sm" subtitle="Admin" dark />
              <div className="flex items-center gap-1">
                <Link to="/">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-white/[0.06] hover:text-white" aria-label="Voir la boutique">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:bg-white/[0.06] hover:text-white" aria-label="Déconnexion">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-white/10 px-4">
              <div className="flex min-w-max items-center gap-2 py-2">
                {tabs.map(({ id, label, icon: Icon }) => {
                  const isActive = activeView === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => (id === 'add' ? handleCreateTab() : setActiveView(id))}
                      className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-white/[0.04] text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          <main className="w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {activeView === 'dashboard' && (
              <div className="mx-auto w-full max-w-7xl">
                <AdminDashboard />
              </div>
            )}
            {activeView === 'orders' && (
              <div className="mx-auto w-full max-w-5xl">
                <AdminOrderList />
              </div>
            )}
            {activeView === 'add' && (
              <div className="mx-auto w-full max-w-3xl">
                <AdminProductForm
                  product={editingProduct}
                  onSaved={handleFormSaved}
                  onStayEditing={handleStayEditing}
                  onCancel={editingProduct ? handleFormCancel : null}
                />
              </div>
            )}
            {activeView === 'products' && (
              <div className="mx-auto w-full max-w-7xl">
                <AdminProductList
                  onEdit={handleEditProduct}
                  editingProductId={editingProduct?.id}
                />
              </div>
            )}
            {activeView === 'categories' && (
              <div className="mx-auto w-full max-w-6xl">
                <AdminCategoryManager />
              </div>
            )}
            {activeView === 'hero' && (
              <div className="mx-auto w-full max-w-6xl">
                <AdminHeroManager />
              </div>
            )}
          </main>
        </div>
      </div>
      <AdminCommandPalette
        onViewChange={(view) => {
          if (view === 'add') setEditingProduct(null);
          setActiveView(view);
        }}
        onEditProduct={handleEditProduct}
      />
    </div>
  );
}
