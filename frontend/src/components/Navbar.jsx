import React from 'react';
import { 
  Wrench, 
  LogOut, 
  LogIn, 
  Cloud
} from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  onOpenAuth, 
  onLogout 
}) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-950/70 text-purple-300 border border-purple-800">Admin</span>;
      case 'PROVIDER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-950/70 text-blue-300 border border-blue-800">Provider</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800">Customer</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-indigo-950">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">LocalService</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800">
                  <Cloud className="w-3 h-3 text-indigo-400" /> Cloud Architecture
                </span>
              </div>
              <p className="text-xs text-zinc-400">Service Request Management System</p>
            </div>
          </div>

          {/* User Profile / Auth State */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-zinc-100 flex items-center justify-end gap-1.5">
                    {currentUser.name}
                    {getRoleBadge(currentUser.role)}
                  </div>
                  <div className="text-[11px] text-zinc-400">{currentUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
