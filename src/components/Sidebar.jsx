import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState('');

  const superAdminMenu = [
    {
      name: 'Dashboard', path: '/superadmin/dashboard', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
      )
    },
    {
      name: 'Admin Management', path: '/superadmin/admins', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      )
    },
    {
      name: 'Site Incharge', path: '/admin/supervisorManagement', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      )
    },
    {
      name: 'Stock Operators', path: '/admin/operators', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      )
    },
    {
      name: 'Sites', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
      ),
      children: [
        { name: 'Create Site', path: '/admin/create-site' },
        { name: 'View All Sites', path: '/admin/sites' }
      ]
    },
    {
      name: 'Stocks', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      ),
      children: [
        { name: 'Add Stocks Types', path: '/admin/machines/types' },
        { name: 'Add Stocks Units', path: '/admin/machines/units' },
        { name: 'All Stocks', path: '/admin/machines/all' }
      ]
    },
    {
      name: 'Stock Movements', path: '/admin/movements', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
      )
    },
    {
      name: 'Installments', path: '/admin/installments', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      )
    },
    {
      name: 'Expenses', path: '/admin/expenses-monitor', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      )
    },
    {
      name: 'Reports', path: '/superadmin/reports', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
      )
    },
    {
      name: 'Admin Funds', path: '/superadmin/funds', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    },
    {
      name: 'Profile', path: '/profile', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      )
    },
  ];

  const adminMenu = [
    {
      name: 'Dashboard', path: '/admin/dashboard', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
      )
    },
    {
      name: 'Site Incharge', path: '/admin/supervisorManagement', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      )
    },
    {
      name: 'Stock Operators', path: '/admin/operators', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      )
    },
    {
      name: 'Sites', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
      ),
      children: [
        { name: 'Create Site', path: '/admin/create-site' },
        { name: 'View All Sites', path: '/admin/sites' }
      ]
    },
    {
      name: 'Stocks', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      ),
      children: [
        { name: 'Add Stocks Types', path: '/admin/machines/types' },
        { name: 'Add Stocks Units', path: '/admin/machines/units' },
        { name: 'All Stocks', path: '/admin/machines/all' }
      ]
    },
    {
      name: 'Stock Movements', path: '/admin/movements', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
      )
    },
    {
      name: 'Installments', path: '/admin/installments', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      )
    },
    {
      name: 'Expenses', path: '/admin/expenses-monitor', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
      )
    },
    {
      name: 'Reports', path: '/admin/reports', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
      )
    },
    {
      name: 'My Funds', path: '/admin/funds', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    },
    {
      name: 'Profile', path: '/profile', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      )
    },
  ];

  const userMenu = [
    {
      name: 'Dashboard', path: '/user/dashboard', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
      )
    },
    {
      name: 'My Sites', path: '/user/sites', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
      )
    },
    {
      name: 'Expenses', path: '/user/expenses', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    },
    {
      name: 'Profile', path: '/profile', icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      )
    },
  ];

  const getMenu = () => {
    if (user?.role === 'superadmin') return superAdminMenu;
    if (user?.role === 'admin') {
      const perms = user?.permissions || [];
      // Empty permissions = full access (superadmin ne koi restriction nahi lagayi)
      if (perms.length === 0) return adminMenu;

      return adminMenu.filter(item => {
        if (item.path === '/admin/dashboard') return true;
        if (item.name === 'Site Incharge') return perms.includes('manage_supervisors');
        if (item.name === 'Stock Operators') return perms.includes('manage_operators');
        if (item.name === 'Sites') return perms.includes('manage_sites') || perms.includes('create_site');
        if (item.name === 'Stocks') return perms.includes('manage_machines');
        if (item.name === 'Stock Movements') return perms.includes('manage_movements');
        if (item.name === 'Installments') return perms.includes('give_installments');
        if (item.name === 'Expenses') return perms.includes('view_expenses');
        if (item.name === 'Reports') return perms.includes('view_reports') || perms.includes('manage_sites'); // Allow reports if they can manage sites or see reports
        if (item.name === 'My Funds') return true; // Always show My Funds to Admins
        if (item.name === 'Profile') return true; // Always show Profile
        return false; 
      }).map(item => {
        if (item.name === 'Sites' && item.children) {
          const children = item.children.filter(c => {
            if (c.name === 'Create Site') return perms.includes('create_site');
            if (c.name === 'View All Sites') return perms.includes('manage_sites');
            return false;
          });
          return { ...item, children };
        }
        return item;
      }).filter(item => !item.children || item.children.length > 0); // empty children wale parent bhi hide karo
    }
    return userMenu;
  };

  const menu = getMenu();

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={toggleSidebar}
      ></div>

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 shadow-2xl transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="flex items-center px-8 h-20 bg-slate-900 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.628.288a2 2 0 01-1.945 0l-.628-.288a2 2 0 00-1.945 0l-.628.288a2 2 0 01-1.945 0l-.628-.288a2 2 0 00-1.286-.172l-2.387.477a2 2 0 00-1.022.547l-.96.96a2 2 0 000 2.828l.96.96a2 2 0 001.022.547l2.387.477a2 2 0 001.286-.172l.628-.288a2 2 0 011.945 0l.628.288a2 2 0 001.945 0l.628-.288a2 2 0 011.945 0l.628.288a6 6 0 003.86.517l2.387-.477a2 2 0 001.022-.547l.96-.96a2 2 0 000-2.828l-.96-.96z" /></svg>
          </div>
          <h1 className="text-white text-xl font-bold tracking-tight">SoilPro <span className="text-indigo-400">Hub</span></h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-4">Main Menu</p>
          <nav className="space-y-1">
            {menu.map((item) => {
              const hasChildren = !!item.children;
              const isActive = hasChildren
                ? item.children.some(child => location.pathname === child.path)
                : location.pathname === item.path;
              const isMenuOpen = openMenu === item.name || isActive;

              if (hasChildren) {
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => setOpenMenu(openMenu === item.name ? '' : item.name)}
                      className={`w-full group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                        ? 'bg-indigo-600/10 text-indigo-400'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                      <span className={`mr-3 transition-colors duration-200 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.name}</span>
                      <svg className={`ml-auto w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isMenuOpen && (
                      <div className="pl-11 pr-4 space-y-1 mt-1">
                        {item.children.map(child => (
                          <Link key={child.path} to={child.path} className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === child.path ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <span className={`mr-3 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-60"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center px-4 py-3 mb-4 rounded-2xl bg-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mr-3 border border-indigo-500/30">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role || 'Member'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
              }
            }}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all duration-200 group"
          >
            <svg className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout session
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
