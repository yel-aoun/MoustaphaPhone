import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { adminAuth } from '@/api/base44Client';
import CircuitBackground from '@/components/store/fx/CircuitBackground';
import BrandLogo from '@/components/brand/BrandLogo';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminAuth.login({ email, password });
    } catch {
      setError('Email ou mot de passe incorrect.');
    }
    setLoading(false);
  };

  return (
    <div className="admin-shell dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07090f] p-4">
      <CircuitBackground className="text-slate-400 opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 animate-aurora rounded-full bg-primary/20 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <BrandLogo size="md" subtitle="Admin" dark className="mb-8 justify-center" />

        <form
          onSubmit={handleSubmit}
          className="liquid-glass space-y-4 rounded-[28px] p-6"
        >
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 text-white placeholder:text-slate-600"
                placeholder="admin@example.com"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="h-11 rounded-xl border-white/10 bg-white/[0.05] pl-10 pr-10 text-white placeholder:text-slate-600"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-full bg-primary font-semibold shadow-[0_10px_30px_-10px_hsl(var(--primary))] hover:bg-primary/90"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
}
