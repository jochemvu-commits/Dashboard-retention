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
    ClipboardList,
    XCircle,
    CheckCircle
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

const isNewMember = (member: Member) => {
    // Must be an active member
    if (member.status !== 'Active') return false;

    // Must have a join date
    if (!member.joinDate) return false;

    // Calculate days since joining
    const daysSinceJoin = getDaysSinceJoin(member.joinDate);

    // NEW MEMBER if joined within last 90 days
    return daysSinceJoin >= 0 && daysSinceJoin <= 90;
};

const isWinBackMember = (member: Member): boolean => {
    // Must be an inactive member
    if (member.status !== 'Inactive') return false;

    // Must have a last visit date
    if (!member.lastVisitDate) return false;

    // Calculate days since last visit
    const daysSinceVisit = getDaysSinceLastVisit(member.lastVisitDate);

    // WIN-BACK if last visit was 30-90 days ago
    return daysSinceVisit >= 30 && daysSinceVisit <= 90;
};

const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';

    // Parse with a safe time (noon) to avoid timezone shifts when the date is just "YYYY-MM-DD"
    // If we do new Date("2026-02-02"), javascript assumes UTC midnight.
    // In local time (if behind UTC), this becomes previous day.
    // Appending time ensures we stay on the correct day.

    // Check if it's already a full ISO string with time or just date
    const inputs = dateString.split('T');
    const justDate = inputs[0];

    const date = new Date(justDate + 'T12:00:00');

    if (isNaN(date.getTime())) {
        // Fallback for other formats
        const d2 = new Date(dateString);
        return isNaN(d2.getTime()) ? 'N/A' : d2.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' })
    };

    return date.toLocaleDateString('en-US', options);
};

const getDaysSinceJoin = (joinDate: string | null): number => {
    if (!joinDate) return 0;
    const join = new Date(joinDate + 'T12:00:00');
    if (isNaN(join.getTime())) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - join.getTime()) / (1000 * 60 * 60 * 24));
};

const getDaysSinceLastVisit = (lastVisit: string | null): number => {
    if (!lastVisit) return 999;
    const visit = new Date(lastVisit + 'T12:00:00');
    if (isNaN(visit.getTime())) return 999;
    const now = new Date();
    return Math.floor((now.getTime() - visit.getTime()) / (1000 * 60 * 60 * 24));
};

const isAtRiskMember = (member: Member): boolean => {
    // Must be an active member
    if (member.status !== 'Active') return false;

    // Must NOT have auto-renew
    if (member.autoRenew === true) return false;

    // Must have an expiration date
    if (!member.membershipExpires) return false;

    // Calculate days until expiry
    const daysUntilExpiry = getDaysUntilExpiry(member.membershipExpires);

    // AT RISK if expiring within 21 days OR expired within last 7 days
    return daysUntilExpiry <= 21 && daysUntilExpiry >= -7;
};

const getAtRiskReason = (member: Member): string => {
    if (!member.membershipExpires) return 'No membership data';

    const daysUntilExpiry = getDaysUntilExpiry(member.membershipExpires);

    if (daysUntilExpiry < 0) {
        return `Expired ${Math.abs(daysUntilExpiry)}d ago, no auto-renew`;
    } else if (daysUntilExpiry === 0) {
        return 'Expires today, no auto-renew';
    } else {
        return `Expires in ${daysUntilExpiry}d, no auto-renew`;
    }
};

const getNewMemberReason = (member: Member): string => {
    const days = getDaysSinceJoin(member.joinDate);
    const totalClasses = member.totalClasses || 0;

    if (days <= 7) {
        return `Day ${days} - Welcome check-in`;
    } else if (days <= 14) {
        return `Week 2 - ${totalClasses} classes so far`;
    } else if (days <= 30) {
        const week = Math.ceil(days / 7);
        return `Week ${week} - Building routine (${totalClasses} cls)`;
    } else if (days <= 60) {
        return `Day ${days} - Month 2 check-in (${totalClasses} cls)`;
    } else {
        return `Day ${days} - Almost established! (${totalClasses} cls)`;
    }
};

const getWinBackReason = (member: Member): string => {
    const days = getDaysSinceLastVisit(member.lastVisitDate);
    const totalClasses = member.totalClasses || 0;

    if (days <= 45) {
        return `Inactive ${days}d - Still warm! (${totalClasses} past classes)`;
    } else if (days <= 60) {
        return `Inactive ${days}d - Reach out soon (${totalClasses} past classes)`;
    } else if (days <= 75) {
        return `Inactive ${days}d - Getting cold (${totalClasses} past classes)`;
    } else {
        return `Inactive ${days}d - Last chance (${totalClasses} past classes)`;
    }
};

const getClassesInLastDays = (member: Member, days: number): number => {
    // Option 1: If you have attendanceThisWeek field (from Member interface)
    if (member.attendanceThisWeek !== undefined) {
        return member.attendanceThisWeek;
    }

    // Option 2: If you have monthlyClasses, estimate weekly
    if (member.monthlyClasses) {
        // Rough estimate: monthly / 4 = weekly
        return Math.round(member.monthlyClasses / 4);
    }

    // Option 3: Use attendanceFrequency (classes per week)
    if (member.attendanceFrequency) {
        return Math.round(member.attendanceFrequency);
    }

    return 0;
};

const isRecoveryMember = (member: Member): boolean => {
    // Must be an active member
    if (member.status !== 'Active') return false;

    // Must have attended 5+ classes in the last 7 days
    const classesThisWeek = getClassesInLastDays(member, 7);

    return classesThisWeek >= 5;
};


const getRecoveryReason = (member: Member): string => {
    const classesThisWeek = getClassesInLastDays(member, 7);

    if (classesThisWeek >= 7) {
        return `${classesThisWeek} classes this week! 🔥 Needs rest urgently`;
    } else if (classesThisWeek >= 6) {
        return `${classesThisWeek} classes this week - Recommend rest day`;
    } else {
        return `${classesThisWeek} classes this week - Send recovery tips`;
    }
};

const getMemberReason = (member: Member, activeTab: string): string => {
    switch (activeTab) {
        case 'at-risk':
            return getAtRiskReason(member);
        case 'new-members': // Note: Tab ID is 'new-members' in state
            return getNewMemberReason(member);
        case 'win-back':
            return getWinBackReason(member);
        case 'recovery':
            return getRecoveryReason(member);
        default:
            return '';
    }
};

// --- Components ---

interface WatchlistSectionProps {
    members: Member[];
    searchQuery?: string;
    t: any;
    onShowToast: (message: string, type?: 'success' | 'error') => void;
}

type TabType = 'at-risk' | 'win-back' | 'recovery' | 'new-members';
type SortType = 'risk' | 'revenue' | 'inactive' | 'expiry' | 'joined';
type TemplateType = 'at-risk' | 'expiring' | 'win-back' | 'welcome' | 'recovery';

const WatchlistSection: React.FC<WatchlistSectionProps> = ({ members, searchQuery = '', t, onShowToast }) => {
    // === WATCHLIST DEBUG ===
    console.log('=== WATCHLIST DEBUG ===');
    console.log('Total members from database:', members.length);
    console.log('Sample member:', members[0]);
    console.log('Unique statuses:', [...new Set(members.map(m => m.status))]);
    console.log('Unique locations:', [...new Set(members.map(m => m.location))]);
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
        'recovery': `Hey [Name]! 💪

You've been absolutely crushing it this week! That dedication is inspiring.

Just a friendly reminder: rest days are when your body actually gets stronger. Recovery is part of the process, not a break from it.

Consider taking tomorrow off, or try our mobility/stretching routine. Your future PRs will thank you!

Keep being awesome,
- Smart Move CrossFit Team`
    };


    // 0. GHOST MEMBER FILTERING
    // Remove members with no revenue (0) or ancient expiry dates (pre-2023)
    const validMembers = useMemo(() => {
        return members.filter(m => {
            // Must have some revenue value ONLY IF ACTIVE
            // Inactive members (Win-Back/Cold) often have 0 revenue, so we must keep them.
            if (m.status === 'Active' && (!m.monthlyRevenue || m.monthlyRevenue === 0)) return false;

            // If has expiry date, it shouldn't be ancient (before 2023)
            if (m.membershipExpires) {
                const expiryDate = new Date(m.membershipExpires);
                const cutoffDate = new Date('2023-01-01');
                if (expiryDate < cutoffDate) return false;
            }
            return true;
        });
    }, [members]);

    // Filter Logic
    const filteredMembers = useMemo(() => {
        const filtered = validMembers.filter(m => {
            // 1. Search Filter
            if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.email.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // 2. Tab Logic (Mutually Exclusive)
            const daysInactive = getDaysInactive(m.lastVisitDate);
            const isNew = isNewMember(m); // Now takes entire member object
            let matchesTab = false;

            if (activeTab === 'new-members') {
                // Must be new member AND not at risk (no duplicates)
                matchesTab = isNewMember(m) && !isAtRiskMember(m);
            } else if (activeTab === 'at-risk') {
                matchesTab = isAtRiskMember(m);
            } else if (activeTab === 'win-back') {
                matchesTab = isWinBackMember(m);
            } else if (activeTab === 'recovery') {
                matchesTab = isRecoveryMember(m);
            }

            // DEBUG SPECIFIC MEMBER
            // if (m.name.includes("SomeKnownWinBackMember")) console.log(`Checking ${m.name}: Tab=${activeTab} Match=${matchesTab}`);

            if (!matchesTab) return false;

            // 3. Location Filter (Must be exact match)
            if (locationFilter !== 'all') {
                if (m.location !== locationFilter) return false;
            }

            return true;
        });

        // FORCE DEBUG LOG FOR WIN-BACK
        if (activeTab === 'win-back') {
            console.log('=== WIN-BACK TABLE DEBUG ===');
            console.log('Total Valid Members:', validMembers.length);
            console.log('Filtered Count:', filtered.length);
            console.log('Location Filter:', locationFilter);
            console.log('Search Query:', searchQuery);
            // Log reasons for rejection if count is 0 but valid members exist
            if (filtered.length === 0 && validMembers.length > 0) {
                const sampleWinBack = validMembers.find(m => isWinBackMember(m));
                if (sampleWinBack) {
                    console.log('Found a valid Win-Back member in pool:', sampleWinBack.name);
                    console.log('Rejected due to:',
                        locationFilter !== 'all' && sampleWinBack.location !== locationFilter ? 'Location' :
                            searchQuery && !sampleWinBack.name.toLowerCase().includes(searchQuery) ? 'Search' : 'Unknown'
                    );
                } else {
                    console.log('No Win-Back members found in validMembers pool! Check isWinBackMember or validMembers filter.');
                }
            }
        }
        return filtered;
    }, [members, validMembers, activeTab, searchQuery, locationFilter]);

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
        // AT RISK STATS
        const atRiskMembers = members.filter(m => isAtRiskMember(m));
        const totalAtRisk = atRiskMembers.length;
        const revenueRisk = atRiskMembers.reduce((sum, m) => sum + (m.monthlyRevenue || 0), 0);
        const expiringSoon = atRiskMembers.filter(m => {
            if (!m.membershipExpires) return false;
            const days = getDaysUntilExpiry(m.membershipExpires);
            return days <= 7 && days >= 0;
        }).length;

        // NEW MEMBER STATS
        const newMembers = members.filter(m => isNewMember(m) && !isAtRiskMember(m));
        const totalNew = newMembers.length;
        const firstTwoWeeks = newMembers.filter(m => getDaysSinceJoin(m.joinDate) <= 14).length;
        const avgClassesNew = totalNew > 0
            ? Math.round(newMembers.reduce((sum, m) => sum + (m.totalClasses || 0), 0) / totalNew * 10) / 10
            : 0;
        const zeroClassesNew = newMembers.filter(m => (m.totalClasses || 0) === 0).length;

        // WIN-BACK STATS
        const winBackMembersData = members.filter(m => isWinBackMember(m));
        const totalWinBack = winBackMembersData.length;
        const highPriorityWinBack = winBackMembersData.filter(m => {
            const days = getDaysSinceLastVisit(m.lastVisitDate);
            return days >= 30 && days <= 45;
        }).length;
        const potentialRevenueWinBack = winBackMembersData.reduce((sum, m) => sum + (m.monthlyRevenue || 0), 0);
        const avgPastClassesWinBack = totalWinBack > 0
            ? Math.round(winBackMembersData.reduce((sum, m) => sum + (m.totalClasses || 0), 0) / totalWinBack)
            : 0;

        // RECOVERY STATS
        const recoveryMembersData = members.filter(m => isRecoveryMember(m));
        const totalRecovery = recoveryMembersData.length;
        const highIntensityRecovery = recoveryMembersData.filter(m => getClassesInLastDays(m, 7) >= 6).length;
        const avgClassesRecovery = totalRecovery > 0
            ? Math.round(recoveryMembersData.reduce((sum, m) => sum + getClassesInLastDays(m, 7), 0) / totalRecovery * 10) / 10
            : 0;

        // Common stats for other tabs
        const activeMembers = members.filter(m => m.status === 'Active');
        const avgAttendance = activeMembers.length > 0
            ? activeMembers.reduce((acc, curr) => acc + curr.attendanceFrequency, 0) / activeMembers.length
            : 0;

        // Health Chart Data (Placeholder for now, can be updated later)
        const healthCounts = { [RiskLevel.OK]: 0, [RiskLevel.MEDIUM]: 0, [RiskLevel.HIGH]: 0, [RiskLevel.CRITICAL]: 0 };
        // activeMembers.forEach(m => healthCounts[m.riskLevel]++); // riskLevel usage might need review
        const healthData = [
            { name: t.riskHealthy, value: healthCounts[RiskLevel.OK], color: '#10b981' },
            { name: t.atRiskLabel, value: totalAtRisk, color: '#f59e0b' },
            { name: t.criticalLabel, value: healthCounts[RiskLevel.CRITICAL], color: '#f43f5e' },
        ];

        const recoveryAlertMembers = members.filter(m => m.attendanceThisWeek && m.attendanceThisWeek >= 5);

        return {
            totalActive: activeMembers.length,
            retentionRate: 95, // Placeholder/Calculated elsewhere
            revenueRisk,
            avgAttendance,
            expiringSoon,
            atRiskCount: totalAtRisk,

            // New Member Stats
            totalNew,
            firstTwoWeeks,
            avgClassesNew,
            zeroClassesNew,

            // Win-Back Details
            totalWinBack,
            highPriorityWinBack,
            potentialRevenueWinBack,
            avgPastClassesWinBack,

            // Recovery Stats
            totalRecovery,
            highIntensityRecovery,
            avgClassesRecovery,

            healthData,
            recoveryAlertMembers
        };
    }, [members, t]);

    // DEBUG LOGGING
    React.useEffect(() => {
        if (activeTab === 'at-risk') {
            const atRisk = members.filter(m => isAtRiskMember(m));
            console.log('=== AT RISK DEBUG ===');
            console.log('Total members:', members.length);
            console.log('Active members:', members.filter(m => m.status === 'Active').length);
            console.log('Active + no auto-renew:', members.filter(m => m.status === 'Active' && !m.autoRenew).length);
            console.log('AT RISK members (Active + NoRenew + Expiring Soon):', atRisk.length);
            console.log('Sample AT RISK:', atRisk.slice(0, 3).map(m => ({
                name: m.name,
                status: m.status,
                autoRenew: m.autoRenew,
                expires: m.membershipExpires,
                daysUntil: getDaysUntilExpiry(m.membershipExpires)
            })));
        } else if (activeTab === 'new-members') {
            const newMems = members.filter(m => isNewMember(m) && !isAtRiskMember(m));
            console.log('=== NEW MEMBERS DEBUG ===');
            console.log('Total members:', members.length);
            console.log('Active members:', members.filter(m => m.status === 'Active').length);
            console.log('NEW MEMBERS (Active + joined <90 days - AtRisk):', newMems.length);
            console.log('First 2 weeks:', newMems.filter(m => getDaysSinceJoin(m.joinDate) <= 14).length);
            console.log('Sample NEW MEMBERS:', newMems.slice(0, 3).map(m => ({
                daysSinceJoin: getDaysSinceJoin(m.joinDate),
                totalClasses: m.totalClasses,
            })));
        } else if (activeTab === 'win-back') {
            const winBack = members.filter(m => isWinBackMember(m));
            console.log('=== WIN-BACK DEBUG ===');
            console.log('Total members:', members.length);
            console.log('Inactive members:', members.filter(m => m.status === 'Inactive').length);
            console.log('WIN-BACK (Inactive + 30-90 days):', winBack.length);
            console.log('High priority (30-45 days):', winBack.filter(m => getDaysSinceLastVisit(m.lastVisitDate) <= 45).length);
            console.log('Sample WIN-BACK:', winBack.slice(0, 3).map(m => ({
                name: m.name,
                status: m.status,
                lastVisit: m.lastVisitDate,
                daysInactive: getDaysSinceLastVisit(m.lastVisitDate),
                totalClasses: m.totalClasses,
            })));
        } else if (activeTab === 'recovery') {
            const recovery = members.filter(m => isRecoveryMember(m));
            console.log('=== RECOVERY DEBUG ===');
            console.log('Total members:', members.length);
            console.log('Active members:', members.filter(m => m.status === 'Active').length);
            console.log('RECOVERY (5+ classes/week):', recovery.length);
            console.log('Sample RECOVERY:', recovery.slice(0, 3).map(m => ({
                name: m.name,
                classesThisWeek: getClassesInLastDays(m, 7),
                attendanceFrequency: m.attendanceFrequency,
                monthlyClasses: m.monthlyClasses,
            })));
        }
    }, [members, activeTab]);


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
                            {/* DYNAMIC HEADER STATS */}
                            {(activeTab === 'new-members' ? [
                                { label: "NEW MEMBERS", value: stats.totalNew, trend: "Last 90 days" },
                                { label: "FIRST 2 WEEKS", value: stats.firstTwoWeeks, trend: "Highest priority" },
                                { label: "AVG CLASSES", value: stats.avgClassesNew, trend: "Per new member" },
                                { label: "ZERO CLASSES", value: stats.zeroClassesNew, trend: "Need attention!" }
                            ] : activeTab === 'win-back' ? [
                                { label: "WIN-BACK", value: stats.totalWinBack, trend: "30-90 days inactive" },
                                { label: "HIGH PRIORITY", value: stats.highPriorityWinBack, trend: "30-45 days" },
                                { label: "POTENTIAL REVENUE", value: `RON ${stats.potentialRevenueWinBack.toLocaleString()}`, trend: "If recovered" },
                                { label: "AVG PAST CLASSES", value: stats.avgPastClassesWinBack, trend: "Before leaving" },
                                { label: t.membersSaved || "SAVED", value: '0', trend: t.thisMonth || "This Month" },
                                { label: t.retentionRate || "RETENTION", value: `${stats.retentionRate.toFixed(1)}%`, trend: "Stable" }
                            ] : activeTab === 'recovery' ? [
                                { label: "RECOVERY", value: stats.totalRecovery, trend: "5+ classes/week" },
                                { label: "HIGH INTENSITY", value: stats.highIntensityRecovery, trend: "6+ classes" },
                                { label: "AVG CLASSES", value: stats.avgClassesRecovery, trend: "This week" },
                                { label: "INJURY PREVENTION", value: "🛡️", trend: "Proactive" },
                                { label: t.avgAttendance, value: `${stats.avgAttendance.toFixed(1)}/wk`, trend: '↓ 0.2' },
                            ] : [
                                { label: t.totalMembers, value: stats.totalActive, trend: '↑ 2' },
                                { label: t.retentionRate, value: `${stats.retentionRate.toFixed(1)}%`, trend: t.stable },
                                { label: t.revenueAtRisk, value: `RON ${stats.revenueRisk.toLocaleString()}`, trend: `${stats.atRiskCount} ${t.members}` },
                                { label: t.membersSaved, value: '0', trend: t.thisMonth },
                                { label: t.avgAttendance, value: `${stats.avgAttendance.toFixed(1)}/wk`, trend: '↓ 0.2' },
                                { label: t.expiringSoon, value: stats.expiringSoon, trend: `< 7 ${t.days}` },
                            ]).map((stat, i) => (
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
                                { id: 'new-members', label: "NEW MEMBERS" },
                                { id: 'win-back', label: t.winBack },
                                { id: 'recovery', label: "RECOVERY" }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${activeTab === tab.id
                                        ? 'bg-rose-600 text-white shadow-md' // Distinct color for At Risk tab active state
                                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.id === 'at-risk' && ` (${stats.atRiskCount})`}
                                    {tab.id === 'new-members' && ` (${stats.totalNew})`}
                                    {tab.id === 'win-back' && ` (${stats.totalWinBack})`}
                                    {tab.id === 'recovery' && ` (${stats.totalRecovery})`}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Location Filter */}
                            <div className="relative">
                                <select
                                    value={locationFilter}
                                    onChange={(e) => {
                                        console.log('=== LOCATION FILTER DEBUG ===');
                                        console.log('Selected value:', e.target.value);
                                        setLocationFilter(e.target.value);
                                    }}
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
                                        <th className="px-5 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">{t.reason || "REASON"}</th>
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
                                                                <span className="font-bold text-slate-700 text-xs">{formatDate(member.membershipExpires)}</span>
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                {member.autoRenew ? (
                                                                    <span className="text-emerald-500 inline-flex" title="Auto Renew ON">
                                                                        <CheckCircle className="w-5 h-5 mx-auto" />
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-rose-500 inline-flex" title="No Auto Renew">
                                                                        <XCircle className="w-5 h-5 mx-auto" />
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-5 py-4 text-sm text-slate-600 font-bold">
                                                        {getMemberReason(member, activeTab)}
                                                    </td>

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
                            {activeTab === 'recovery' && (
                                <button
                                    onClick={() => setSelectedTemplate('recovery')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedTemplate === 'recovery' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-slate-50 text-slate-500 hover:bg-indigo-50'}`}
                                >
                                    🛡️ Recovery
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
                        {/* FIXED: Explicit height for chart container */}
                        <div style={{ width: '100%', height: 200 }} className="relative">
                            {/* DEBUG: Log data presence */}
                            {stats.healthData && stats.healthData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.healthData}
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {stats.healthData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                                    No data available
                                </div>
                            )}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
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
