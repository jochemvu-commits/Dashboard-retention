import React, { useState, useMemo } from 'react';
import {
    Users,
    AlertTriangle,
    Mail,
    Smartphone,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Download,
    FileText,
    AlertCircle,
    RefreshCw,
    Search,
    ClipboardList
} from 'lucide-react';
import { Member, RiskLevel } from './types';
import MessageModal from './MessageModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// --- Helpers ---

const getDaysInactive = (lastVisitDate: string) => {
    return Math.floor((new Date().getTime() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24));
};

const getOnboardingWeek = (joinDate: string) => {
    if (!joinDate) return 1;
    const diff = new Date().getTime() - new Date(joinDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24 * 7)) || 1;
};

const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
};

const getValueTier = (revenue: number, t: any) => {
    if (revenue > 450) return { label: t.vip, color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '💎' };
    if (revenue >= 300) return { label: t.core, color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '⭐' };
    return { label: t.std, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: '🌱' };
};

// --- Components ---

interface WatchlistSectionProps {
    members: Member[];
    searchQuery?: string;
    t: any;
    onShowToast: (message: string, type?: 'success' | 'error') => void;
}

type TabType = 'at-risk' | 'win-back' | 'cold' | 'new-members';
type SortType = 'risk' | 'revenue' | 'inactive' | 'expiry' | 'joined';
type TemplateType = 'at-risk' | 'expiring' | 'win-back' | 'welcome' | 'check-in';

const WatchlistSection: React.FC<WatchlistSectionProps> = ({ members, searchQuery = '', t, onShowToast }) => {
    const [activeTab, setActiveTab] = useState<TabType>('at-risk');
    const [sortBy, setSortBy] = useState<SortType>('risk');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    // Template State
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('at-risk');

    // Location Filter State
    const [locationFilter, setLocationFilter] = useState('all');

    // Modal State
    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [selectedMemberForMessage, setSelectedMemberForMessage] = useState<Member | null>(null);

    // Dynamic Templates based on Translation
    const templates = {
        'at-risk': t.atRiskMessage,
        'expiring': t.expiringMessage,
        'win-back': t.winBackMessage,
        'welcome': t.welcomeEmailNew,
        'check-in': t.checkinLowClasses
    };


    // Filter Logic
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            // 1. Search Filter
            if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.email.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            // 2. Tab Filter & Location Filter
            const daysInactive = getDaysInactive(m.lastVisitDate);

            // Location Filter
            if (locationFilter !== 'all' && m.location !== locationFilter) return false;

            if (activeTab === 'at-risk') return m.status === 'active' && (m.riskLevel === RiskLevel.CRITICAL || m.riskLevel === RiskLevel.HIGH || m.riskLevel === RiskLevel.MEDIUM);
            if (activeTab === 'win-back') return m.status === 'inactive' && daysInactive <= 90;
            if (activeTab === 'cold') return m.status === 'inactive' && daysInactive > 90;
            if (activeTab === 'new-members') {
                const joinedDays = (new Date().getTime() - new Date(m.joinDate).getTime()) / (1000 * 60 * 60 * 24);
                return joinedDays <= 90 && m.status === 'active';
            }
            return false;
        });
    }, [members, activeTab, searchQuery]);

    // Sort Logic
    const sortedMembers = useMemo(() => {
        return [...filteredMembers].sort((a, b) => {
            switch (sortBy) {
                case 'risk':
                    const riskOrder = { [RiskLevel.CRITICAL]: 4, [RiskLevel.HIGH]: 3, [RiskLevel.MEDIUM]: 2, [RiskLevel.OK]: 1 };
                    return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
                case 'revenue': return b.monthlyRevenue - a.monthlyRevenue;
                case 'inactive': return getDaysInactive(b.lastVisitDate) - getDaysInactive(a.lastVisitDate);
                case 'expiry': return new Date(a.membershipExpires).getTime() - new Date(b.membershipExpires).getTime();
                case 'joined': return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
                default: return 0;
            }
        });
    }, [filteredMembers, sortBy]);

    // KPI Stats Logic
    const stats = useMemo(() => {
        const activeMembers = members.filter(m => m.status === 'active');
        const totalActive = activeMembers.length;

        const atRiskCount = members.filter(m => m.status === 'active' && m.riskLevel !== RiskLevel.OK).length;
        const retentionRate = totalActive > 0 ? ((totalActive - atRiskCount) / totalActive) * 100 : 0;

        const revenueRisk = filteredMembers.reduce((acc, curr) => acc + curr.monthlyRevenue, 0);

        // Avg Attendance of ACTIVE members
        const avgAttendance = activeMembers.reduce((acc, curr) => acc + curr.attendanceFrequency, 0) / (totalActive || 1);

        const expiringSoon = members.filter(m => m.status === 'active' && getDaysUntilExpiry(m.membershipExpires) <= 7).length;

        // Health Chart Data
        const healthCounts = { [RiskLevel.OK]: 0, [RiskLevel.MEDIUM]: 0, [RiskLevel.HIGH]: 0, [RiskLevel.CRITICAL]: 0 };
        activeMembers.forEach(m => healthCounts[m.riskLevel]++);
        const healthData = [
            { name: t.riskHealthy, value: healthCounts[RiskLevel.OK], color: '#10b981' },
            { name: t.atRiskLabel, value: healthCounts[RiskLevel.HIGH] + healthCounts[RiskLevel.MEDIUM], color: '#f59e0b' },
            { name: t.criticalLabel, value: healthCounts[RiskLevel.CRITICAL], color: '#f43f5e' },
        ];

        // Find recovery alerts
        const recoveryAlertMembers = members.filter(m => m.attendanceThisWeek && m.attendanceThisWeek >= 5);

        return {
            totalActive,
            retentionRate,
            revenueRisk,
            avgAttendance,
            expiringSoon,
            atRiskCount,
            healthData,
            recoveryAlertMembers
        };
    }, [filteredMembers, members, t]);


    const toggleRow = (id: string, e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedRows(newExpanded);
    };

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedRows(newSelected);
    };

    // --- NEW Action Logic ---
    const handleQuickAction = (member: Member, action: 'whatsapp' | 'email', e: React.MouseEvent) => {
        e.stopPropagation();

        // 1. Get template
        let message = templates[selectedTemplate];

        // 2. Replace variables
        const firstName = member.name.split(' ')[0];
        message = message.replace('[Name]', firstName);

        // 3. Open App
        if (action === 'whatsapp') {
            window.open(`https://wa.me/${member.phone}?text=${encodeURIComponent(message)}`, '_blank');
            onShowToast('WhatsApp opened with template', 'success');
        } else {
            window.open(`mailto:${member.email}?subject=Message&body=${encodeURIComponent(message)}`, '_blank');
            onShowToast('Email client opened with template', 'success');
        }
    };

    const openCustomModal = () => {
        onShowToast(t.customizeTemplates + ' feature coming soon', 'success');
    };

    // Risk Label Helper
    const getRiskLabel = (level: RiskLevel) => {
        switch (level) {
            case RiskLevel.CRITICAL: return t.riskCritical;
            case RiskLevel.HIGH: return t.riskHigh;
            case RiskLevel.MEDIUM: return t.riskMedium;
            case RiskLevel.OK: return t.riskHealthy;
            default: return level;
        }
    };

    return (
        <>
            <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full min-h-screen">

                {/* ================= LEFT COLUMN (75%) ================= */}
                <div className="flex-1 space-y-6 min-w-0">

                    {/* 1. DARK SUMMARY BAR (6 KPIs) */}
                    <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-xl">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                            {[
                                { label: t.totalMembers, value: stats.totalActive, trend: '↑ 2' },
                                { label: t.retentionRate, value: `${stats.retentionRate.toFixed(1)}%`, trend: t.stable },
                                { label: t.revenueAtRisk, value: `RON ${stats.revenueRisk.toLocaleString()}`, trend: `${filteredMembers.length} ${t.members}` },
                                { label: t.membersSaved, value: '0', trend: t.thisMonth },
                                { label: t.avgAttendance, value: `${stats.avgAttendance.toFixed(1)}/wk`, trend: '↓ 0.2' },
                                { label: t.expiringSoon, value: stats.expiringSoon, trend: `< 7 ${t.days}` },
                            ].map((stat, i) => (
                                <div key={i} className="flex flex-col">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">{stat.label}</p>
                                    <p className="text-2xl font-black text-white leading-none mb-2">{stat.value}</p>
                                    <span className="text-[10px] font-bold text-indigo-200 bg-white/10 px-2 py-0.5 rounded w-fit">{stat.trend}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. CONTROLS (TABS & SORT) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex p-1 bg-white rounded-xl border border-slate-200 w-fit shadow-sm">
                            {[
                                { id: 'at-risk', label: t.atRisk },
                                { id: 'new-members', label: t.newMembers },
                                { id: 'win-back', label: t.winBack },
                                { id: 'cold', label: t.cold }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Location Filter */}
                            <div className="relative">
                                <select
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                    className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
                                >
                                    <option value="all">{t.allLocations || "ALL LOCATIONS"}</option>
                                    <option value="UNU MAI">UNU MAI</option>
                                    <option value="BERARIEI">BERARIEI</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {selectedRows.size > 0 && (
                                <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-2 rounded-xl">
                                    <span className="text-xs font-black text-indigo-700">{selectedRows.size} selected</span>
                                    <button className="p-1 hover:bg-indigo-100 rounded-lg text-indigo-600"><Mail className="w-4 h-4" /></button>
                                    <button className="p-1 hover:bg-indigo-100 rounded-lg text-indigo-600"><Download className="w-4 h-4" /></button>
                                </div>
                            )}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortType)}
                                    className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
                                >
                                    <option value="risk">{t.riskPriority || "RISK PRIORITY"}</option>
                                    <option value="revenue">{t.value || "VALUE"}</option>
                                    <option value="inactive">{t.inactive || "INACTIVE"}</option>
                                    <option value="expiry">{t.expiry || "EXPIRY"}</option>
                                    <option value="joined">{t.joined || "JOINED"}</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* 3. MEMBER TABLE */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-5 py-4 w-10"><input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-0" /></th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.clientId}</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest w-48">{t.name}</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.location || "LOCATION"}</th>
                                        {activeTab === 'new-members' ? (
                                            <>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.joinedDate}</th>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.week}</th>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.classes}</th>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.momentum}</th>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.onboardingStatus}</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.risk}</th>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.value}</th>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.lastVisit}</th>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.inactive}</th>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.attendance}</th>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.expiry}</th>
                                                <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest text-center">{t.auto}</th>
                                            </>
                                        )}
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.coach}</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedMembers.map((member) => {
                                        const tier = getValueTier(member.monthlyRevenue, t);
                                        const daysInactive = getDaysInactive(member.lastVisitDate);
                                        const daysUntilExpiry = getDaysUntilExpiry(member.membershipExpires);
                                        const lastMonth = member.lastMonthClasses || member.monthlyClasses + 3;
                                        const trend = lastMonth > 0 ? ((lastMonth - member.monthlyClasses) / lastMonth) * 100 : 0;
                                        const expanded = expandedRows.has(member.id);
                                        const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                                        return (
                                            <React.Fragment key={member.id}>
                                                <tr
                                                    className={`group hover:bg-slate-50 transition-colors cursor-pointer ${expanded ? 'bg-slate-50' : ''}`}
                                                    onClick={(e) => toggleRow(member.id, e)}
                                                >
                                                    <td className="px-5 py-4"><input type="checkbox" checked={selectedRows.has(member.id)} onChange={(e) => toggleSelection(member.id, e)} onClick={(e) => e.stopPropagation()} className="rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer" /></td>
                                                    <td className="px-5 py-4 font-bold text-slate-400 text-xs">#{member.id.substring(0, 6)}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{member.name}</span>
                                                            <div className="flex items-center space-x-1 mt-0.5">
                                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${tier.color}`}>{tier.icon} {tier.label}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        {member.location && (
                                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${member.location === 'UNU MAI' ? 'bg-blue-100 text-blue-700' :
                                                                member.location === 'BERARIEI' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                {member.location}
                                                            </span>
                                                        )}
                                                    </td>
                                                    {activeTab === 'new-members' ? (
                                                        <>
                                                            <td className="px-5 py-4 font-bold text-slate-700 text-xs">{formatDate(member.joinDate)}</td>
                                                            <td className="px-5 py-4"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-black text-xs">Week {getOnboardingWeek(member.joinDate)}</span></td>
                                                            <td className="px-5 py-4 font-bold text-slate-700 text-xs">{member.totalClasses}</td>
                                                            <td className="px-5 py-4">
                                                                <span className={`text-xs font-bold ${member.monthlyClasses >= 12 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                    {member.monthlyClasses >= 12 ? '🔥 High' : '⚠️ Low'}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="text-[10px] font-bold uppercase text-slate-400 border border-slate-200 px-2 py-1 rounded-md">{t.onTrack || 'On Track'}</span>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-5 py-4">
                                                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border
                                                      ${member.riskLevel === RiskLevel.CRITICAL ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                        member.riskLevel === RiskLevel.HIGH ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                            'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                                    {getRiskLabel(member.riskLevel)}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4 font-bold text-slate-700 text-xs">RON {member.monthlyRevenue}</td>
                                                            <td className="px-5 py-4 font-bold text-slate-600 text-xs">{formatDate(member.lastVisitDate)}</td>
                                                            <td className="px-5 py-4"><span className={`font-bold text-xs ${daysInactive > 7 ? 'text-rose-500' : 'text-slate-500'}`}>{daysInactive} {t.days}</span></td>
                                                            <td className="px-5 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-900 text-xs">{member.monthlyClasses} {t.classesAbbr}</span>
                                                                    <span className={`text-[9px] font-bold ${trend > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                                        {trend > 0 ? '↓' : '↑'}{Math.abs(Math.round(trend))}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-slate-700 text-xs">{formatDate(member.membershipExpires)}</span>
                                                                    {daysUntilExpiry <= 14 && <span className="text-[9px] font-bold text-amber-600">({daysUntilExpiry}d)</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                {member.autoRenew ? <RefreshCw className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400 mx-auto" />}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-5 py-4 font-bold text-slate-500 text-xs">{member.coach || '-'}</td>

                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <button onClick={(e) => handleQuickAction(member, 'whatsapp', e)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Smartphone className="w-4 h-4" /></button>
                                                            <button onClick={(e) => handleQuickAction(member, 'email', e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Mail className="w-4 h-4" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); onShowToast(t.markedAsDone, 'success'); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                                                            <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expanded && (
                                                    <tr className="bg-slate-50 border-b border-indigo-100/50">
                                                        <td colSpan={12} className="px-6 py-4 cursor-auto">
                                                            <div className="flex items-start gap-8">
                                                                <div className="space-y-2 flex-shrink-0">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.healthProfile}</p>
                                                                    <div className="flex flex-wrap gap-2 max-w-xs">
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2 flex-1">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.quickActions}</p>
                                                                    <div className="flex gap-2">
                                                                        <input type="text" placeholder="Add a note..." className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500" />
                                                                        <button className="text-xs font-bold text-indigo-600 px-3 py-1 bg-white border border-indigo-100 rounded-lg hover:bg-indigo-50">Save</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 4. NEW OUTREACH TEMPLATES PANEL (Below Table) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 text-lg flex items-center">
                                <span className="mr-2">📝</span> {t.outreachTemplates}
                            </h3>
                            <button onClick={openCustomModal} className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
                                ✏️ {t.customizeTemplates}
                            </button>
                        </div>

                        {/* Template Selection Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setSelectedTemplate('at-risk')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedTemplate === 'at-risk' ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-500/20' : 'bg-slate-50 text-slate-500 hover:bg-rose-50'}`}
                            >
                                🚨 {t.atRiskTemplate}
                            </button>
                            <button
                                onClick={() => setSelectedTemplate('expiring')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedTemplate === 'expiring' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500/20' : 'bg-slate-50 text-slate-500 hover:bg-amber-50'}`}
                            >
                                ⏰ {t.expiringTemplate}
                            </button>
                            <button
                                onClick={() => setSelectedTemplate('win-back')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedTemplate === 'win-back' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500/20' : 'bg-slate-50 text-slate-500 hover:bg-blue-50'}`}
                            >
                                👋 {t.winBackTemplate}
                            </button>
                            {activeTab === 'new-members' && (
                                <button
                                    onClick={() => setSelectedTemplate('welcome')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedTemplate === 'welcome' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-slate-50 text-slate-500 hover:bg-indigo-50'}`}
                                >
                                    👋 {t.welcome}
                                </button>
                            )}
                        </div>

                        {/* Template Preview */}
                        <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                            <p className="text-sm text-slate-700 whitespace-pre-line font-medium leading-relaxed">
                                {templates[selectedTemplate]}
                            </p>
                        </div>

                        {/* Instructions */}
                        <p className="text-xs text-slate-500 flex items-center">
                            <span className="mr-1.5 bg-slate-100 p-1 rounded-md">💡</span>
                            {t.templateInstructions}
                        </p>
                    </div>

                </div>

                {/* ================= RIGHT COLUMN (25%) ================= */}
                <div className="w-full lg:w-80 space-y-6 flex-shrink-0">

                    {/* 1. Health Distribution */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">{t.distribution}</h3>
                        <div className="h-40 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.healthData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                                        {stats.healthData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                <span className="text-2xl font-black text-slate-900">{stats.totalActive}</span>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{t.active}</p>
                            </div>
                        </div>
                        <div className="flex justify-center space-x-3 mt-2">
                            {stats.healthData.map(d => (
                                <div key={d.name} className="flex items-center space-x-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{d.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. Quick Actions */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">{t.quickActions}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => onShowToast('Exporting...', 'success')} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left">
                                <p className="text-xs font-bold text-slate-900">📤 {t.exportCsv}</p>
                            </button>
                            <button onClick={() => onShowToast('Bulk message dialog', 'success')} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left">
                                <p className="text-xs font-bold text-slate-900">📱 {t.bulkWhatsapp}</p>
                            </button>
                            <button onClick={() => onShowToast('Bulk email dialog', 'success')} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left">
                                <p className="text-xs font-bold text-slate-900">📧 {t.bulkEmail}</p>
                            </button>
                            <button onClick={() => onShowToast('Generating Report...', 'success')} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left">
                                <p className="text-xs font-bold text-slate-900">📋 {t.weeklyReport}</p>
                            </button>
                        </div>
                    </div>

                    {/* 3. This Week's Focus */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center text-sm">
                            <span className="text-amber-500 mr-2">⚡</span> {t.thisWeeksFocus}
                        </h3>
                        <ul className="space-y-2 text-xs font-bold text-slate-700">
                            <li>• {stats.expiringSoon} {t.membershipsExpiringSoon}</li>
                            <li>• {stats.atRiskCount} {t.vipsNeedRetentionCheck}</li>
                            <li>• RON {stats.revenueRisk.toLocaleString()} {t.monthlyRevenueAtRisk}</li>
                        </ul>
                        <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100">
                            <p className="text-[10px] text-rose-600 font-bold uppercase mb-1">{t.topPriority}</p>
                            <p className="text-xs font-bold text-slate-900">{t.contactMember} {sortedMembers[0]?.name || 'Member'} {t.vipExpiring}</p>


                        </div>
                    </div>

                    {/* 4. RECOVERY ALERTS (NEW) */}
                    {stats.recoveryAlertMembers.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse ring-2 ring-emerald-500/20">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center text-sm">
                                <span className="text-emerald-500 mr-2">🔋</span> {t.recoveryAlerts}
                            </h3>
                            <p className="text-xs text-slate-600 mb-3">{stats.recoveryAlertMembers.length} {t.highTrainingVolume}</p>
                            <div className="space-y-2">
                                {stats.recoveryAlertMembers.slice(0, 3).map(m => (
                                    <div key={m.id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">{m.name}</p>
                                            <p className="text-[10px] text-emerald-600">{m.attendanceThisWeek} {t.classes} {t.thisWeek}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                window.open(`https://wa.me/${m.phone}?text=${encodeURIComponent(t.recoveryTemplate.replace('[Name]', m.name.split(' ')[0]))}`, '_blank');
                                                onShowToast('Recovery message sent!', 'success');
                                            }}
                                            className="p-1.5 bg-white rounded-lg text-emerald-600 hover:text-emerald-700 shadow-sm"
                                        >
                                            <Smartphone className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 5. Recent Activity */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">{t.recentActivity}</h3>
                        <ul className="space-y-3 text-xs font-medium text-slate-600">
                            <li>• {t.contacted} Maria P. - 2 {t.hoursAgo}</li>
                            <li>• {t.markedAsDone} Alex I. - {t.yesterday}</li>
                        </ul>
                    </div>

                    {/* 6. Location Breakdown */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">{t.byLocation || "BY LOCATION"}</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                                <span className="text-xs font-bold text-slate-700">UNU MAI</span>
                                <span className="text-xs font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md">{members.filter(m => m.location === 'UNU MAI').length}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                                <span className="text-xs font-bold text-slate-700">BERARIEI</span>
                                <span className="text-xs font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">{members.filter(m => m.location === 'BERARIEI').length}</span>
                            </div>
                        </div>
                    </div>


                </div>
            </div>

            {/* Keep message modal for now in case customization is needed, but mostly bypassed */}
            <MessageModal
                member={selectedMemberForMessage}
                isOpen={messageModalOpen}
                onClose={() => setMessageModalOpen(false)}
                onShowToast={onShowToast}
            />
        </>
    );
};

export default WatchlistSection;
