import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  LayoutDashboard,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  Check,
  Copy,
  Sparkles,
  Users,
  UserCheck,
  LogIn,
  LogOut,
  UserPlus,
  Home,
  User
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    stores,
    currentStoreId,
    currentStore,
    setCurrentStoreId,
    activeView,
    setActiveView,
    openStoreCatalog,
    returnToStoresDirectory,
    currentUser,
    effectiveUser,
    isAuthenticated,
    isSuperAdmin,
    isMerchant,
    openLoginModal,
    openRegisterModal,
    openProfileModal,
    logout,
    users,
    isRealtimeConnected
  } = useApp();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyStoreLink = () => {
    const slug = currentStore.slug || currentStore.id;
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const activePlanName = currentUser
    ? currentUser.subscription.planId
    : effectiveUser.subscription.planId;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xs">
      {/* Main Navbar Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActiveView('home')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-neutral-900 group-hover:text-emerald-700 transition-colors">
                    JamuyWasi
                  </span>
                  {isRealtimeConnected && (
                    <span
                      title="Sincronización en tiempo real activa (WebSockets)"
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-200 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="hidden sm:inline">En vivo</span>
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-neutral-600 -mt-0.5 font-medium">Atalaya</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Mode Switcher */}
          <nav className="hidden md:flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200/80">
            <button
              onClick={() => setActiveView('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeView === 'home'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-emerald-600" />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => setActiveView('marketplace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeView === 'marketplace'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Catálogo Multitienda</span>
            </button>

            <button
              onClick={() => returnToStoresDirectory()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeView === 'catalog'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
              title="Explorar el directorio de todas las tiendas"
            >
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Tiendas</span>
              <span className="sm:hidden">Tiendas</span>
            </button>

            {/* Solo visible para usuarios autenticados (comerciante o superadmin) */}
            {isAuthenticated && (isMerchant || isSuperAdmin) && (
              <button
                onClick={() => {
                  if (currentUser?.storeId) {
                    setCurrentStoreId(currentUser.storeId);
                  }
                  setActiveView('merchant');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeView === 'merchant'
                    ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                <span>Panel Tienda</span>
              </button>
            )}

            {/* Restricted strictly to SuperAdmin role */}
            {isSuperAdmin && (
              <button
                onClick={() => setActiveView('superadmin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeView === 'superadmin'
                    ? 'bg-purple-700 text-white shadow-xs font-semibold'
                    : 'text-purple-700 hover:text-purple-900 hover:bg-purple-100/60 font-semibold'
                }`}
                title="Portal Exclusivo de SuperAdministrador"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">SuperAdmin</span>
                <span className="sm:hidden">SaaS</span>
              </button>
            )}
          </nav>

          {/* Right Action: Register CTA, User Switcher / Login & Shopping Cart Trigger */}
          <div className="flex items-center gap-2">
            {/* CTA Button: Ser parte del catálogo (solo visible para visitantes sin sesión iniciada) */}
            {!currentUser && (
              <button
                onClick={openRegisterModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden md:inline">Ser parte del catálogo</span>
                <span className="md:hidden">Crear Tienda</span>
              </button>
            )}

            {/* If Not Authenticated: Login button */}
            {!currentUser ? (
              <button
                onClick={openLoginModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5 text-neutral-500" />
                <span>Ingresar</span>
              </button>
            ) : (
              /* User Account & Role Indicator */
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors text-xs cursor-pointer shadow-2xs"
                  title="Cuenta activa y opciones de usuario"
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                      currentUser.role === 'superadmin'
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {currentUser.role === 'superadmin' ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <Store className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col text-left leading-tight">
                    <span className="font-bold text-neutral-900 max-w-[90px] truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-medium">
                      {currentUser.role === 'superadmin' ? 'SuperAdmin' : 'Admin Tienda'}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-neutral-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-1.5 border-b border-neutral-100">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Sesión Activa
                      </p>
                      <p className="font-bold text-neutral-900 text-xs mt-0.5">{currentUser.name}</p>
                      <p className="text-[11px] text-neutral-500 truncate">{currentUser.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            currentUser.role === 'superadmin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {currentUser.role === 'superadmin' ? 'SuperAdmin' : 'Admin Tienda'}
                        </span>
                        {currentUser.role === 'merchant' && (
                          <span className="text-[10px] text-neutral-500 font-medium">
                            Plan: {currentUser.subscription.planId.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick navigation actions */}
                    <div className="p-1 border-b border-neutral-100 space-y-0.5">
                      <button
                        onClick={() => {
                          openProfileModal();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-800 hover:bg-neutral-100 font-bold transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Mi Perfil Personal</span>
                      </button>

                      {currentUser.role === 'superadmin' ? (
                        <>
                          <button
                            onClick={() => {
                              setActiveView('superadmin');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-purple-800 hover:bg-purple-50 font-bold transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Ir al Panel SuperAdmin</span>
                          </button>
                          {currentUser.storeId && (
                            <button
                              onClick={() => {
                                setCurrentStoreId(currentUser.storeId!);
                                setActiveView('merchant');
                                setUserDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-emerald-800 hover:bg-emerald-50 font-bold transition-colors cursor-pointer"
                            >
                              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Ir a Mi Tienda Propia</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              if (currentUser.storeId) {
                                setCurrentStoreId(currentUser.storeId);
                              }
                              setActiveView('merchant');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-emerald-800 hover:bg-emerald-50 font-bold transition-colors cursor-pointer"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Ir a Mi Panel de Tienda</span>
                          </button>

                          {currentUser.storeId && (
                            <button
                              onClick={() => {
                                openStoreCatalog(currentUser.storeId);
                                setUserDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-neutral-700 hover:bg-neutral-100 font-bold transition-colors cursor-pointer"
                            >
                              <Store className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Ver Mi Tienda en Vivo</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>



                    <div className="pt-1.5 mt-1 border-t border-neutral-100 px-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-neutral-200/90 py-1 px-3 flex items-center justify-around md:hidden shadow-lg safe-area-bottom">
        <button
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeView === 'home'
              ? 'text-emerald-700 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Home className={`w-4 h-4 ${activeView === 'home' ? 'text-emerald-600 stroke-[2.5]' : 'text-neutral-400'}`} />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => setActiveView('marketplace')}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeView === 'marketplace'
              ? 'text-emerald-700 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${activeView === 'marketplace' ? 'text-emerald-600 stroke-[2.5]' : 'text-neutral-400'}`} />
          <span>Explorar</span>
        </button>

        <button
          onClick={() => returnToStoresDirectory()}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeView === 'catalog'
              ? 'text-emerald-700 font-extrabold'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Store className={`w-4 h-4 ${activeView === 'catalog' ? 'text-emerald-600 stroke-[2.5]' : 'text-neutral-400'}`} />
          <span>Tienda</span>
        </button>

        {isAuthenticated && (isMerchant || isSuperAdmin) && (
          <button
            onClick={() => {
              if (currentUser?.storeId) {
                setCurrentStoreId(currentUser.storeId);
              }
              setActiveView('merchant');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeView === 'merchant'
                ? 'text-blue-700 font-extrabold'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeView === 'merchant' ? 'text-blue-600 stroke-[2.5]' : 'text-neutral-400'}`} />
            <span>Panel</span>
          </button>
        )}


        {isSuperAdmin && (
          <button
            onClick={() => setActiveView('superadmin')}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
              activeView === 'superadmin'
                ? 'text-purple-700 font-extrabold'
                : 'text-purple-500'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600 stroke-[2.5]" />
            <span>Admin</span>
          </button>
        )}
      </nav>
    </>
  );
};
