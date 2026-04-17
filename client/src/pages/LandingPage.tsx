import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Zap, Shield, Globe, ChevronRight, Cpu, Sparkles, Activity, Code2, MoveRight
} from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-grid-white/[0.04] bg-[size:40px_40px]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-600/20 blur-[150px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[150px] mix-blend-screen pointer-events-none" />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] mix-blend-screen pointer-events-none" />
        
        {/* Radial fade mask to blend the grid smoothly at the edges */}
        <div className="absolute inset-0 bg-slate-950/40 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto backdrop-blur-sm border-b border-white/5 rounded-b-3xl mb-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(34,211,238,0.5)]">
            <Code2 size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">
            SmartCampus<span className="text-cyan-400">Core</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200 hidden sm:block">
            Sign In
          </Link>
          <Link to="/signup" className="group relative px-5 py-2.5 text-sm font-semibold text-white transition-all">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 opacity-80 group-hover:opacity-100 group-hover:shadow-[0_0_25px_-5px_rgba(34,211,238,0.6)] transition-all duration-300" />
            <div className="relative flex items-center gap-2">
              Get Started
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-10 pb-20 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-cyan-500/30 text-cyan-400 text-sm font-medium mb-8 backdrop-blur-md animate-fade-in shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)]">
          <Sparkles size={14} className="animate-pulse" />
          <span>v2.0 Next-Gen Core is Live</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          The Campus of Tomorrow, <br className="hidden sm:block" />
          <span className="futuristic-gradient-text">Built Today.</span>
        </h1>

        <p className="max-w-2xl text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed font-light">
          Experience a unified, intelligent ecosystem. Smart Campus Core seamlessly connects facilities, incident response, and student life into one powerful platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
          <Link to="/signup" className="group relative flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 bg-white text-slate-950 font-bold rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity" />
            <span className="relative z-10">Enter Ecosystem</span>
            <MoveRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link to="/login" className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-slate-900/50 hover:bg-slate-800/80 text-white font-medium rounded-xl border border-slate-700/50 backdrop-blur-md transition-colors duration-300">
            Access Dashboard
          </Link>
        </div>

        {/* Floating UI Elements (Decorative) */}
        <div className="hidden lg:block absolute left-[-10%] top-[20%] w-64 p-5 glass-panel rounded-2xl animate-float opacity-80 transform -rotate-6">
          <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-3">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">System Status</span>
            <Activity size={16} className="text-cyan-400" />
          </div>
          <div className="space-y-3">
             <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[85%]" />
             </div>
             <div className="h-2 w-3/4 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 w-[92%]" />
             </div>
          </div>
        </div>

        <div className="hidden lg:block absolute right-[-15%] top-[40%] w-72 p-5 glass-panel rounded-2xl animate-float-delayed opacity-90 transform rotate-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
               <Shield size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Quantum Security</p>
              <p className="text-xs text-slate-400">Active Node Monitoring</p>
            </div>
          </div>
        </div>

      </main>

      {/* Feature Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Architected for <span className="text-cyan-400">Scale.</span></h2>
          <p className="text-slate-400 max-w-xl mx-auto">Our modular infrastructure adapts to the evolving needs of massive educational institutions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Cpu size={28} />,
              title: 'AI-Powered Infrastructure',
              desc: 'Predictive maintenance and smart facility routing handled automatically by the core.',
              color: 'from-cyan-500 to-blue-600'
            },
            {
              icon: <Zap size={28} />,
              title: 'Real-time Incident Matrix',
              desc: 'Log, track, and resolve facility issues with sub-second synchronization.',
              color: 'from-purple-500 to-indigo-600'
            },
            {
              icon: <Globe size={28} />,
              title: 'Unified Ecosystem',
              desc: 'Students, Staff, and Admins operate in perfect harmony through role-based neural nodes.',
              color: 'from-emerald-400 to-teal-600'
            }
          ].map((feature, i) => (
            <div key={i} className="group relative p-[1px] rounded-3xl overflow-hidden hover:z-10">
              {/* Border Gradient Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-30 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative h-full bg-slate-950/80 backdrop-blur-xl p-8 rounded-[23px] flex flex-col items-start hover:bg-slate-900/90 transition-colors duration-500">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="relative z-10 border-t border-white/5 bg-slate-950/50 backdrop-blur-lg pt-10 pb-6 mt-10 text-center">
        <div className="flex justify-center items-center gap-2 mb-4 opacity-50">
          <Code2 size={18} />
          <span className="font-bold tracking-tight">SmartCampusCore</span>
        </div>
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} NextGen Education Systems. All Systems Operational.
        </p>
      </footer>
    </div>
  );
};
