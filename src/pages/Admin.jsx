import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, LogOut, LayoutGrid, CirclePlus, BarChart2, Tag, SlidersHorizontal, ShoppingBag, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { ADMIN_AUTH_EVENT, adminAuth } from '@/api/base44Client';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminProductForm from '@/components/admin/AdminProductForm';
import AdminProductList from '@/components/admin/AdminProductList';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminCategoryManager from '@/components/admin/AdminCategoryManager';
import AdminHeroManager from '@/components/admin/AdminHeroManager';
import AdminOrderList from '@/components/admin/AdminOrderList';
import AdminCommandPalette, { ADMIN_PALETTE_EVENT } from '@/components/admin/AdminCommandPalette';
import CircuitBackground from '@/components/store/fx/CircuitBackground';
import BrandLogo from '@/components/brand/BrandLogo';

export default function Admin() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [activeView, setActiveView] = useState('dashboard');
  const [editingProduct, setEditingProduct] = useState(null);
  const mobileNavRef = useRef(null);

  // Each view starts at the top, and the phone tab strip keeps the active tab in sight
  useEffect(() => {
    window.scrollTo({ top: 0 });
    mobileNavRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeView, editingProduct?.id]);

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

  // Portaled UI (selects, sheets, toasts) lives outside the admin container,
  // so force dark tokens on <html> while the admin is open.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.add('dark', 'admin-open');
    return () => {
      root.classList.remove('admin-open');
      if (!hadDark) root.classList.remove('dark');
    };
  }, []);

  const handleLogout = () => {
    adminAuth.logout();
    setSession(null);
  };

  // Still checking session
  if (session === undefined) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-[#07090f]">
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

  const navButton = (id, label, Icon, compact = false) => {
    const isActive = activeView === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => (id === 'add' ? handleCreateTab() : setActiveView(id))}
        data-active={isActive}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex shrink-0 items-center gap-3 rounded-2xl font-medium transition-colors ${
          compact ? 'h-9 px-3 text-xs' : 'h-11 w-full px-3.5 text-sm'
        } ${isActive ? 'text-white' : 'text-slate-400 hover:text-white'}`}
      >
        {isActive && (
          <motion.span
            layoutId={compact ? 'admin-nav-pill-m' : 'admin-nav-pill'}
            className="absolute inset-0 rounded-2xl border border-white/10 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          />
        )}
        <span className={`relative flex items-center justify-center ${compact ? '' : 'h-7 w-7 rounded-xl'} ${isActive && !compact ? 'bg-primary/20 text-primary' : ''}`}>
          <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </span>
        <span className="relative">{label}</span>
        {isActive && !compact && <span className="relative ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />}
      </button>
    );
  };

  const openPalette = () => window.dispatchEvent(new Event(ADMIN_PALETTE_EVENT));

  return (
    <div className="admin-shell dark relative min-h-screen overflow-x-clip bg-[#07090f] text-slate-100">
      {/* Control-room backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <CircuitBackground className="text-slate-400 opacity-40" />
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] animate-aurora rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[420px] w-[520px] animate-aurora rounded-full bg-indigo-500/10 blur-3xl [animation-delay:-8s]" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 p-3 lg:block">
          <div className="liquid-glass flex h-full flex-col rounded-[28px] p-4">
            <div className="flex items-center justify-between px-1">
              <BrandLogo size="md" subtitle="Admin" dark />
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Boutique en ligne
            </div>

            <button
              type="button"
              onClick={openPalette}
              className="mt-3 flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-400 transition-colors hover:text-white"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Rechercher…</span>
              <kbd className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
            </button>

            <nav className="mt-5 space-y-1">
              {tabs.map(({ id, label, icon }) => navButton(id, label, icon))}
            </nav>

            <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
              <Link to="/" className="flex h-10 items-center gap-3 rounded-2xl px-3.5 text-sm text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white">
                <ExternalLink className="h-4 w-4" />
                Voir la boutique
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 w-full items-center gap-3 rounded-2xl px-3.5 text-sm text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 p-3 lg:hidden">
            <div className="liquid-glass rounded-[24px]">
              <div className="flex h-14 items-center justify-between px-3">
                <BrandLogo size="sm" subtitle="Admin" dark />
                <div className="flex items-center gap-1">
                  <button type="button" onClick={openPalette} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-white/10" aria-label="Rechercher">
                    <Search className="h-4 w-4" />
                  </button>
                  <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-white/10" aria-label="Voir la boutique">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <button type="button" onClick={handleLogout} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-white/10" aria-label="Déconnexion">
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div ref={mobileNavRef} className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-white/10 px-2 py-2">
                {tabs.map(({ id, label, icon }) => navButton(id, label, icon, true))}
              </div>
            </div>
          </header>

          <main className="w-full px-4 pb-10 pt-3 sm:px-6 lg:px-8 lg:py-8">
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
