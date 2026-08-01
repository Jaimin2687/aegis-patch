'use client';

import React, { useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>, active: true },
    { label: 'Scan History', icon: <><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>, active: false },
    { label: 'Settings', icon: <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>, active: false },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#050505] border-r border-white/10 text-white transition-all duration-300">
      <div className="flex items-center justify-between p-4 h-16 border-b border-white/10">
        {!collapsed && (
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500 truncate">
            AEGIS-PATCH
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center p-2 rounded-md hover:bg-slate-800 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 py-6 px-2 space-y-1">
        {navItems.map((item, idx) => (
          <button
            key={idx}
            className={cn(
              "w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-left cursor-pointer",
              item.active 
                ? "bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent"
            )}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              {item.icon}
            </svg>
            {!collapsed && <span className="ml-3 font-medium text-sm truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-4 py-4 mb-2">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-3 rounded-xl flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-300">Pipeline Ready</span>
          </div>
        </div>
      )}

      <div className="p-4 border-t border-white/10 flex items-center justify-between">
        <div className={cn("flex items-center", collapsed ? "mx-auto" : "space-x-3")}>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8 rounded-lg' } }} />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-200">User</span>
              <span className="text-xs text-slate-500">Operator</span>
            </div>
          )}
        </div>
        {!collapsed && (
          <span className="text-[10px] font-mono text-slate-600 bg-slate-900 px-2 py-1 rounded-md border border-white/5">
            v1.0.0
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#000000] overflow-hidden text-slate-200 font-sans">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#050505] border-b border-white/10 z-50 flex items-center justify-between px-4">
        <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500">
          AEGIS-PATCH
        </span>
        <button onClick={() => setMobileOpen(true)} className="p-2">
          <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className={cn("hidden md:block h-full transition-all duration-300", collapsed ? "w-20" : "w-64")}>
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-64 h-full relative"
            >
              <SidebarContent />
              <button 
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 -right-12 p-2 bg-slate-800 rounded-full text-white cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 h-full overflow-y-auto pt-16 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
