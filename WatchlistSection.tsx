import React, { useState, useMemo } from 'react';
import {
    Users,
    AlertTriangle,
    TrendingUp,
    MessageSquare,
    Mail,
    Smartphone,
    CheckCircle2,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Calendar,
    Zap,
    ChevronDown
} from 'lucide-react';
import { Member, RiskLevel } from './types';

// Value Tier Helpers
const getValueTier = (revenue: number) => {
    if (revenue > 450) return { label: 'VIP', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '💎' };
    if (revenue >= 300) return { label: 'Core', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '⭐' };
    return { label: 'Standard', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: '🌱' };
};

// Date Helpers
const getDaysInactive = (lastVisitDate: string) => {
    return Math.floor((new Date().getTime() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60 * 24));
};

const getDaysUntilExpiry = (expiryDate: string) => {
    return Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
};

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

    // Filter Members based on Tabs
    const filteredMembers = useMemo(() => {
        const now = new Date();
        return members.filter(m => {
            // Search Filter
            if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.email.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            const daysInactive = getDaysInactive(m.lastVisitDate);

            // At Risk: Active & Critical/High Risk
            if (activeTab === 'at-risk') {
                return m.status === 'active' && (m.riskLevel === RiskLevel.CRITICAL || m.riskLevel === RiskLevel.HIGH);
            }

            // Win-Back: Inactive & Last visit <= 90 days
            if (activeTab === 'win-back') {
                return m.status === 'inactive' && daysInactive <= 90;
            }

            // Cold: Inactive & Last visit > 90 days
            if (activeTab === 'cold') {
                return m.status === 'inactive' && daysInactive > 90;
            }
            return false;
        });
    }, [members, activeTab]);

    // Sort Members
    const sortedMembers = useMemo(() => {
        return [...filteredMembers].sort((a, b) => {
            if (sortBy === 'risk') {
                const riskOrder = { [RiskLevel.CRITICAL]: 4, [RiskLevel.HIGH]: 3, [RiskLevel.MEDIUM]: 2, [RiskLevel.OK]: 1 };
                return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
            }
            if (sortBy === 'revenue') return b.monthlyRevenue - a.monthlyRevenue;
            if (sortBy === 'inactive') return getDaysInactive(b.lastVisitDate) - getDaysInactive(a.lastVisitDate);
            if (sortBy === 'expiry') return new Date(a.membershipExpires).getTime() - new Date(b.membershipExpires).getTime();
            return 0;
        });
    }, [filteredMembers, sortBy]);

    // Summary Stats
    const stats = useMemo(() => {
        const revenueRisk = filteredMembers.reduce((acc, curr) => acc + curr.monthlyRevenue, 0);
        const vipCount = filteredMembers.filter(m => m.monthlyRevenue > 450).length;
        const expiringSoon = filteredMembers.filter(m => getDaysUntilExpiry(m.membershipExpires) <= 7).length;

        return { total: filteredMembers.length, revenueRisk, vipCount, expiringSoon };
    }, [filteredMembers]);

    const handleWhatsApp = (phone: string, name: string) => {
        const message = `Hi ${name}, noticed you've been away! Everything okay?`;
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleEmail = (email: string) => {
        window.location.href = `mailto:${email}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 3-Tab Navigation */}
            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                {[
                    { id: 'at-risk', label: 'At Risk', icon: AlertTriangle },
                    { id: 'win-back', label: 'Win-Back', icon: TrendingUp },
                    { id: 'cold', label: 'Cold', icon: Clock }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wide transition-all ${activeTab === tab.id
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 mr-2 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Revenue Impact Summary Card */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Members at Risk</p>
                        <div className="text-3xl font-black">{stats.total}</div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Revenue Impact</p>
                        <div className="text-3xl font-black text-rose-400">RON {stats.revenueRisk}</div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">VIP at Risk</p>
                        <div className="text-3xl font-black text-amber-400">{stats.vipCount}</div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expiring Soon</p>
                        <div className="text-3xl font-black text-blue-400">{stats.expiringSoon}</div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>


            {/* Main List Container */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                {/* Header with Sort */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                        {activeTab === 'at-risk' ? '🚨 Action Required' : activeTab === 'win-back' ? '🎯 Win-Back Opportunities' : '🧊 Cold Leads'}
                    </h3>

                    <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-slate-400 uppercase">Sort by:</span>
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortType)}
                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="risk">High Risk</option>
                                <option value="revenue">Highest Revenue</option>
                                <option value="inactive">Days Inactive</option>
                                <option value="expiry">Expiring Soon</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    {sortedMembers.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Factors</th>
                                    <th className="px-8 py-5 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sortedMembers.map((member) => {
                                    const tier = getValueTier(member.monthlyRevenue);
                                    const daysInactive = getDaysInactive(member.lastVisitDate);
                                    const daysUntilExpiry = getDaysUntilExpiry(member.membershipExpires);

                                    // Determine churn reasons
                                    const churnReasons = [];
                                    if (member.monthlyClasses < 4) churnReasons.push({ label: '📉 Low Attendance', color: 'text-rose-600 bg-rose-50' });
                                    if (daysUntilExpiry <= 14) churnReasons.push({ label: '⏰ Expiring Soon', color: 'text-amber-600 bg-amber-50' });
                                    if (daysInactive > 7) churnReasons.push({ label: '😴 No Recent Visits', color: 'text-slate-600 bg-slate-100' });


                                    return (
                                        <tr key={member.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            {/* Member Info */}
                                            <td className="px-8 py-6">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden">
                                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} alt={member.name} className="w-full h-full" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900">{member.name}</h4>
                                                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase mt-1 border ${tier.color}`}>
                                                            <span className="mr-1">{tier.icon}</span> {tier.label}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border
                                        ${member.riskLevel === RiskLevel.CRITICAL ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                            member.riskLevel === RiskLevel.HIGH ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                                member.riskLevel === RiskLevel.MEDIUM ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                    'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                        {member.riskLevel}
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                                                        Last Visit: <span className="text-slate-700">{daysInactive} days ago</span>
                                                    </p>
                                                </div>
                                            </td>

                                            {/* Revenue Impact */}
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-black text-slate-900">RON {member.monthlyRevenue}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">Monthly Value</p>
                                            </td>


                                            {/* Risk Factors */}
                                            <td className="px-8 py-6">
                                                <div className="flex flex-wrap gap-2">
                                                    {churnReasons.length > 0 ? churnReasons.map((reason, i) => (
                                                        <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${reason.color}`}>
                                                            {reason.label}
                                                        </span>
                                                    )) : <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">✅ Healthy Engagement</span>}
                                                </div>
                                            </td>


                                            {/* Actions */}
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleWhatsApp(member.phone, member.name)} className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="WhatsApp">
                                                        <Smartphone className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleEmail(member.email)} className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Email">
                                                        <Mail className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => onShowToast('Marked as contacted', 'success')} className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" title="Mark Contacted">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        /* Empty States */
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="p-6 bg-slate-50 rounded-[2.5rem] mb-6 border border-slate-100">
                                {activeTab === 'at-risk' ? <CheckCircle2 className="w-12 h-12 text-emerald-400" /> :
                                    activeTab === 'win-back' ? <Users className="w-12 h-12 text-slate-300" /> :
                                        <Clock className="w-12 h-12 text-blue-300" />}
                            </div>
                            <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight text-center max-w-sm px-4">
                                {activeTab === 'at-risk' ? "✅ Great news! No active members at risk right now." :
                                    activeTab === 'win-back' ? "No recently inactive members to win back." :
                                        "No long-term inactive members."}
                            </h4>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WatchlistSection;
