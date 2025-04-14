import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard,
  Tags,
  PieChart,
  UserCircle,
  LogOut,
  ArrowUpCircle,
  Wallet,
  Sun,
  Moon,
  Search,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Accounts', href: '/accounts', icon: Wallet },
  { name: 'Transactions', href: '/expenses', icon: ArrowUpCircle },
  { name: 'Categories', href: '/categories', icon: Tags },
  { name: 'Reports', href: '/reports', icon: PieChart },
  { name: 'Profile', href: '/profile', icon: UserCircle },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/expenses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-bg-primary-dark text-text-primary dark:text-text-primary-dark">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar for desktop */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 bg-primary dark:bg-primary-dark text-white overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-semibold">Expense Tracker</h1>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-secondary dark:bg-secondary-dark text-white'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          isActive ? 'text-white' : 'text-white/80 group-hover:text-white'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-white/10 p-4">
              <button
                onClick={toggleTheme}
                className="flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors mr-4"
              >
                {theme === 'dark' ? (
                  <Sun className="h-6 w-6" />
                ) : (
                  <Moon className="h-6 w-6" />
                )}
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                <LogOut className="mr-3 flex-shrink-0 h-6 w-6" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Mobile bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-primary dark:bg-primary-dark border-t border-white/10 md:hidden z-50">
          <nav className="flex justify-around">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex flex-col items-center p-2 ${
                    isActive ? 'text-secondary dark:text-secondary-dark' : 'text-white/80'
                  }`}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs mt-1">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1">
          {/* Top search bar */}
          <div className="bg-card dark:bg-card-dark shadow-card dark:shadow-card-dark">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <form onSubmit={handleSearch} className="flex-1 max-w-lg">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-text-secondary dark:text-text-secondary-dark" />
                    </div>
                    <input
                      type="search"
                      placeholder="Search expenses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-input-border dark:border-input-border-dark rounded-md leading-5 bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark placeholder-text-secondary dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary dark:focus:ring-secondary-dark focus:border-secondary dark:focus:border-secondary-dark sm:text-sm"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
          <main className="flex-1 pb-24 md:pb-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}