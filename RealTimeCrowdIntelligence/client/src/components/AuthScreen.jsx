import { useState } from 'react';
import { Activity, Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: 'admin@crowdintel.local',
    password: 'Admin123!'
  });

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-mist lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex items-center px-6 py-10 sm:px-10 lg:px-16">
        <div className="max-w-3xl">
          <div className="mb-7 inline-flex items-center gap-3 border border-civic/20 bg-white px-4 py-2 text-sm font-semibold text-civic shadow-panel">
            <Activity size={18} />
            Real-Time Crowd Intelligence
          </div>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            Live awareness for crowd density, safety signals, and field operations.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-steel">
            Submit field reports, detect surging issue categories, broadcast alerts instantly, and monitor a live map-driven dashboard from one responsive workspace.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {['JWT auth', 'Live Socket.IO', 'Mongo analytics'].map((item) => (
              <div key={item} className="panel px-4 py-4">
                <ShieldCheck className="mb-3 text-civic" size={22} />
                <p className="text-sm font-bold text-ink">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-center border-t border-slate-200 bg-white px-6 py-10 sm:px-10 lg:border-l lg:border-t-0">
        <form onSubmit={submit} className="mx-auto w-full max-w-md">
          <div className="mb-6 flex gap-2 border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 px-4 py-2 text-sm font-bold ${mode === 'login' ? 'bg-white text-civic shadow-sm' : 'text-slate-500'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 px-4 py-2 text-sm font-bold ${mode === 'register' ? 'bg-white text-civic shadow-sm' : 'text-slate-500'}`}
            >
              Register
            </button>
          </div>

          <h2 className="text-2xl font-extrabold text-ink">{mode === 'login' ? 'Operator access' : 'Create reporter account'}</h2>
          <p className="mt-2 text-sm text-steel">Demo admin credentials are prefilled after running the seed script.</p>

          <div className="mt-6 space-y-4">
            {mode === 'register' && (
              <label className="block">
                <span className="label">Name</span>
                <div className="mt-1 flex items-center border border-slate-300 px-3 focus-within:border-civic focus-within:ring-2 focus-within:ring-civic/15">
                  <UserPlus size={18} className="text-slate-400" />
                  <input className="w-full border-0 px-3 py-2 text-sm outline-none" name="name" value={form.name} onChange={updateField} required />
                </div>
              </label>
            )}
            <label className="block">
              <span className="label">Email</span>
              <div className="mt-1 flex items-center border border-slate-300 px-3 focus-within:border-civic focus-within:ring-2 focus-within:ring-civic/15">
                <Mail size={18} className="text-slate-400" />
                <input className="w-full border-0 px-3 py-2 text-sm outline-none" type="email" name="email" value={form.email} onChange={updateField} required />
              </div>
            </label>
            <label className="block">
              <span className="label">Password</span>
              <div className="mt-1 flex items-center border border-slate-300 px-3 focus-within:border-civic focus-within:ring-2 focus-within:ring-civic/15">
                <Lock size={18} className="text-slate-400" />
                <input className="w-full border-0 px-3 py-2 text-sm outline-none" type="password" name="password" value={form.password} onChange={updateField} required />
              </div>
            </label>
          </div>

          <button disabled={loading} className="mt-6 w-full bg-civic px-4 py-3 text-sm font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Please wait' : mode === 'login' ? 'Enter dashboard' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
}
