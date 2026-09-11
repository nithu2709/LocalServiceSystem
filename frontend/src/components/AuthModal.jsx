import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, AlertCircle, MailCheck, Send, CheckCircle2, KeyRound } from 'lucide-react';
import { api } from '../api';

// -----------------------------------------------------------------------------
// ISOLATED SIGN IN COMPONENT
// -----------------------------------------------------------------------------
function SignInForm({ onLogin, onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin(email.trim(), password);
      onClose();
    } catch (err) {
      console.error('Sign In error:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignInSubmit} className="space-y-4 text-xs">
      {error && (
        <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-xl flex items-start gap-2 shadow-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      <div>
        <label className="block font-semibold text-zinc-300 mb-1">Email Address</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block font-semibold text-zinc-300 mb-1">Password</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </div>

      <p className="text-center text-zinc-400 pt-2">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-indigo-400 hover:underline font-semibold"
        >
          Register here
        </button>
      </p>
    </form>
  );
}

// -----------------------------------------------------------------------------
// ISOLATED REGISTER COMPONENT
// -----------------------------------------------------------------------------
function RegisterForm({ categories = [], onRegister, onClose, onRegistrationSuccess, onSwitchToSignIn }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [categoryId, setCategoryId] = useState(categories?.[0]?.id || 1);
  const [experience, setExperience] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Name, email, and password are required.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // STRICTLY AND EXCLUSIVELY calls registration endpoint
      const res = await onRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        role,
        category_id: role === 'PROVIDER' ? categoryId : null,
        experience: role === 'PROVIDER' ? experience.trim() : null,
        location: role === 'PROVIDER' ? location.trim() : null,
      });

      if (res?.requiresVerification) {
        onRegistrationSuccess(email.trim(), res.verificationToken);
      } else {
        if (onClose) onClose();
      }
    } catch (err) {
      console.error('Registration submit error:', err);
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
      {error && (
        <div className="p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-xl flex items-start gap-2 shadow-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{error}</span>
        </div>
      )}

      <div>
        <label className="block font-semibold text-zinc-300 mb-1">Full Name</label>
        <input
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Alex Morgan"
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block font-semibold text-zinc-300 mb-1">Email Address</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block font-semibold text-zinc-300 mb-1">Password</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      <div>
        <label className="block font-semibold text-zinc-300 mb-1">Phone Number (Optional)</label>
        <input
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Role Selection */}
      <div>
        <label className="block font-semibold text-zinc-300 mb-1.5">Account Role</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`py-2 px-3 rounded-xl border text-center font-semibold transition cursor-pointer ${
              role === 'CUSTOMER'
                ? 'bg-indigo-950/70 border-indigo-500 text-indigo-300'
                : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setRole('PROVIDER')}
            className={`py-2 px-3 rounded-xl border text-center font-semibold transition cursor-pointer ${
              role === 'PROVIDER'
                ? 'bg-indigo-950/70 border-indigo-500 text-indigo-300'
                : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            Service Provider
          </button>
        </div>
      </div>

      {/* If Provider, pick specialty trade */}
      {role === 'PROVIDER' && (
        <div className="space-y-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Specialty Trade</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-zinc-700 rounded-xl bg-zinc-900 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Experience Summary</label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 5 years licensed technician"
              className="w-full px-3 py-1.5 border border-zinc-700 rounded-lg bg-zinc-900 text-white placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-300 mb-1">Service Area / City</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Metro Area & Suburbs"
              className="w-full px-3 py-1.5 border border-zinc-700 rounded-lg bg-zinc-900 text-white placeholder-zinc-500"
            />
          </div>
        </div>
      )}

      <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 text-[11px] text-zinc-400">
        ℹ️ A confirmation email will be dispatched to your inbox. You must verify your address before logging in.
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? 'Registering Account...' : 'Register & Send Verification'}
        </button>
      </div>

      <p className="text-center text-zinc-400 pt-2">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-indigo-400 hover:underline font-semibold"
        >
          Sign in here
        </button>
      </p>
    </form>
  );
}

// -----------------------------------------------------------------------------
// MAIN AUTH MODAL SHELL WITH COMPLETE FORM & STATE ISOLATION
// -----------------------------------------------------------------------------
export default function AuthModal({ categories = [], isOpen, onClose, onLogin, onRegister }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setSuccessMessage('');
      setVerificationError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRegistrationSuccess = (registeredEmail, verificationToken) => {
    setUnverifiedEmail(registeredEmail);
    if (verificationToken) {
      setTokenInput(verificationToken);
    }
    setVerificationPending(true);
  };

  const handleVerifyManualToken = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setVerifyingToken(true);
    setVerificationError('');
    try {
      await api.verifyEmail(tokenInput.trim());
      setSuccessMessage('Email verified successfully! You can now sign in.');
      setVerificationPending(false);
      setActiveTab('login');
    } catch (err) {
      setVerificationError(err.message || 'Verification failed. Token may be expired.');
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail) {
      setVerificationError('No email address found to resend confirmation.');
      return;
    }
    setResendLoading(true);
    setVerificationError('');
    try {
      const res = await api.resendVerification(unverifiedEmail);
      setSuccessMessage('A new verification email has been dispatched!');
      if (res.verificationToken) {
        setTokenInput(res.verificationToken);
      }
    } catch (err) {
      setVerificationError(err.message || 'Failed to resend confirmation email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-800 text-white relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* VERIFICATION PENDING SCREEN */}
        {verificationPending ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 border border-indigo-800 text-indigo-400 flex items-center justify-center mx-auto">
              <MailCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Check Your Email</h2>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                We've sent a verification confirmation to <strong className="text-white">{unverifiedEmail}</strong>. Please click the link in that email to activate your account.
              </p>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {verificationError && (
              <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            {/* Quick Token Validation Box */}
            <form onSubmit={handleVerifyManualToken} className="pt-2 text-left space-y-2 border-t border-zinc-800">
              <label className="block text-[11px] font-semibold text-zinc-400">
                Or enter your verification code/token:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste verification token here..."
                  className="flex-1 px-3 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={verifyingToken || !tokenInput.trim()}
                  className="px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {verifyingToken ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between pt-3 text-xs border-t border-zinc-800">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer disabled:opacity-50"
              >
                {resendLoading ? 'Sending...' : 'Resend Email'}
              </button>
              <button
                type="button"
                onClick={() => { setVerificationPending(false); setActiveTab('login'); }}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD TABBED INTERFACE: STRICTLY ISOLATED SIGN IN / REGISTER */
          <>
            {/* Tab Toggle */}
            <div className="flex border-b border-zinc-800 mb-5">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setSuccessMessage(''); }}
                className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                  activeTab === 'login'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setSuccessMessage(''); }}
                className={`flex-1 pb-3 text-xs font-bold text-center border-b-2 transition cursor-pointer ${
                  activeTab === 'register'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Register Account
              </button>
            </div>

            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {activeTab === 'login' ? (
              <SignInForm
                onLogin={onLogin}
                onClose={onClose}
                onSwitchToRegister={() => { setActiveTab('register'); setSuccessMessage(''); }}
              />
            ) : (
              <RegisterForm
                categories={categories}
                onRegister={onRegister}
                onClose={onClose}
                onRegistrationSuccess={handleRegistrationSuccess}
                onSwitchToSignIn={() => { setActiveTab('login'); setSuccessMessage(''); }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
