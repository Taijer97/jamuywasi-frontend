import React, { Suspense } from 'react';
import { lazyWithRetry } from './utils/chunkErrors';
import { BRAND_LOGO_URL } from './data/brand';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/Home/HomeDashboard';
import { MarketplaceDashboard } from './components/Marketplace/MarketplaceDashboard';
import { CatalogView } from './components/Catalog/CatalogView';
import { RedirectHome } from './components/Common/RedirectHome';
import { FloatingCartButton } from './components/Catalog/FloatingCartButton';
import { CartStoreSwitchDialog } from './components/Catalog/CartStoreSwitchDialog';
import { LiveNotificationToast } from './components/Common/LiveNotificationToast';
import { MessageCircle, Store, ShieldCheck, Heart, Loader2 } from 'lucide-react';

// Lazy loaded heavy administrative and secondary views
const MerchantDashboard = lazyWithRetry(() => import('./components/Merchant/MerchantDashboard').then(m => ({ default: m.MerchantDashboard })));
const SaasAdminView = lazyWithRetry(() => import('./components/SuperAdmin/SaasAdminView').then(m => ({ default: m.SaasAdminView })));
const AuthModal = lazyWithRetry(() => import('./components/Auth/AuthModal').then(m => ({ default: m.AuthModal })));
const ChangePinModal = lazyWithRetry(() => import('./components/Auth/ChangePinModal').then(m => ({ default: m.ChangePinModal })));
const ProductModal = lazyWithRetry(() => import('./components/Catalog/ProductModal').then(m => ({ default: m.ProductModal })));
const CartDrawer = lazyWithRetry(() => import('./components/Catalog/CartDrawer').then(m => ({ default: m.CartDrawer })));
const OrderSuccessModal = lazyWithRetry(() => import('./components/Catalog/OrderSuccessModal').then(m => ({ default: m.OrderSuccessModal })));
const UserProfileModal = lazyWithRetry(() => import('./components/Auth/UserProfileModal').then(m => ({ default: m.UserProfileModal })));
const PendingApprovalModal = lazyWithRetry(() => import('./components/Auth/PendingApprovalModal').then(m => ({ default: m.PendingApprovalModal })));
const PlanPurchaseModal = lazyWithRetry(() => import('./components/Subscription/PlanPurchaseModal').then(m => ({ default: m.PlanPurchaseModal })));

const ViewLoadingFallback = () => (
  <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center p-8 text-neutral-400">
    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Cargando panel...</span>
  </div>
);

const AppContent: React.FC = () => {
  const {
    activeView,
    isAuthenticated,
    isMerchant,
    isSuperAdmin,
    pendingApprovalModalOpen,
    setPendingApprovalModalOpen,
    pendingApprovalMerchantData,
    planPurchaseModalOpen,
    planPurchaseInitialPlan,
    closePlanPurchaseModal,
    isLoadingData
  } = useApp();

  // Sin permiso: mientras se comprueba la sesión se muestra "Cargando"; si no hay permiso, al inicio
  // (sin revelar qué hay en la página pedida).
  const guard = (allowed: boolean) => (allowed ? null : isLoadingData ? <ViewLoadingFallback /> : <RedirectHome />);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 font-sans selection:bg-emerald-500 selection:text-white pb-14 md:pb-0">
      <Navbar />

      <div className="flex-1">
        {activeView === 'home' && <HomeDashboard />}
        {activeView === 'marketplace' && <MarketplaceDashboard />}
        {activeView === 'catalog' && <CatalogView />}
        {activeView === 'merchant' && (
          isAuthenticated && (isMerchant || isSuperAdmin) ? (
            <ErrorBoundary fallbackTitle="No pudimos abrir tu panel de tienda">
              <Suspense fallback={<ViewLoadingFallback />}>
                <MerchantDashboard />
              </Suspense>
            </ErrorBoundary>
          ) : guard(false)
        )}
        {activeView === 'superadmin' && (
          isSuperAdmin ? (
            <ErrorBoundary fallbackTitle="No pudimos abrir el panel de administración">
              <Suspense fallback={<ViewLoadingFallback />}>
                <SaasAdminView />
              </Suspense>
            </ErrorBoundary>
          ) : guard(false)
        )}
      </div>

      {/* Global Modals & Drawers */}
      <LiveNotificationToast />
      <FloatingCartButton />
      <CartStoreSwitchDialog />
      {/* Modales en carga diferida: se descargan después de mostrar la página, no bloquean el primer render */}
      <Suspense fallback={null}>
        <ProductModal />
        <CartDrawer />
        <OrderSuccessModal />
        <AuthModal />
        <ChangePinModal />
        <UserProfileModal />
        <PendingApprovalModal
          isOpen={pendingApprovalModalOpen}
          onClose={() => setPendingApprovalModalOpen(false)}
          merchantData={pendingApprovalMerchantData}
        />
        <PlanPurchaseModal
          isOpen={planPurchaseModalOpen}
          onClose={closePlanPurchaseModal}
          initialPlanId={planPurchaseInitialPlan}
        />
      </Suspense>

      {/* Global Compact Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6 text-xs text-neutral-500">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={BRAND_LOGO_URL} alt="" width={20} height={20} className="w-5 h-5 object-contain" />
            <span className="font-bold text-neutral-900">JamuyWasi</span>
            <span>•</span>
            <span>Ventas automáticas directas a WhatsApp</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600" />
              WhatsApp Business Ready
            </span>
            <span>•</span>
            <span>Suscripciones & Gestión Multitienda</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundary variant="page">
        <AppContent />
      </ErrorBoundary>
    </AppProvider>
  );
}
