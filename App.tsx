
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
  ClipboardList,
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

const celebrationTemplates = {
  en: {
    pr: `Congratulations [Name]! 🏆

You just crushed your personal record on [Exercise]! [Weight] is incredible!

Keep pushing, your progress is amazing! 💪

- Smart Move CrossFit Team`,

    class_count: `Amazing [Name]! 💯

You just hit [Count] classes at Smart Move CrossFit! That's some serious dedication!

Thank you for being such an awesome part of our community! 🙌

- Smart Move CrossFit Team`,

    streak: `You're on fire [Name]! 🔥

[Weeks] weeks in a row - that's what consistency looks like!

Keep that momentum going! 💪

- Smart Move CrossFit Team`,

    comeback: `Welcome back [Name]! 💪

So great to see you back at the gym! We missed you!

Let's get back into it together! 🙌

- Smart Move CrossFit Team`,

    anniversary: `Happy Anniversary [Name]! 🎂

[Years] year(s) with Smart Move CrossFit! Thank you for being part of our family!

Here's to many more years of crushing goals together! 🎉

- Smart Move CrossFit Team`
  },
  ro: {
    pr: `Felicitări [Name]! 🏆

Tocmai ai doborât recordul personal la [Exercise]! [Weight] este incredibil!

Continuă așa, progresul tău este uimitor! 💪

- Echipa Smart Move CrossFit`,

    class_count: `Superb [Name]! 💯

Tocmai ai atins [Count] clase la Smart Move CrossFit! Asta înseamnă dedicare serioasă!

Mulțumim că faci parte din comunitatea noastră! 🙌

- Echipa Smart Move CrossFit`,

    streak: `Ești în flăcări [Name]! 🔥

[Weeks] săptămâni la rând - asta înseamnă consecvență!

Continuă pe același drum! 💪

- Echipa Smart Move CrossFit`,

    comeback: `Bine ai revenit [Name]! 💪

Ne bucurăm să te vedem înapoi la sală! Ne-a fost dor de tine!

Hai să o luăm de la capăt împreună! 🙌

- Echipa Smart Move CrossFit`,

    anniversary: `La mulți ani [Name]! 🎂

[Years] an(i) cu Smart Move CrossFit! Mulțumim că faci parte din familia noastră!

La încă mulți ani de obiective atinse împreună! 🎉

- Echipa Smart Move CrossFit`
  }
};


const translations = {
  en: {
    dashboard: "Dashboard",
    watchlist: "Watchlist",
    milestones: "Milestones",
    dailyBrief: "Daily Brief",
    diagnostics: "Diagnostics",
    members: "Members",
    settings: "Settings",
    insights: "Insights",
    activityLog: "Activity Log",
    importData: "Import Data",
    logout: "Logout",

    searchPlaceholder: "Search members, activities...",
    memberIdentity: "Member Identity",

    riskIndex: "Risk Index",
    classes: "Classes",
    momentum: "Momentum",

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

    sopFocus: "SOP Focus",
    langName: "English",

    classesAbbr: "cls",
    // Watchlist

    retentionRate: "Retention Rate",
    revenueAtRisk: "Revenue at Risk",
    membersSaved: "Members Saved",

    expiringSoon: "Expiring Soon",
    thisMonth: "this month",

    days: "days",
    // Tabs
    atRisk: "AT RISK",
    winBack: "WIN-BACK",
    cold: "COLD",
    // Table Headers
    clientId: "CLIENT ID",
    name: "NAME",
    risk: "RISK",
    value: "VALUE",
    lastVisit: "LAST VISIT",
    inactive: "INACTIVE",
    attendance: "ATTENDANCE",
    expiry: "EXPIRY",
    auto: "AUTO",
    coach: "COACH",
    actions: "ACTIONS",
    // Risk Levels
    riskCritical: "CRITICAL",  // existing but adding aliases if needed or just use these
    riskHigh: "HIGH",
    riskMedium: "MEDIUM",
    riskLow: "LOW",
    // Tiers
    vip: "VIP",
    core: "CORE",
    std: "STD",
    // Right Sidebar
    distribution: "DISTRIBUTION",
    healthy: "HEALTHY",
    monitor: "MONITOR",
    atRiskLabel: "AT RISK",
    criticalLabel: "CRITICAL",
    active: "ACTIVE",
    quickActions: "QUICK ACTIONS",
    exportCsv: "Export CSV",
    bulkWhatsapp: "Bulk WhatsApp",
    bulkEmail: "Bulk Email",
    weeklyReport: "Weekly Report",
    thisWeeksFocus: "THIS WEEK'S FOCUS",
    membershipsExpiringSoon: "memberships expiring soon",
    vipsNeedRetentionCheck: "VIPs need retention check",
    monthlyRevenueAtRisk: "monthly revenue at risk",
    topPriority: "TOP PRIORITY",
    contactMember: "Contact",
    vipExpiring: "(VIP, Expiring)",
    recentActivity: "RECENT ACTIVITY",
    contacted: "Contacted",
    hoursAgo: "hours ago",
    markedAsDone: "Marked as done",
    yesterday: "Yesterday",
    // Outreach Templates
    outreachTemplates: "OUTREACH TEMPLATES",
    atRiskTemplate: "At-Risk",
    expiringTemplate: "Expiring Soon",
    winBackTemplate: "Win-Back",


    // Template Messages
    atRiskMessage: "Hey [Name]! 👋\n\nWe noticed you haven't been to the gym in a while and wanted to check in. Everything okay?\n\nIf there's anything we can do to help you get back on track - adjust your schedule, try different classes, or just chat about your goals - we're here for you!\n\nLooking forward to seeing you soon! 💪\n\n- Smart Move CrossFit Team",
    expiringMessage: "Hi [Name]! 👋\n\nJust a friendly reminder that your membership expires soon.\n\nWe'd love to keep you as part of our community! If you have any questions about renewal options or want to discuss your fitness goals, just let us know.\n\nSee you at the gym! 💪\n\n- Smart Move CrossFit Team",
    winBackMessage: "Hey [Name]! 👋\n\nWe miss seeing you at Smart Move CrossFit! It's been a while since your last visit.\n\nWe'd love to have you back. If anything has changed or you need help getting back into a routine, we're here to support you.\n\nCome by anytime - the community misses you! 💪\n\n- Smart Move CrossFit Team",
    daysAgo: "days",
    cls: "cls",
    sortBy: "SORT BY",
    riskPriority: "RISK PRIORITY",
    // Members Redesign
    activeMembers: "Active Members",
    newThisMonth: "New This Month",
    churnedThisMonth: "Churned This Month",
    avgTenure: "Avg Tenure",
    avgClassesWeek: "Avg Classes/wk",
    avgValue: "Avg Value",
    allMembers: "ALL MEMBERS",
    newMembers: "NEW",
    vipMembers: "VIPs",
    memberSegments: "MEMBER SEGMENTS",
    established: "Established",
    newMemberChecklist: "NEW MEMBER CHECKLIST",
    onboardingSteps: "Onboarding steps for new members",
    week1Welcome: "Week 1: Welcome message",
    week2Checkin: "Week 2: Check-in call",
    week4Progress: "Week 4: Progress chat",
    week8Review: "Week 8: Goal review",
    welcomeEmailNew: "Welcome Email to New Members",
    checkinLowClasses: "Check-in with < 3 Classes",
    exportMemberList: "Export Member List",
    newMemberOnboarding: "NEW MEMBER ONBOARDING",
    joined: "Joined",
    week: "Week",
    status: "Status",
    nextAction: "Next Action",
    onTrack: "On Track",
    slowStart: "Slow Start",
    viewAllNewMembers: "View All New Members",
    // Milestones
    milestonesThisWeek: "This Week",
    prsThisMonth: "PRs This Month",
    classMilestones: "Class Milestones",
    activeStreaks: "Active Streaks",
    comebacks: "Comebacks",
    anniversariesMonth: "Anniversaries",
    celebrationProgress: "CELEBRATION PROGRESS",
    stillToCelebrate: "members still to celebrate!",
    weeklyTemplates: "WEEKLY TEMPLATES",
    monthlySummary: "MONTHLY SUMMARY",
    generateRecaps: "Generate personalized recaps for members",
    selectMemberPreview: "Select member to preview...",
    sendToAllActive: "Send to All Active Members",
    downloadAllCsv: "Download All as CSV",
    customizeTemplates: "Customize Templates",
    allTypes: "All Types",
    filterThisWeek: "This Week",
    filterThisMonth: "This Month",
    filterAllTime: "All Time",
    allStatus: "All Status",
    pending: "Pending",
    celebrated: "Celebrated",
    searchMember: "Search member...",
    markCelebrated: "Mark Celebrated",
    pr: "PR",
    classCount: "Class Count",
    streak: "Streak",
    comeback: "Comeback",

    anniversary: "Anniversary",
    // Insights
    gymHealthScore: "GYM HEALTH SCORE",
    excellent: "EXCELLENT",
    good: "GOOD",
    needsAttention: "NEEDS ATTENTION",
    retention: "Retention",
    engagement: "Engagement",
    growth: "Growth",
    retentionTrend: "RETENTION TREND",
    sixMonthAverage: "6-month average",
    vsLastMonth: "vs last month",

    thriving: "Thriving",
    stable: "Stable",
    critical: "Critical",
    attendancePatterns: "ATTENDANCE PATTERNS",
    bestDay: "Best",
    slowestDay: "Slowest",
    revenueAnalysis: "REVENUE ANALYSIS",
    monthlyRecurring: "Monthly Recurring",
    atRiskRevenue: "At Risk Revenue",
    avgMemberValue: "Avg Member Value",
    potentialLost: "Potential Lost (if all at-risk churn)",
    keyInsights: "KEY INSIGHTS & RECOMMENDATIONS",
    topPerformers: "TOP PERFORMERS",
    mostActiveThisMonth: "Most active members this month",
    churnRiskFactors: "CHURN RISK FACTORS",
    commonReasonsLeave: "Common reasons members leave",
    lowAttendance: "Low attendance",
    noAutoRenew: "No auto-renew enabled",
    newMemberDropout: "New member dropout",
  },
  ro: {
    dashboard: "Panou Control",
    watchlist: "Monitorizare",
    milestones: "Realizări",
    dailyBrief: "Brief Zilnic",
    diagnostics: "Diagnostic",
    members: "Membri",
    settings: "Setări",
    insights: "Statistici",
    activityLog: "Jurnal Activitate",
    importData: "Import Date",
    logout: "Deconectare",

    searchPlaceholder: "Caută membri, activități...",
    // Risk
    // Risk
    riskLow: "SCĂZUT",
    memberIdentity: "Identitate Membru",

    riskIndex: "Index Risc",
    classes: "Clase",
    momentum: "Momentum",

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

    sopFocus: "Focus SOP",
    langName: "Română",

    classesAbbr: "cl.",
    // Watchlist
    retentionRate: "Rată Retenție",
    revenueAtRisk: "Venit în Risc",
    membersSaved: "Membri Salvați",
    expiringSoon: "Expiră Curând",
    thisMonth: "luna aceasta",

    days: "zile",
    // Tabs
    atRisk: "ÎN RISC",
    winBack: "DE RECUPERAT",
    cold: "INACTIVI",
    // Table Headers
    clientId: "ID CLIENT",
    name: "NUME",
    risk: "RISC",
    value: "VALOARE",
    lastVisit: "ULTIMA VIZITĂ",
    inactive: "INACTIV",
    attendance: "PREZENȚĂ",
    expiry: "EXPIRARE",
    auto: "AUTO",
    coach: "ANTRENOR",
    actions: "ACȚIUNI",
    // Tiers
    vip: "VIP",
    core: "CORE",
    std: "STD",
    // Right Sidebar
    distribution: "DISTRIBUȚIE",
    healthy: "SĂNĂTOS",
    monitor: "MONITORIZARE",
    atRiskLabel: "ÎN RISC",
    criticalLabel: "CRITIC",
    active: "ACTIVI",
    quickActions: "ACȚIUNI RAPIDE",
    exportCsv: "Exportă CSV",
    bulkWhatsapp: "WhatsApp în Masă",
    bulkEmail: "Email în Masă",
    weeklyReport: "Raport Săptămânal",
    thisWeeksFocus: "FOCUS SĂPTĂMÂNA ACEASTA",
    membershipsExpiringSoon: "abonamente expiră curând",
    vipsNeedRetentionCheck: "VIP-uri necesită verificare",
    monthlyRevenueAtRisk: "venit lunar în risc",
    topPriority: "PRIORITATE MAXIMĂ",
    contactMember: "Contactează",
    vipExpiring: "(VIP, Expiră)",
    recentActivity: "ACTIVITATE RECENTĂ",
    contacted: "Contactat",
    hoursAgo: "ore în urmă",
    markedAsDone: "Marcat ca rezolvat",
    yesterday: "Ieri",
    // Outreach Templates
    outreachTemplates: "ȘABLOANE MESAJE",
    atRiskTemplate: "În Risc",
    expiringTemplate: "Expiră Curând",
    winBackTemplate: "Recuperare",
    templateInstructions: "Selectează un membru din listă și apasă butonul WhatsApp sau Email pentru a trimite acest mesaj.",

    // Template Messages
    atRiskMessage: "Salut [Name]! 👋\n\nAm observat că nu ai mai fost la sală de ceva vreme și am vrut să vedem cum ești. Totul e în regulă?\n\nDacă putem face ceva să te ajutăm să revii pe drumul cel bun - să îți ajustăm programul, să încerci alte clase, sau doar să discutăm despre obiectivele tale - suntem aici pentru tine!\n\nAbia așteptăm să te revedem! 💪\n\n- Echipa Smart Move CrossFit",
    expiringMessage: "Salut [Name]! 👋\n\nDoar un reminder prietenesc că abonamentul tău expiră curând.\n\nNe-ar plăcea să te păstrăm în comunitatea noastră! Dacă ai întrebări despre opțiunile de reînnoire sau vrei să discutăm despre obiectivele tale de fitness, doar spune-ne.\n\nNe vedem la sală! 💪\n\n- Echipa Smart Move CrossFit",
    winBackMessage: "Salut [Name]! 👋\n\nNe este dor de tine la Smart Move CrossFit! A trecut ceva timp de la ultima ta vizită.\n\nNe-ar plăcea să te avem înapoi. Dacă s-a schimbat ceva sau ai nevoie de ajutor să revii la rutină, suntem aici să te susținem.\n\nTreci pe la noi oricând - comunitatea te așteaptă! 💪\n\n- Echipa Smart Move CrossFit",
    daysAgo: "zile",
    cls: "cls",
    sortBy: "SORTARE",
    riskPriority: "PRIORITATE RISC",
    // Members Redesign
    activeMembers: "Membri Activi",
    newThisMonth: "Noi Luna Aceasta",
    churnedThisMonth: "Pierduți Luna Aceasta",
    avgTenure: "Vechime Medie",
    avgClassesWeek: "Clase/săpt Medie",
    avgValue: "Valoare Medie",
    allMembers: "TOȚI MEMBRII",
    newMembers: "NOI",
    vipMembers: "VIP-uri",
    memberSegments: "SEGMENTE MEMBRI",
    established: "Stabiliți",
    newMemberChecklist: "CHECKLIST MEMBRI NOI",
    onboardingSteps: "Pași de onboarding pentru membri noi",
    week1Welcome: "Săpt 1: Mesaj de bun venit",
    week2Checkin: "Săpt 2: Apel de verificare",
    week4Progress: "Săpt 4: Discuție progres",
    week8Review: "Săpt 8: Revizuire obiective",
    welcomeEmailNew: "Email Bun Venit pentru Noi",
    checkinLowClasses: "Verificare cu < 3 Clase",
    exportMemberList: "Exportă Lista Membri",
    newMemberOnboarding: "ONBOARDING MEMBRI NOI",
    joined: "Înscris",
    week: "Săptămâna",
    status: "Status",
    nextAction: "Acțiune Următoare",
    onTrack: "Pe Drumul Bun",
    slowStart: "Start Lent",
    viewAllNewMembers: "Vezi Toți Membrii Noi",
    // Milestones
    milestonesThisWeek: "Săptămâna Aceasta",
    prsThisMonth: "PR-uri Luna Aceasta",
    classMilestones: "Clase Milestone",
    activeStreaks: "Streak-uri Active",
    comebacks: "Reveniri",
    anniversariesMonth: "Aniversări",
    celebrationProgress: "PROGRES CELEBRĂRI",
    stillToCelebrate: "membri de celebrat!",
    weeklyTemplates: "ȘABLOANE SĂPTĂMÂNALE",
    monthlySummary: "SUMAR LUNAR",
    generateRecaps: "Generează rezumate personalizate pentru membri",
    selectMemberPreview: "Selectează membru pentru previzualizare...",
    sendToAllActive: "Trimite la Toți Membrii Activi",
    downloadAllCsv: "Descarcă Tot ca CSV",
    customizeTemplates: "Personalizează Șabloanele",
    allTypes: "Toate Tipurile",
    filterThisWeek: "Săptămâna Aceasta",
    filterThisMonth: "Luna Aceasta",
    filterAllTime: "Tot Timpul",
    allStatus: "Toate Statusurile",
    pending: "În Așteptare",
    celebrated: "Celebrat",
    searchMember: "Caută membru...",
    markCelebrated: "Marchează Celebrat",
    pr: "Record Personal",
    classCount: "Număr Clase",
    streak: "Serie",
    comeback: "Revenire",
    anniversary: "Aniversare",
    // Insights
    gymHealthScore: "SCOR SĂNĂTATE SALĂ",
    excellent: "EXCELENT",
    good: "BUN",
    needsAttention: "NECESITĂ ATENȚIE",
    retention: "Retenție",
    engagement: "Implicare",
    growth: "Creștere",
    retentionTrend: "TREND RETENȚIE",
    sixMonthAverage: "Media pe 6 luni",
    vsLastMonth: "vs luna trecută",

    thriving: "Înfloritoare",
    stable: "Stabil",
    critical: "Critic",
    attendancePatterns: "TIPARE PREZENȚĂ",
    bestDay: "Cea mai bună",
    slowestDay: "Cea mai slabă",
    revenueAnalysis: "ANALIZĂ VENITURI",
    monthlyRecurring: "Venit Lunar Recurent",
    atRiskRevenue: "Venit în Risc",
    avgMemberValue: "Valoare Medie Membru",
    potentialLost: "Pierdere Potențială (dacă toți în risc pleacă)",
    keyInsights: "INSIGHT-URI CHEIE & RECOMANDĂRI",
    topPerformers: "TOP PERFORMERI",
    mostActiveThisMonth: "Cei mai activi membri luna aceasta",
    churnRiskFactors: "FACTORI RISC PLECARE",
    commonReasonsLeave: "Motive comune pentru care membrii pleacă",
    lowAttendance: "Prezență scăzută",
    noAutoRenew: "Fără reînnoire automată",
    newMemberDropout: "Abandon membri noi",
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

const MilestonesView = ({ t, milestones, members }: { t: any, milestones: Milestone[], members: Member[] }) => {
  const [filterType, setFilterType] = useState('all');
  const [filterTime, setFilterTime] = useState('this_month');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState('pr');
  const [selectedMemberId, setSelectedMemberId] = useState('');

  // Mock Milestones Data (since backend might not have it all yet)
  const mockMilestones: Milestone[] = useMemo(() => {
    const types: Milestone['type'][] = ['pr', 'class_count', 'streak', 'comeback', 'anniversary'] as any;
    return members.slice(0, 20).map((m, i) => ({
      id: `ms-${i}`,
      memberId: m.id,
      memberName: m.name,
      type: types[i % 5],
      value: i % 5 === 0 ? 'Back Squat 100kg' : i % 5 === 1 ? '100 Classes' : i % 5 === 2 ? '10 Weeks' : i % 5 === 3 ? 'After 3 months' : '1 Year',
      date: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      celebrated: i % 3 === 0,
      previousValue: i % 5 === 0 ? '95kg' : undefined,
      improvement: i % 5 === 0 ? '5kg' : undefined
    }));
  }, [members]);

  const allMilestones = [...mockMilestones]; // Use mock data for now

  // KPIs
  const milestonesThisWeek = allMilestones.filter(m => {
    const d = new Date(m.date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const prsThisMonth = allMilestones.filter(m => m.type === 'pr').length;
  const classMilestones = allMilestones.filter(m => m.type === 'class_count').length;
  const activeStreaks = allMilestones.filter(m => m.type === 'streak').length;
  const comebacks = allMilestones.filter(m => m.type === 'comeback').length;
  const anniversaries = allMilestones.filter(m => m.type === 'anniversary' as any).length;

  // Filtering
  const filteredMilestones = allMilestones.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending' && m.celebrated) return false;
      if (filterStatus === 'celebrated' && !m.celebrated) return false;
    }
    if (searchQuery && !m.memberName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // Time filter logic simplified for demo
    return true;
  });

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedRows(newSet);
  };

  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'pr': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'class_count': return <Trophy className="w-4 h-4 text-emerald-500" />;
      case 'streak': return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'comeback': return <Heart className="w-4 h-4 text-rose-500" />;
      case 'anniversary': return <CheckCircle2 className="w-4 h-4 text-purple-500" />;
      default: return <Trophy className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTemplateMessage = (type: string, name: string) => {
    // Basic template replacement
    const lang = 'en'; // Hardcoded for simplified template selection or use a prop
    // @ts-ignore
    let msg = celebrationTemplates[lang][type] || '';
    msg = msg.replace('[Name]', name).replace('[Exercise]', 'Exercise').replace('[Weight]', 'Weight').replace('[Count]', '100').replace('[Weeks]', '10').replace('[Years]', '1');
    return msg;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. KPIs */}
      <div className="grid grid-cols-6 gap-4">
        {[{ label: t.milestonesThisWeek, value: milestonesThisWeek, color: 'text-indigo-600', sub: 'milestones' },
        { label: t.prsThisMonth, value: prsThisMonth, color: 'text-amber-500', sub: '↑ 15%', subColor: 'text-emerald-500' },
        { label: t.classMilestones, value: classMilestones, color: 'text-emerald-600', sub: '50, 100, 200+ cls' },
        { label: t.activeStreaks, value: activeStreaks, color: 'text-orange-500', sub: 'members' },
        { label: t.comebacks, value: comebacks, color: 'text-rose-500', sub: 'returned' },
        { label: t.anniversariesMonth, value: anniversaries, color: 'text-purple-600', sub: 'this month' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{kpi.label}</p>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            <p className={`text-[10px] font-bold ${kpi.subColor || 'text-slate-400'}`}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* 2. Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column (70%) */}
        <div className="flex-1 space-y-6">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-4 items-center shadow-sm">
            <div className="flex items-center space-x-2 border-r border-slate-100 pr-4">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase">Filters</span>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl border-slate-200 text-sm font-bold text-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
            >
              <option value="all">{t.allTypes}</option>
              <option value="pr">{t.pr}</option>
              <option value="class_count">{t.classCount}</option>
              <option value="streak">{t.streak}</option>
              <option value="comeback">{t.comeback}</option>
              <option value="anniversary">{t.anniversary}</option>
            </select>
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl border-slate-200 text-sm font-bold text-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
            >
              <option value="week">{t.filterThisWeek}</option>
              <option value="month">{t.filterThisMonth}</option>
              <option value="all">{t.filterAllTime}</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl border-slate-200 text-sm font-bold text-slate-600 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
            >
              <option value="all">{t.allStatus}</option>
              <option value="pending">{t.pending}</option>
              <option value="celebrated">{t.celebrated}</option>
            </select>
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchMember}
                className="w-full pl-10 pr-4 py-2 rounded-xl border-slate-200 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="px-6 py-4">{t.name}</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Achievement</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredMilestones.map((milestone) => (
                  <React.Fragment key={milestone.id}>
                    <tr
                      className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(milestone.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${milestone.celebrated ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {milestone.memberName.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900">{milestone.memberName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase">
                          {getMilestoneIcon(milestone.type)}
                          <span>{milestone.type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{milestone.value}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{milestone.date}</td>
                      <td className="px-6 py-4">
                        {milestone.celebrated ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> {t.celebrated}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 uppercase tracking-widest">
                            <Clock className="w-3 h-3 mr-1" /> {t.pending}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                            <Smartphone className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.has(milestone.id) && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                            {milestone.type === 'pr' && (
                              <div className="flex items-center space-x-4 mb-4 text-xs font-bold text-slate-500">
                                <span>Previous PR: <span className="text-slate-900">{milestone.previousValue || 'N/A'}</span></span>
                                <span>•</span>
                                <span>Improvement: <span className="text-emerald-600">+{milestone.improvement || '0kg'}</span></span>
                              </div>
                            )}
                            <div className="bg-slate-50 rounded-xl p-4 mb-4 text-sm text-slate-700 font-medium whitespace-pre-wrap border border-slate-100">
                              {getTemplateMessage(milestone.type, milestone.memberName)}
                            </div>
                            <div className="flex gap-3">
                              <button className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-100 transition-all flex items-center">
                                <Smartphone className="w-4 h-4 mr-2" /> WhatsApp
                              </button>
                              <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center">
                                <Mail className="w-4 h-4 mr-2" /> Email
                              </button>
                              <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center ml-auto">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> {t.markCelebrated}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar (30%) */}
        <div className="w-full lg:w-96 space-y-6">
          {/* Celebration Stats */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
            <h3 className="font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2 text-amber-600" />
              {t.celebrationProgress}
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5 text-slate-700">
                  <span>{t.filterThisWeek}</span>
                  <span>{milestonesThisWeek} / {milestonesThisWeek + 5}</span>
                </div>
                <div className="h-2.5 bg-amber-200/50 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(milestonesThisWeek / (milestonesThisWeek + 5)) * 100}%` }}></div>
                </div>
              </div>
              <p className="text-[10px] font-bold text-amber-700/70 uppercase tracking-wide">
                5 {t.stillToCelebrate}
              </p>
            </div>
          </div>

          {/* Weekly Templates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-indigo-600" />
              {t.weeklyTemplates}
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {['pr', 'class_count', 'streak'].map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedTemplate(type)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${selectedTemplate === type ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-xs font-medium text-slate-600 mb-4 border border-slate-100 min-h-[100px] whitespace-pre-wrap">
              {getTemplateMessage(selectedTemplate, '[Member Name]')}
            </div>

            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center transition-colors">
              <Settings className="w-3 h-3 mr-1" /> {t.customizeTemplates}
            </button>
          </div>

          {/* Monthly Summary Generator */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-6">
            <h3 className="font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center">
              <BarChart2 className="w-4 h-4 mr-2 text-indigo-600" />
              {t.monthlySummary}
            </h3>
            <p className="text-xs font-medium text-slate-500 mb-6">{t.generateRecaps}</p>

            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border-slate-200 text-sm font-bold text-slate-600 mb-4 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">{t.selectMemberPreview}</option>
              {members.slice(0, 10).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            {selectedMemberId && (
              <div className="bg-white rounded-xl p-4 text-xs mb-4 border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                <p className="font-black text-slate-900 mb-2 uppercase tracking-wide">📈 Summary Preview</p>
                <ul className="space-y-1.5 text-slate-600 font-medium">
                  <li>🏋️ Classes: 12</li>
                  <li>🏆 PRs: 2 (Back Squat, Deadlift)</li>
                  <li>🔥 Streak: 8 weeks</li>
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <button className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center">
                <Smartphone className="w-4 h-4 mr-2" /> {t.sendToAllActive}
              </button>
              <button className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center">
                <Download className="w-4 h-4 mr-2" /> {t.downloadAllCsv}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

// --- New Placeholder Components ---

const InsightsView = ({ t, members }: { t: any, members: Member[] }) => {
  // 1. Data Calculation Logic

  // Health Score Metrics
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const retentionRate = Math.round((activeMembers / (totalMembers || 1)) * 100);

  const highEngagement = members.filter(m => m.attendanceFrequency >= 3).length; // >2 classes/week
  const engagementRate = Math.round((highEngagement / (totalMembers || 1)) * 100);

  const growthRate = 5; // Placeholder as we don't have historical member count in this snapshot

  // Weighted Health Score
  const calculateHealthScore = () => {
    const retentionScore = (retentionRate / 100) * 40;
    const engagementScore = (engagementRate / 100) * 35;
    const growthScore = Math.min(100, Math.max(0, growthRate + 50)) / 100 * 25;
    return Math.round((retentionScore + engagementScore + growthScore) * 100);
  };

  const healthScore = calculateHealthScore();

  // Mock Trend Data
  const retentionData = [
    { month: 'Aug', retention: 91 },
    { month: 'Sep', retention: 89 },
    { month: 'Oct', retention: 92 },
    { month: 'Nov', retention: 88 },
    { month: 'Dec', retention: 94 },
    { month: 'Jan', retention: retentionRate },
  ];

  const retentionTrend = retentionRate - 94; // Vs last month (Dec)
  const avgRetention = Math.round(retentionData.reduce((acc, curr) => acc + curr.retention, 0) / retentionData.length);

  // Member Segments
  const segmentData = [
    { name: t.thriving, value: members.filter(m => m.riskLevel === RiskLevel.OK && m.attendanceFrequency >= 3).length, color: '#10b981' },
    { name: t.stable, value: members.filter(m => m.riskLevel === RiskLevel.OK && m.attendanceFrequency < 3).length, color: '#6366f1' },
    { name: t.atRiskLabel, value: members.filter(m => m.riskLevel === RiskLevel.HIGH || m.riskLevel === RiskLevel.MEDIUM).length, color: '#f59e0b' },
    { name: t.criticalLabel, value: members.filter(m => m.riskLevel === RiskLevel.CRITICAL).length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Attendance Patterns (Mock/Derived)
  const attendanceByDay = [
    { day: 'Mon', count: 42 },
    { day: 'Tue', count: 38 },
    { day: 'Wed', count: 45 },
    { day: 'Thu', count: 35 },
    { day: 'Fri', count: 28 },
    { day: 'Sat', count: 52 },
    { day: 'Sun', count: 15 },
  ];
  const bestDay = attendanceByDay.reduce((a, b) => a.count > b.count ? a : b).day;
  const worstDay = attendanceByDay.reduce((a, b) => a.count < b.count ? a : b).day;

  // Revenue Analysis
  const monthlyRecurring = members.reduce((acc, m) => acc + m.monthlyRevenue, 0);
  const atRiskRevenue = members
    .filter(m => m.riskLevel !== RiskLevel.OK)
    .reduce((acc, m) => acc + m.monthlyRevenue, 0);
  const avgMemberValue = Math.round(monthlyRecurring / (totalMembers || 1));
  const potentialLoss = atRiskRevenue * 12; // Annualized

  // Top Performers
  const topPerformers = [...members]
    .sort((a, b) => b.monthlyClasses - a.monthlyClasses)
    .slice(0, 3);

  // Insights Generation
  const generateInsights = () => {
    const insights = [];

    // VIPs at risk
    const vipsAtRisk = members.filter(m => m.monthlyRevenue > 450 && m.riskLevel !== RiskLevel.OK);
    if (vipsAtRisk.length > 0) {
      insights.push({
        severity: 'critical',
        title: `${vipsAtRisk.length} VIP members haven't visited in 10+ days`,
        recommendation: 'Contact immediately - these are your highest value members'
      });
    }

    // Low attendance day
    const lowestDay = attendanceByDay.reduce((a, b) => a.count < b.count ? a : b);
    insights.push({
      severity: 'warning',
      title: `${lowestDay.day} has lowest attendance (${lowestDay.count} avg)`,
      recommendation: 'Consider special programming or promotions for this day'
    });

    // Positive insight
    if (retentionRate >= 90) {
      insights.push({
        severity: 'positive',
        title: `Retention rate is strong at ${retentionRate}%`,
        recommendation: 'Keep up the great work with member engagement!'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* 2. Gym Health Score (Top Banner) */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-indigo-100 uppercase tracking-widest">
                🏥 {t.gymHealthScore}
              </h2>
              <div className="flex items-end gap-6">
                <div className="text-7xl font-black tracking-tighter leading-none">{healthScore}</div>
                <div className="pb-2">
                  <div className="text-xl font-bold text-indigo-200">/100</div>
                  <div className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full inline-block mt-2 shadow-lg ${healthScore >= 80 ? 'bg-emerald-500 text-white' :
                    healthScore >= 60 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                    {healthScore >= 80 ? t.excellent : healthScore >= 60 ? t.good : t.needsAttention}
                  </div>
                </div>
              </div>
            </div>

            {/* Health Score Breakdown */}
            <div className="flex gap-8 md:gap-12 bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="text-center group">
                <div className="text-3xl font-black group-hover:scale-110 transition-transform duration-300">{retentionRate}%</div>
                <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mt-1">{t.retention}</div>
                <div className="text-sm mt-1 filter drop-shadow-md">{retentionRate >= 90 ? '✅' : '⚠️'}</div>
              </div>
              <div className="w-px bg-white/20"></div>
              <div className="text-center group">
                <div className="text-3xl font-black group-hover:scale-110 transition-transform duration-300">{engagementRate}%</div>
                <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mt-1">{t.engagement}</div>
                <div className="text-sm mt-1 filter drop-shadow-md">{engagementRate >= 70 ? '✅' : '⚠️'}</div>
              </div>
              <div className="w-px bg-white/20"></div>
              <div className="text-center group">
                <div className="text-3xl font-black group-hover:scale-110 transition-transform duration-300">+{growthRate}%</div>
                <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mt-1">{t.growth}</div>
                <div className="text-sm mt-1 filter drop-shadow-md">{growthRate >= 0 ? '✅' : '⚠️'}</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 h-4 bg-indigo-950/50 rounded-full overflow-hidden backdrop-blur-md border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,255,255,0.3)] ${healthScore >= 80 ? 'bg-emerald-400' :
                healthScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                }`}
              style={{ width: `${healthScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Row 1: Retention Trend + Member Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retention Trend Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-wide text-xs">
            <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><TrendingUp className="w-4 h-4" /></span>
            {t.retentionTrend}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} fontStart={600} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[80, 100]} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="retention"
                  stroke="#6366f1"
                  strokeWidth={4}
                  dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#818cf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex justify-between text-xs font-bold border-t border-slate-50 pt-6">
            <span className="text-slate-500 uppercase tracking-wide">{t.sixMonthAverage}: <strong className="text-slate-900 text-sm ml-1">{avgRetention}%</strong></span>
            <span className={`px-3 py-1 rounded-full ${retentionTrend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {retentionTrend >= 0 ? '↗' : '↘'} {Math.abs(retentionTrend)}% {t.vsLastMonth}
            </span>
          </div>
        </div>

        {/* Member Segments Donut Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-wide text-xs">
            <span className="bg-slate-100 p-2 rounded-lg text-slate-600"><PieChart className="w-4 h-4" /></span>
            {t.memberSegments}
          </h3>
          <div className="h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  cornerRadius={6}
                >
                  {segmentData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-4xl font-black text-slate-900 tracking-tighter">{totalMembers}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {segmentData.map(segment => (
              <div key={segment.name} className="flex items-center gap-3 text-xs font-bold bg-slate-50 p-2 rounded-xl">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: segment.color }}></div>
                <span className="text-slate-600">{segment.name}: <strong className="text-slate-900 text-sm">{segment.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Attendance Patterns + Revenue Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Patterns Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-wide text-xs">
            <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Calendar className="w-4 h-4" /></span>
            {t.attendancePatterns}
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} fontStart={800} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 8, 8]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 flex justify-between text-xs font-bold border-t border-slate-50 pt-4">
            <span className="text-emerald-600 uppercase tracking-wide flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg">📈 {t.bestDay}: <strong className="text-emerald-800">{bestDay}</strong></span>
            <span className="text-rose-600 uppercase tracking-wide flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-lg">📉 {t.slowestDay}: <strong className="text-rose-800">{worstDay}</strong></span>
          </div>
        </div>

        {/* Revenue Analysis Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-wide text-xs">
            <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Target className="w-4 h-4" /></span>
            {t.revenueAnalysis}
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 hover:scale-[1.02] transition-transform duration-200">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t.monthlyRecurring}</span>
              <span className="text-xl font-black text-emerald-600">RON {monthlyRecurring.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50 hover:scale-[1.02] transition-transform duration-200">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t.atRiskRevenue}</span>
              <span className="text-xl font-black text-rose-600">RON {atRiskRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 hover:scale-[1.02] transition-transform duration-200">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t.avgMemberValue}</span>
              <span className="text-xl font-black text-indigo-600">RON {avgMemberValue}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 hover:scale-[1.02] transition-transform duration-200">
              <div>
                <span className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest block mb-0.5">Potential Loss</span>
                <span className="text-xs text-amber-600 font-medium">Annualized Churn Risk</span>
              </div>
              <span className="text-xl font-black text-amber-600">RON {potentialLoss.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Insights & Recommendations */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border border-slate-200 p-8 relative overflow-hidden group hover:shadow-lg transition-all duration-500">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none group-hover:opacity-80 transition-opacity"></div>
        <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-wide text-xs relative z-10">
          <span className="bg-amber-100 p-2 rounded-lg text-amber-600"><Zap className="w-4 h-4" /></span>
          {t.keyInsights}
        </h3>
        <div className="space-y-4 relative z-10">
          {insights.map((insight, index) => (
            <div key={index} className={`flex items-start gap-5 p-5 rounded-2xl border shadow-sm transition-all hover:translate-x-1 hover:shadow-md ${insight.severity === 'critical' ? 'bg-rose-50 border-rose-100' :
              insight.severity === 'warning' ? 'bg-amber-50 border-amber-100' :
                'bg-emerald-50 border-emerald-100'
              }`}>
              <span className="text-2xl mt-0.5 filter drop-shadow-sm">
                {insight.severity === 'critical' ? '🔴' : insight.severity === 'warning' ? '🟡' : '🟢'}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 mb-1">{insight.title}</p>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">{insight.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Top Performers + Churn Risk Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2 uppercase tracking-wide text-xs">
            <span className="bg-amber-100 p-2 rounded-lg text-amber-600"><Trophy className="w-4 h-4" /></span>
            {t.topPerformers}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 ml-10">{t.mostActiveThisMonth}</p>
          <div className="space-y-4">
            {topPerformers.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-default">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg transform transition-transform group-hover:scale-110 ${index === 0 ? 'bg-amber-400 shadow-amber-200' : index === 1 ? 'bg-slate-400 shadow-slate-200' : 'bg-amber-700 shadow-amber-900/20'
                    }`}>
                    {index + 1}
                  </div>
                  <span className="font-bold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">{member.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{member.monthlyClasses} cl.</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Churn Risk Factors Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <h3 className="font-black text-slate-900 mb-1 flex items-center gap-2 uppercase tracking-wide text-xs">
            <span className="bg-rose-100 p-2 rounded-lg text-rose-600"><AlertTriangle className="w-4 h-4" /></span>
            {t.churnRiskFactors}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 ml-10">{t.commonReasonsLeave}</p>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs font-bold mb-3">
                <span className="text-slate-600">{t.lowAttendance} ({'<'} 2x/week)</span>
                <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">45%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full shadow-lg shadow-rose-200 relative" style={{ width: '45%' }}>
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-3">
                <span className="text-slate-600">{t.noAutoRenew}</span>
                <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">30%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full shadow-lg shadow-amber-200" style={{ width: '30%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-3">
                <span className="text-slate-600">{t.newMemberDropout} ({'<'} 90 days)</span>
                <span className="text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">25%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full shadow-lg shadow-orange-200" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityLogView = ({ t }: { t: any }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">{t.activityLog}</h2>
        <p className="text-slate-500">Track your outreach efforts and member responses here.</p>
      </div>
    </div>
  );
};


const MembersView = ({ t, members, searchQuery }: { t: any, members: Member[], searchQuery: string }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'vip'>('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Derived State & KPIs
  const activeMembers = members.filter(m => m.status === 'active');
  const newThisMonth = activeMembers.filter(m => {
    const join = new Date(m.joinDate);
    const now = new Date();
    return join.getMonth() === now.getMonth() && join.getFullYear() === now.getFullYear();
  }).length;
  // Placeholder for churned - would typically need 'inactive' status + date check
  const churnedThisMonth = members.filter(m => m.status === 'inactive').length;

  const avgTenure = Math.round(activeMembers.reduce((acc, m) => {
    const join = new Date(m.joinDate);
    const now = new Date();
    const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
    return acc + Math.max(0, months);
  }, 0) / (activeMembers.length || 1));

  const avgClassesPerWeek = (activeMembers.reduce((acc, m) => acc + m.attendanceFrequency, 0) / (activeMembers.length || 1)).toFixed(1);
  const avgMemberValue = Math.round(activeMembers.reduce((acc, m) => acc + m.monthlyRevenue, 0) / (activeMembers.length || 1));

  const newMembers = activeMembers.filter(m => {
    const join = new Date(m.joinDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - join.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 90;
  });
  const establishedMembers = activeMembers.length - newMembers.length; // Simply remaining
  const vipMembers = activeMembers.filter(m => m.monthlyRevenue > 450);
  const atRiskMembers = activeMembers.filter(m => m.riskLevel !== RiskLevel.OK);

  // Filter members for table
  const filteredMembers = activeMembers.filter(m => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeTab === 'new') {
      const join = new Date(m.joinDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - join.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays < 90;
    }
    if (activeTab === 'vip') return m.monthlyRevenue > 450;
    return true;
  });

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedRows(newSelected);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. TOP KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Active Members */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t.activeMembers}</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{activeMembers.length}</p>
          <p className="text-xs font-bold text-emerald-500 mt-1">↑ 5%</p>
        </div>

        {/* New This Month */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t.newThisMonth}</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{newThisMonth}</p>
          <p className="text-xs font-bold text-emerald-500 mt-1">↑ 20%</p>
        </div>

        {/* Churned This Month */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t.churnedThisMonth}</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{churnedThisMonth}</p>
          <p className="text-xs font-bold text-emerald-500 mt-1">↓ 40%</p>
        </div>

        {/* Avg Tenure */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t.avgTenure}</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{avgTenure} mo</p>
          <p className="text-xs font-bold text-emerald-500 mt-1">↑ 0.5</p>
        </div>

        {/* Avg Classes/Week */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t.avgClassesWeek}</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{avgClassesPerWeek}</p>
          <p className="text-xs font-bold text-emerald-500 mt-1">↑ 0.2</p>
        </div>

        {/* Avg Member Value */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t.avgValue}</p>
          <p className="text-2xl font-black text-slate-900 mt-1">RON {avgMemberValue}</p>
          <p className="text-xs font-bold text-emerald-500 mt-1">↑ 5%</p>
        </div>
      </div>

      {/* 2. TWO-COLUMN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Member List (70%) */}
        <div className="flex-1 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'}`}>
              {t.allMembers}
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all ${activeTab === 'new' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'}`}>
              {t.newMembers} ({'<'} 90 days)
            </button>
            <button
              onClick={() => setActiveTab('vip')}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-all ${activeTab === 'vip' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'}`}>
              {t.vipMembers}
            </button>
          </div>

          {/* Member Table */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded-lg border-slate-300" /></th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.memberIdentity}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.joined}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.momentum}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.risk}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.value}</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((m) => {
                    const join = new Date(m.joinDate);
                    const now = new Date();
                    const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4"><input type="checkbox" checked={selectedRows.has(m.id)} onChange={() => toggleRow(m.id)} className="rounded-lg border-slate-300 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10" /></td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-black text-slate-900">{m.name}</p>
                            <p className="text-xs text-slate-400 font-medium">{m.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">{join.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{months} mo</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-24">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                              <span>{m.attendanceFrequency}/wk</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${m.attendanceFrequency >= 3 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, (m.attendanceFrequency / 5) * 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <RiskBadge level={m.riskLevel} t={t} />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black text-slate-700">RON {m.monthlyRevenue}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><MessageSquare className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7. NEW MEMBER ONBOARDING TRACKER */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-[2.5rem] border border-emerald-100 p-8 shadow-sm">
            <h3 className="font-black text-emerald-900 text-lg uppercase tracking-tight mb-6 flex items-center gap-3">
              <span className="p-2 bg-emerald-100 rounded-xl"><Target className="w-5 h-5 text-emerald-600" /></span>
              {t.newMemberOnboarding}
              <span className="text-xs font-bold px-3 py-1 bg-white/60 text-emerald-700 rounded-full border border-emerald-100">{newMembers.length} {t.thisMonth}</span>
            </h3>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black text-emerald-600/60 uppercase tracking-widest border-b border-emerald-100">
                  <th className="pb-4 pl-2">{t.members}</th>
                  <th className="pb-4">{t.joined}</th>
                  <th className="pb-4">{t.classes}</th>
                  <th className="pb-4">{t.week}</th>
                  <th className="pb-4">{t.status}</th>
                  <th className="pb-4">{t.nextAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/50">
                {newMembers.slice(0, 5).map((m, i) => (
                  <tr key={m.id} className="hover:bg-emerald-100/30 transition-colors">
                    <td className="py-4 pl-2 font-bold text-slate-800">{m.name}</td>
                    <td className="py-4 text-slate-500 font-medium text-xs">Jan 2</td>
                    <td className="py-4 font-bold text-slate-700">{m.totalClasses} cls</td>
                    <td className="py-4 font-bold text-slate-500 text-xs">Wk {i + 1}</td>
                    <td className="py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-wide">{t.onTrack}</span></td>
                    <td className="py-4 text-indigo-600 font-bold text-xs cursor-pointer hover:underline">Send week 2 check-in</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="mt-6 text-xs font-black text-emerald-700 uppercase tracking-widest hover:text-emerald-900 flex items-center">
              {t.viewAllNewMembers} <ArrowUpRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>

        {/* Right Column - Sidebar (30%) */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Member Segments */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">{t.memberSegments}</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <span className="font-bold text-slate-600 flex items-center gap-2">🌱 {t.newMembers}</span>
                <span className="font-black text-slate-900 bg-white px-2 py-1 rounded-lg border shadow-sm">{newMembers.length}</span>
              </li>
              <li className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <span className="font-bold text-slate-600 flex items-center gap-2">✅ {t.established}</span>
                <span className="font-black text-slate-900 bg-white px-2 py-1 rounded-lg border shadow-sm">{establishedMembers}</span>
              </li>
              <li className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <span className="font-bold text-slate-600 flex items-center gap-2">💎 {t.vipMembers}</span>
                <span className="font-black text-slate-900 bg-white px-2 py-1 rounded-lg border shadow-sm">{vipMembers.length}</span>
              </li>
              <li className="flex justify-between items-center p-3 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors">
                <span className="font-bold text-rose-700 flex items-center gap-2">⚠️ {t.atRiskLabel}</span>
                <span className="font-black text-rose-700 bg-white px-2 py-1 rounded-lg border border-rose-100 shadow-sm">{atRiskMembers.length}</span>
              </li>
            </ul>
          </div>

          {/* New Member Checklist */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">{t.newMemberChecklist}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-6">{t.onboardingSteps}</p>
            <ul className="space-y-3">
              {[t.week1Welcome, t.week2Checkin, t.week4Progress, t.week8Review].map((step, i) => (
                <li key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
                  <div className="w-5 h-5 rounded border-2 border-slate-200 flex items-center justify-center group-hover:border-indigo-400">
                    {i === 0 && <div className="w-3 h-3 bg-indigo-600 rounded-sm"></div>}
                  </div>
                  <span className={`text-xs font-bold ${i === 0 ? 'text-slate-900 line-through decoration-2 decoration-slate-300' : 'text-slate-600'}`}>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">{t.quickActions}</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-xs font-black uppercase tracking-wide hover:bg-indigo-100 transition-colors flex items-center">
                <Mail className="w-4 h-4 mr-3" /> {t.welcomeEmailNew}
              </button>
              <button className="w-full text-left px-4 py-3 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-wide hover:bg-slate-100 transition-colors flex items-center">
                <Zap className="w-4 h-4 mr-3" /> {t.checkinLowClasses}
              </button>
              <button className="w-full text-left px-4 py-3 bg-slate-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-wide hover:bg-slate-100 transition-colors flex items-center">
                <Download className="w-4 h-4 mr-3" /> {t.exportMemberList}
              </button>
            </div>
          </div>
        </div>
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
      case 'milestones': return <MilestonesView t={t} milestones={milestones} members={members} />;
      case 'insights': return <InsightsView t={t} members={members} />;
      case 'activity-log': return <ActivityLogView t={t} />;
      case 'members': return <MembersView t={t} members={members} searchQuery={searchQuery} />;
      case 'daily-brief': return <DailyBriefView t={t} dailyClasses={dailyClasses} />;
      case 'diagnostics': return <DiagnosticsView t={t} />;
      case 'at-risk': return <WatchlistSection members={members} searchQuery={searchQuery} t={t} onShowToast={(msg, type) => showToast(msg, type || 'success')} />;
      case 'import': return <CSVImport onImportComplete={() => window.location.reload()} />;
      default: return <MembersView t={t} members={members} searchQuery={searchQuery} />;
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
            { id: 'members', label: t.members, icon: Users, color: 'text-indigo-500' },
            { id: 'milestones', label: t.milestones, icon: Trophy, color: 'text-amber-500' },
            { id: 'insights', label: t.insights, icon: BarChart2, color: 'text-emerald-500' },
            { id: 'activity-log', label: t.activityLog, icon: ClipboardList, color: 'text-blue-500' },
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

        <div className="p-6">
          <div className="mx-auto space-y-10">



            <div className={`grid grid-cols-1 gap-10`}>
              <div className={`w-full space-y-10`}>
                {renderTabContent()}


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
