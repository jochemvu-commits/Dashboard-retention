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

const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
};

const getValueTier = (revenue: number) => {
    if (revenue > 450) return { label: 'VIP', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '💎' };
    if (revenue >= 300) return { label: 'Core', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '⭐' };
    return { label: 'Std', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: '🌱' };
};

// --- Components ---

interface WatchlistSectionProps {
    members: Member[];
    searchQuery?: string;
    t: any;
    onShowToast: (message: string, type?: 'success' | 'error') => void;
}

type TabType = 'at-risk' | 'win-back' | 'cold';
type SortType = 'risk' | 'revenue' | 'inactive' | 'expiry';

const WatchlistSection: React.FC<WatchlistSectionProps> = ({ members, searchQuery = '', t, onShowToast }) => {
    const [activeTab, setActiveTab] = useState<TabType>('at-risk');
    const [sortBy, setSortBy] = useState<SortType>('risk');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

    // Modal State
    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [selectedMemberForMessage, setSelectedMemberForMessage] = useState<Member | null>(null);

    // Filter Logic
    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            // 1. Search Filter
            if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.email.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            // 2. Tab Filter
            const daysInactive = getDaysInactive(m.lastVisitDate);
            if (activeTab === 'at-risk') return m.status === 'active' && (m.riskLevel === RiskLevel.CRITICAL || m.riskLevel === RiskLevel.HIGH || m.riskLevel === RiskLevel.MEDIUM);
            if (activeTab === 'win-back') return m.status === 'inactive' && daysInactive <= 90;
            if (activeTab === 'cold') return m.status === 'inactive' && daysInactive > 90;
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
            { name: 'Healthy', value: healthCounts[RiskLevel.OK], color: '#10b981' }, // emerald-500
            { name: 'At Risk', value: healthCounts[RiskLevel.HIGH] + healthCounts[RiskLevel.MEDIUM], color: '#f59e0b' }, // amber-500
            { name: 'Critical', value: healthCounts[RiskLevel.CRITICAL], color: '#f43f5e' }, // rose-500
        ];

        return {
            totalActive,
            retentionRate,
            revenueRisk,
            avgAttendance,
            expiringSoon,
            atRiskCount,
            healthData
        };
    }, [filteredMembers, members]);


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

    const openMessageModal = (member: Member, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedMemberForMessage(member);
        setMessageModalOpen(true);
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
                                { label: 'Total Members', value: stats.totalActive, trend: '↑ 2' },
                                { label: 'Retention Rate', value: `${stats.retentionRate.toFixed(1)}%`, trend: 'stable' },
                                { label: 'Revenue at Risk', value: `RON ${stats.revenueRisk.toLocaleString()}`, trend: `${filteredMembers.length} members` },
                                { label: 'Members Saved', value: '0', trend: 'this month' },
                                { label: 'Avg Attendance', value: `${stats.avgAttendance.toFixed(1)}/wk`, trend: '↓ 0.2' },
                                { label: 'Expiring Soon', value: stats.expiringSoon, trend: '< 7 days' },
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
                                { id: 'at-risk', label: 'At Risk' },
                                { id: 'win-back', label: 'Win-Back' },
                                { id: 'cold', label: 'Cold' }
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
                                    <option value="risk">Risk Priority</option>
                                    <option value="revenue">Highest Value</option>
                                    <option value="inactive">Most Inactive</option>
                                    <option value="expiry">Expiring Soon</option>
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
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">ID</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest w-48">Name</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Risk</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Value</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Last Visit</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Inactive</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Attendance</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Expiry</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest text-center">Auto</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">Coach</th>
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sortedMembers.map((member) => {
                                        const tier = getValueTier(member.monthlyRevenue);
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
                                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border
                                              ${member.riskLevel === RiskLevel.CRITICAL ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                member.riskLevel === RiskLevel.HIGH ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                    'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                            {member.riskLevel}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-slate-700 text-xs">RON {member.monthlyRevenue}</td>
                                                    <td className="px-5 py-4 font-bold text-slate-600 text-xs">{formatDate(member.lastVisitDate)}</td>
                                                    <td className="px-5 py-4"><span className={`font-bold text-xs ${daysInactive > 7 ? 'text-rose-500' : 'text-slate-500'}`}>{daysInactive} days</span></td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 text-xs">{member.monthlyClasses} cls</span>
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
                                                    <td className="px-5 py-4 font-bold text-slate-500 text-xs">{member.coach || '-'}</td>

                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <button onClick={(e) => openMessageModal(member, e)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Smartphone className="w-4 h-4" /></button>
                                                            <button onClick={(e) => openMessageModal(member, e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Mail className="w-4 h-4" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); onShowToast('Marked as contacted', 'success'); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                                                            <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                                                        </div>
                                                    </td>
                                                </tr>
                                                {expanded && (
                                                    <tr className="bg-slate-50 border-b border-indigo-100/50">
                                                        <td colSpan={12} className="px-6 py-4 cursor-auto">
                                                            <div className="flex items-start gap-8">
                                                                <div className="space-y-2 flex-shrink-0">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Risk Factors</p>
                                                                    <div className="flex flex-wrap gap-2 max-w-xs">
                                                                        {member.monthlyClasses < 4 && <span className="px-2 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">📉 Low Attendance</span>}
                                                                        {daysInactive > 7 && <span className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded">😴 Absent {daysInactive}d</span>}
                                                                        {daysUntilExpiry <= 14 && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">⏰ Expiring {daysUntilExpiry}d</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2 flex-1">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quick Notes</p>
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
                </div>

                {/* ================= RIGHT COLUMN (25%) ================= */}
                <div className="w-full lg:w-80 space-y-6 flex-shrink-0">

                    {/* 1. Health Distribution */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">DISTRIBUTION</h3>
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
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Active</p>
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
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">QUICK ACTIONS</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => onShowToast('Exporting...', 'success')} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left">
                                <p className="text-xs font-bold text-slate-900">📤 Export CSV</p>
                            </button>
                            <button onClick={() => onShowToast('Bulk message dialog', 'success')} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left">
                                <p className="text-xs font-bold text-slate-900">📱 WhatsApp</p>
                            </button>
                            <button onClick={() => onShowToast('Bulk email dialog', 'success')} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left">
                                <p className="text-xs font-bold text-slate-900">📧 Email</p>
                            </button>
                            <button onClick={() => onShowToast('Generating Report...', 'success')} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all text-left">
                                <p className="text-xs font-bold text-slate-900">📋 Report</p>
                            </button>
                        </div>
                    </div>

                    {/* 3. This Week's Focus */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center text-sm">
                            <span className="text-amber-500 mr-2">⚡</span> THIS WEEK'S FOCUS
                        </h3>
                        <ul className="space-y-2 text-xs font-bold text-slate-700">
                            <li>• {stats.expiringSoon} memberships expiring soon</li>
                            <li>• {stats.atRiskCount} members need retention check</li>
                            <li>• RON {stats.revenueRisk.toLocaleString()} monthly revenue at risk</li>
                        </ul>
                        <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100">
                            <p className="text-[10px] text-rose-600 font-bold uppercase mb-1">TOP PRIORITY</p>
                            <p className="text-xs font-bold text-slate-900">Contact {sortedMembers[0]?.name || 'Member'} (VIP, Expiring)</p>
                        </div>
                    </div>

                    {/* 4. Recent Activity */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">📋 RECENT ACTIVITY</h3>
                        <ul className="space-y-3 text-xs font-medium text-slate-600">
                            <li>• Contacted Maria P. - 2 hours ago</li>
                            <li>• Marked Alex I. as done - Yesterday</li>
                        </ul>
                    </div>

                </div>
            </div>

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
