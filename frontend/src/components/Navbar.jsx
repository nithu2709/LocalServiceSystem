import React, { useState } from 'react';
import { 
  Wrench, 
  User, 
  Shield, 
  Briefcase, 
  LogOut, 
  LogIn, 
  ChevronDown, 
  Zap,
  Sparkles,
  Cloud
} from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  demoUsers, 
  onSelectUser, 
  onOpenAuth, 
  onLogout 
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">Admin</span>;
      case 'PROVIDER':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Provider</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Customer</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-sm shadow-indigo-100">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">LocalService</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <Cloud className="w-3 h-3 text-indigo-500" /> Cloud Architecture
                </span>
              </div>
              <p className="text-xs text-slate-500">Service Request Management System</p>
            </div>
          </div>

          {/* Quick Demo Role Switcher & User Profile */}
          <div className="flex items-center space-x-3">
            
            {/* Quick Demo Switcher Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Demo Switcher</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20">
                    <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Switch Demo Role (1-Click)
                    </div>
                    <div className="divide-y divide-slate-100">
                      {demoUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            onSelectUser(user);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition flex items-center justify-between ${
                            currentUser?.id === user.id ? 'bg-indigo-50/70 text-indigo-950 font-medium' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold flex items-center gap-1.5">
                              {user.name}
                              {currentUser?.id === user.id && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {user.role === 'PROVIDER' ? `Specialty: ${user.category_name}` : user.email}
                            </div>
                          </div>
                          {getRoleBadge(user.role)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile / Auth State */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1.5">
                    {currentUser.name}
                    {getRoleBadge(currentUser.role)}
                  </div>
                  <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
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
