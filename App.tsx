
import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  AlertTriangle,
  Trophy,
  Calendar,
  TrendingUp,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Filter,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Mail,
  Smartphone,
  ExternalLink,
  Target,
  BarChart2,
  Languages,
  Clock,
  Zap,
  Heart
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { Member, RiskLevel, Language, Milestone, DailyClass } from './types';
import { getMembers, getMilestones, getDailyClasses } from './services/dataService';
import { generateOutreachMessage } from './services/geminiService';
import CSVImport from './CSVImport';
import WatchlistSection from './WatchlistSection';
// --- Translations ---

const translations = {
  en: {
    dashboard: "Dashboard",
    watchlist: "Watchlist",
    milestones: "Milestones",
    dailyBrief: "Daily Brief",
    diagnostics: "Diagnostics",
    members: "Members",
    settings: "Settings",
    importData: "Import Data",
    logout: "Logout",
    totalMembers: "Total Members",
    revenueRisk: "Revenue at Risk",
    avgAttendance: "Avg Attendance",
    newLeads: "New This Month",
    searchPlaceholder: "Search members, activities...",
    riskCritical: "CRITICAL",
    riskHigh: "HIGH",
    riskMedium: "MEDIUM",
    riskHealthy: "HEALTHY",
    memberIdentity: "Member Identity",
    engagement: "Engagement",
    riskIndex: "Risk Index",
    classes: "Classes",
    momentum: "Momentum",
    nextClass: "Next Class",
    coachBrief: "Coach Brief",
    executeSOP: "Execute SOP",
    ritualStatus: "Ritual Status",
    noMembers: "No members found",
    aiOutreach: "AI Outreach",
    composition: "Message Composition",
    compositionDesc: "Generate a message to reach out to this member...",
    refreshAI: "Refresh AI",
    sendMessage: "Send Message",
    newMemberTitle: "New Member Profile",
    createProfile: "Create Profile",
    growthEngine: "Growth Engine",
    healthProfile: "Health Profile",
    sopFocus: "SOP Focus",
    langName: "English",
    attendanceMomentum: "Attendance Momentum",
    classesAbbr: "cls"
  },
  ro: {
    dashboard: "Panou Control",
    watchlist: "Monitorizare",
    milestones: "Realizări",
    dailyBrief: "Brief Zilnic",
    diagnostics: "Diagnostic",
    members: "Membri",
    settings: "Setări",
    importData: "Import Date",
    logout: "Deconectare",
    totalMembers: "Total Membri",
    revenueRisk: "Venit la Risc",
    avgAttendance: "Prezență Medie",
    newLeads: "Noi Luna Aceasta",
    searchPlaceholder: "Caută membri, activități...",
    riskCritical: "CRITIC",
    riskHigh: "RIDICAT",
    riskMedium: "MEDIU",
    riskHealthy: "SĂNĂTOS",
    memberIdentity: "Identitate Membru",
    engagement: "Implicare",
    riskIndex: "Index Risc",
    classes: "Clase",
    momentum: "Momentum",
    nextClass: "Următoarea Clasă",
    coachBrief: "Brief Antrenor",
    executeSOP: "Execută SOP",
    ritualStatus: "Status Ritual",
    noMembers: "Niciun membru găsit",
    aiOutreach: "Outreach AI",
    composition: "Compoziție Mesaj",
    compositionDesc: "Generează un mesaj pentru a contacta acest membru...",
    refreshAI: "Reîmprospătează AI",
    sendMessage: "Trimite Mesaj",
    newMemberTitle: "Profil Membru Nou",
    createProfile: "Creează Profil",
    growthEngine: "Motor de Creștere",
    healthProfile: "Profil Sănătate",
    sopFocus: "Focus SOP",
    langName: "Română",
    attendanceMomentum: "Momentul Prezenței",
    classesAbbr: "cl."
  }
};

// --- Utility Components ---

const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} {...props} />
);

const Toast = ({ message, type = 'success', onClose }: { message: string, type?: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 z-[100] ${type === 'success' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-rose-600 border-rose-500 text-white'
      }`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

const KPICard = ({ title, value, change, isPositive, prefix = "", loading }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
    {loading ? (
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
    ) : (
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{prefix}{value}</h3>
        <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {change}%
        </div>
      </div>
    )}
  </div>
);

const RiskBadge = ({ level, t }: { level: RiskLevel, t: any }) => {
  const styles = {
    [RiskLevel.CRITICAL]: 'bg-rose-50 text-rose-700 border-rose-200',
    [RiskLevel.HIGH]: 'bg-orange-50 text-orange-700 border-orange-200',
    [RiskLevel.MEDIUM]: 'bg-amber-50 text-amber-700 border-amber-200',
    [RiskLevel.OK]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const labels = {
    [RiskLevel.CRITICAL]: t.riskCritical,
    [RiskLevel.HIGH]: t.riskHigh,
    [RiskLevel.MEDIUM]: t.riskMedium,
    [RiskLevel.OK]: t.riskHealthy,
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border tracking-tight uppercase ${styles[level]}`}>
      {labels[level]}
    </span>
  );
};

// --- Missing Data & Components ---

// Fix for attendanceData missing errors
const attendanceData = [
  { name: 'Mon', count: 42 },
  { name: 'Tue', count: 38 },
  { name: 'Wed', count: 45 },
  { name: 'Thu', count: 40 },
  { name: 'Fri', count: 52 },
  { name: 'Sat', count: 30 },
  { name: 'Sun', count: 15 },
];



// Fix for OutreachModal missing error
const OutreachModal = ({ member, isOpen, onClose, onShowToast }: { member: Member | null, isOpen: boolean, onClose: () => void, onShowToast: (m: string) => void }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!member) return;
    setLoading(true);
    try {
      const msg = await generateOutreachMessage(member, 'at-risk');
      setMessage(msg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && member) {
      handleGenerate();
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI Outreach</h3>
              <p className="text-slate-400 font-medium mt-1">Personalized message for {member.name}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 min-h-[160px] flex flex-col justify-center relative">
            {loading ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Generating Message...</p>
              </div>
            ) : (
              <textarea
                className="w-full bg-transparent border-none focus:ring-0 text-slate-700 font-medium resize-none leading-relaxed"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            )}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleGenerate}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center"
            >
              <Zap className="w-4 h-4 mr-2" /> Refresh
            </button>
            <button
              onClick={() => { onShowToast("Message sent!"); onClose(); }}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center"
            >
              <Smartphone className="w-4 h-4 mr-2" /> Send via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



// --- Tab Views ---

const MilestonesView = ({ t, milestones }: { t: any, milestones: Milestone[] }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {milestones.map((milestone) => (
        <div key={milestone.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-start space-x-4 hover:shadow-md transition-shadow">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${milestone.type === 'pr' ? 'bg-amber-100 text-amber-600 shadow-amber-50' :
            milestone.type === 'streak' ? 'bg-indigo-100 text-indigo-600 shadow-indigo-50' :
              milestone.type === 'comeback' ? 'bg-rose-100 text-rose-600 shadow-rose-50' :
                'bg-emerald-100 text-emerald-600 shadow-emerald-50'
            }`}>
            {milestone.type === 'pr' ? <Zap className="w-6 h-6" /> :
              milestone.type === 'streak' ? <TrendingUp className="w-6 h-6" /> :
                milestone.type === 'comeback' ? <Heart className="w-6 h-6" /> :
                  <Trophy className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{milestone.type.replace('_', ' ')}</p>
            <h4 className="font-black text-slate-900">{milestone.memberName}</h4>
            <p className="text-sm font-bold text-slate-500 mt-1">{milestone.value}</p>
            <div className="flex items-center mt-3 text-[10px] font-bold text-slate-400 uppercase">
              <Clock className="w-3 h-3 mr-1" /> {milestone.date}
            </div>
          </div>
          <button className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
    <div className="bg-indigo-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black tracking-tight mb-2">Generate Weekly Milestone Recap</h3>
          <p className="text-indigo-200 max-w-md font-medium">Download a batch of personalized messages for all member achievements this week.</p>
        </div>
        <button className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 active:scale-95 transition-all shadow-xl shadow-indigo-950/20">
          Download Batch CSV
        </button>
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
    </div>
  </div>
);

const DailyBriefView = ({ t, dailyClasses }: { t: any, dailyClasses: DailyClass[] }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {dailyClasses.map((cls) => (
      <div key={cls.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
              {cls.time}
            </div>
            <h3 className="text-xl font-black text-slate-900">{cls.name}</h3>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.coachBrief}: <span className="text-indigo-600">{cls.coach}</span></p>
        </div>
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cls.attendees.map((atnd) => (
            <div key={atnd.id} className="p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center text-xs font-black text-indigo-600">
                  {atnd.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{atnd.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{atnd.totalClasses} {t.classesAbbr}</p>
                </div>
              </div>
              <RiskBadge level={atnd.riskLevel} t={t} />
            </div>
          ))}
          <div className="p-5 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center group cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
            <Plus className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const DiagnosticsView = ({ t }: { t: any }) => {
  const churnData = [
    { name: 'Jan', rate: 4.2 }, { name: 'Feb', rate: 3.8 }, { name: 'Mar', rate: 5.1 },
    { name: 'Apr', rate: 4.5 }, { name: 'May', rate: 3.2 }, { name: 'Jun', rate: 2.8 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-10">Churn Rate (%)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={churnData}>
                <defs>
                  <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} />
                <Tooltip />
                <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorChurn)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-10">Revenue Stability (MRR)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} />
                <YAxis hide />
                <Tooltip />
                <Line type="stepAfter" dataKey="rate" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Avg Customer Lifetime', val: '14.2 Mo', change: '+2.1' },
          { label: 'Retention ROI (Est.)', val: 'RON 4,200', change: '+15.5' },
          { label: 'Coach Compliance', val: '92%', change: '+4.0' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h4 className="text-2xl font-black">{stat.val}</h4>
              <span className="text-emerald-400 text-xs font-black">{stat.change}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App Component ---

const Dashboard = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState('at-risk');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const [members, setMembers] = useState<Member[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dailyClasses, setDailyClasses] = useState<DailyClass[]>([]);

  const t = translations[language];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [membersData, milestonesData, classesData] = await Promise.all([
          getMembers(),
          getMilestones(),
          getDailyClasses()
        ]);
        setMembers(membersData);
        setMilestones(milestonesData);
        setDailyClasses(classesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showToast("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  const filteredMembers = useMemo(() => {
    let result = members.filter(m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (activeTab === 'at-risk') {
      result = result.filter(m => m.riskLevel !== RiskLevel.OK);
    }
    return result;
  }, [searchQuery, activeTab]);

  const pieData = useMemo(() => {
    const counts = {
      [RiskLevel.CRITICAL]: 0,
      [RiskLevel.HIGH]: 0,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.OK]: 0,
    };
    members.forEach(m => {
      // Use explicit counting
      if (counts[m.riskLevel] !== undefined) {
        counts[m.riskLevel]++;
      }
    });

    return [
      { name: 'Critical', value: counts[RiskLevel.CRITICAL], color: '#f43f5e' },
      { name: 'High', value: counts[RiskLevel.HIGH], color: '#f97316' },
      { name: 'Medium', value: counts[RiskLevel.MEDIUM], color: '#f59e0b' },
      { name: 'Healthy', value: counts[RiskLevel.OK], color: '#10b981' },
    ];
  }, [members]);

  const stats = useMemo(() => {
    const revenueAtRisk = members.reduce((acc, curr) => curr.riskLevel !== RiskLevel.OK ? acc + curr.monthlyRevenue : acc, 0);
    return {
      total: members.length,
      revenueAtRisk,
      avgAttendance: 3.2,
      newThisMonth: 8
    };
  }, []);

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === filteredMembers.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredMembers.map(m => m.id)));
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-[2rem]" />)}
        </div>
      );
    }

    switch (activeTab) {
      case 'milestones': return <MilestonesView t={t} milestones={milestones} />;
      case 'daily-brief': return <DailyBriefView t={t} dailyClasses={dailyClasses} />;
      case 'diagnostics': return <DiagnosticsView t={t} />;
      case 'at-risk': return <WatchlistSection members={members} searchQuery={searchQuery} t={t} onShowToast={(msg, type) => showToast(msg, type || 'success')} />;
      case 'import': return <CSVImport onImportComplete={() => window.location.reload()} />;
      default: return (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          {selectedRows.size > 0 ? (
            <div className="bg-slate-900 px-8 py-4 flex items-center justify-between animate-in slide-in-from-top-6 duration-300">
              <p className="text-white text-sm font-black uppercase tracking-widest">{selectedRows.size} {t.members} {translations[language].logout === 'Deconectare' ? 'Selectați' : 'Selected'}</p>
              <div className="flex items-center space-x-4">
                <button className="flex items-center text-[10px] font-black uppercase text-indigo-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                  <Mail className="w-3.5 h-3.5 mr-2" /> Broadcast
                </button>
                <button onClick={() => setSelectedRows(new Set())} className="text-white ml-2"><XCircle className="w-5 h-5" /></button>
              </div>
            </div>
          ) : (
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                  {activeTab === 'at-risk' ? t.watchlist : t.members}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium italic">{t.healthProfile}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="p-2.5 text-slate-400 hover:text-indigo-600 border border-slate-200 rounded-2xl transition-all"><Filter className="w-5 h-5" /></button>
                <button className="p-2.5 text-slate-400 hover:text-indigo-600 border border-slate-200 rounded-2xl transition-all"><Download className="w-5 h-5" /></button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 w-12">
                    <input
                      type="checkbox"
                      className="rounded-lg border-slate-300 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 h-5 w-5"
                      checked={selectedRows.size === filteredMembers.length && filteredMembers.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.memberIdentity}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.engagement}</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.riskIndex}</th>
                  <th className="px-8 py-5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className={`hover:bg-indigo-50/40 transition-all group ${selectedRows.has(member.id) ? 'bg-indigo-50/60' : ''}`}>
                      <td className="px-8 py-6">
                        <input
                          type="checkbox"
                          className="rounded-lg border-slate-300 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 h-5 w-5"
                          checked={selectedRows.has(member.id)}
                          onChange={() => toggleRow(member.id)}
                        />
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-sm font-black text-indigo-600 shadow-sm transition-transform group-hover:scale-105">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-tight">{member.name}</p>
                            <p className="text-xs text-slate-400 mt-1 font-medium">{member.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-tight">
                            <span>{member.monthlyClasses} {t.classesAbbr}</span>
                            <span className="text-indigo-600">{Math.round((member.attendanceFrequency / 5) * 100)}% {t.momentum}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${member.attendanceFrequency > 3.5 ? 'bg-indigo-600' : member.attendanceFrequency > 1.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, (member.attendanceFrequency / 5) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <RiskBadge level={member.riskLevel} t={t} />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="p-3 text-slate-400 hover:text-white hover:bg-indigo-600 rounded-2xl transition-all shadow-indigo-100 hover:shadow-xl"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center max-w-xs mx-auto">
                        <div className="p-6 bg-slate-50 rounded-[2.5rem] mb-6 border border-slate-100">
                          <Users className="w-12 h-12 text-slate-300" />
                        </div>
                        <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">{t.noMembers}</h4>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-['Inter'] antialiased">
      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-200 bg-white flex flex-col fixed inset-y-0 z-40 transition-transform">
        <div className="p-8 flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 transform -rotate-6 transition-transform hover:rotate-0 cursor-pointer">
            <Trophy className="w-6 h-6" />
          </div>
          <span className="font-black text-2xl tracking-tighter text-slate-900">GUARD</span>
        </div>

        <nav className="flex-1 px-6 space-y-1 mt-4">
          {[
            { id: 'at-risk', label: t.watchlist, icon: AlertTriangle, color: 'text-rose-500', badge: members.filter(m => m.riskLevel !== RiskLevel.OK).length },
            { id: 'milestones', label: t.milestones, icon: Trophy, color: 'text-amber-500' },
            { id: 'daily-brief', label: t.dailyBrief, icon: Calendar, color: 'text-blue-500' },
            { id: 'diagnostics', label: t.diagnostics, icon: TrendingUp, color: 'text-emerald-500' },
            { id: 'members', label: t.members, icon: Users, color: 'text-indigo-500' },
            { id: 'import', label: t.importData, icon: Upload, color: 'text-violet-500' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSelectedRows(new Set()); }}
              className={`w-full flex items-center px-4 py-4 text-sm font-bold rounded-2xl transition-all group ${activeTab === item.id
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
              <item.icon className={`w-5 h-5 mr-3 transition-colors ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {item.label}
              {item.badge !== undefined && (
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === item.id ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-slate-100 bg-slate-50/30">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <Target className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t.ritualStatus}</p>
            </div>
            <p className="text-xs font-bold text-slate-800 leading-relaxed mb-4">12 check-ins pending for Monday's ritual.</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden">
              <div className="bg-indigo-600 h-full w-[40%] rounded-full"></div>
            </div>
            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">{t.executeSOP}</button>
          </div>
          <div className="flex items-center justify-between">
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Settings className="w-5 h-5" /></button>
            <button className="p-2 text-rose-400 hover:text-rose-600 transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 min-h-screen">
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-30">
          <div className="flex items-center space-x-12 flex-1">
            <h2 className="font-black text-slate-900 text-xl tracking-tight hidden lg:block uppercase">
              {t[activeTab as keyof typeof t] || activeTab.replace('-', ' ')}
            </h2>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                className="w-full pl-12 pr-6 py-3 bg-slate-100 border-transparent rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-5">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setLanguage('en')}
                className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('ro')}
                className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${language === 'ro' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                RO
              </button>
            </div>


            <div className="w-px h-8 bg-slate-200"></div>
            <div className="w-10 h-10 rounded-2xl bg-slate-900 border-2 border-slate-100 overflow-hidden shadow-lg">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
            </div>
          </div>
        </header>

        <div className="p-10">
          <div className="max-w-7xl mx-auto space-y-10">

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <KPICard title={t.totalMembers} value={stats.total} change={2.5} isPositive={true} loading={loading} />
              <KPICard title={t.revenueRisk} value={stats.revenueAtRisk} change={12} isPositive={false} prefix="RON " loading={loading} />
              <KPICard title={t.avgAttendance} value={stats.avgAttendance} change={5.1} isPositive={true} loading={loading} />
              <KPICard title={t.newLeads} value={stats.newThisMonth} change={18} isPositive={true} loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                {renderTabContent()}

                {activeTab !== 'diagnostics' && activeTab !== 'daily-brief' && (
                  <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{t.attendanceMomentum}</h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium">{t.healthProfile}</p>
                      </div>
                    </div>
                    <div className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={attendanceData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} dy={15} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} />
                          <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px' }} />
                          <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={36}>
                            {attendanceData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 5 ? '#4f46e5' : '#e0e7ff'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Content Area */}
              <div className="space-y-10">
                {/* Daily Brief Coach Card */}
                <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center space-x-3 text-indigo-400">
                        <Calendar className="w-6 h-6" />
                        <h3 className="font-black text-xl uppercase tracking-tighter">{t.nextClass}</h3>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl group-hover:bg-white/10 transition-colors">
                        <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 tracking-widest">{t.coachBrief}</p>
                        <p className="text-xl font-black">Dan Iordache</p>
                        <p className="text-3xl font-black mt-4 text-indigo-50">CrossFit WOD</p>
                        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                          <div className="flex -space-x-4">
                            {[...Array(4)].map((_, i) => (
                              <div key={i} className="w-10 h-10 rounded-2xl border-4 border-slate-900 bg-slate-800 overflow-hidden shadow-lg transform transition-transform hover:-translate-y-1">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 30}`} alt="User" />
                              </div>
                            ))}
                            <div className="w-10 h-10 rounded-2xl border-4 border-slate-900 bg-indigo-600 flex items-center justify-center text-[10px] font-black">+8</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button className="w-full mt-10 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 hover:scale-[1.02] transition-all">
                      {t.coachBrief}
                    </button>
                  </div>
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                </div>

                {/* Risk Distribution Chart Card */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight mb-10">{t.healthProfile}</h3>
                  <div className="h-[240px] flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black text-slate-900">{members.length}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                    </div>
                  </div>
                </div>

                {/* Growth Opportunities */}
                <div className="bg-indigo-50 p-10 rounded-[2.5rem] border border-indigo-100 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <Target className="w-6 h-6" />
                      </div>
                      <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{t.growthEngine}</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-indigo-100/50 shadow-sm transition-transform hover:-translate-y-1 cursor-pointer">
                        <div className="flex items-center space-x-4">
                          <Heart className="w-5 h-5 text-indigo-600" />
                          <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Referral Boost</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals & Notifications */}
        <OutreachModal member={selectedMember} isOpen={!!selectedMember} onClose={() => setSelectedMember(null)} onShowToast={(m) => showToast(m)} />

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </main>
    </div>
  );
};

export default Dashboard;
