
import { supabase } from './supabaseClient';
import { Member, Milestone, DailyClass, RiskLevel } from '../types';

// Helper to map DB record to Member interface
const mapMemberData = (m: any): Member => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    joinDate: m.join_date,
    lastVisitDate: m.last_visit_date,
    attendanceFrequency: m.attendance_frequency,
    status: m.status,
    riskLevel: m.risk_level as RiskLevel,
    totalClasses: m.total_classes,
    monthlyClasses: m.monthly_classes,
    lastPRDate: m.last_pr_date,
    lastPRExercise: m.last_pr_exercise,
    membershipExpires: m.membership_expires,
    monthlyRevenue: m.monthly_revenue,
    location: m.location,
    membershipType: m.membership_type,
    hasPT: m.has_pt,
    lastMonthClasses: Math.floor(Math.random() * 15),
    autoRenew: m.auto_renew,
    coach: ['Dan Iordache', 'Alex Popa', 'Maria Radcliffe'][Math.floor(Math.random() * 3)],
    lastVisitClass: ['CrossFit WOD', 'Endurance', 'Weightlifting'][Math.floor(Math.random() * 3)],
});

export const getMembers = async (): Promise<Member[]> => {
    console.log('=== STARTING MEMBER FETCH ===');

    // TEST: Direct count query
    const { count, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });

    console.log('=== DIRECT COUNT TEST ===');
    console.log('Total rows in table:', count);
    if (countError) console.error('Count error:', countError);

    // BATCH FETCHING STRATEGY
    const allMembers: any[] = [];
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        console.log(`Fetching batch starting at ${offset}...`);

        const { data, error } = await supabase
            .from('members')
            .select('*')
            .range(offset, offset + batchSize - 1)
            .order('name'); // Ensure consistent ordering for pagination

        if (error) {
            console.error('Batch fetch error:', error);
            break;
        }

        if (data && data.length > 0) {
            allMembers.push(...data);
            console.log(`Got ${data.length} members in this batch. Total so far: ${allMembers.length}`);

            if (data.length < batchSize) {
                hasMore = false; // Less than batch size means we reached the end
            } else {
                offset += batchSize;
            }
        } else {
            hasMore = false;
        }
    }

    console.log(`=== TOTAL MEMBERS FETCHED: ${allMembers.length} ===`);

    return allMembers.map(mapMemberData);
};

export const getMilestones = async (): Promise<Milestone[]> => {
    const { data, error } = await supabase
        .from('milestones')
        .select(`
      *,
      members (name)
    `)
        .range(0, 9999);

    if (error) {
        console.error('Error fetching milestones:', error);
        return [];
    }

    return data.map((m: any) => ({
        id: m.id,
        memberId: m.member_id,
        memberName: m.members?.name || 'Unknown',
        type: m.type,
        value: m.value,
        date: m.date,
    }));
};

export const getDailyClasses = async (): Promise<DailyClass[]> => {
    // First get classes
    const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .range(0, 9999);

    if (classesError) {
        console.error('Error fetching classes:', classesError);
        return [];
    }

    // Then get attendees for each class
    const { data: attendeesData, error: attendeesError } = await supabase
        .from('class_attendees')
        .select(`
      class_id,
      members (*)
    `)
        .range(0, 9999);

    if (attendeesError) {
        console.error('Error fetching class attendees:', attendeesError);
        return [];
    }

    return classesData.map((c: any) => {
        const attendees = attendeesData
            .filter((a: any) => a.class_id === c.id)
            .map((a: any) => ({
                id: a.members.id,
                name: a.members.name,
                email: a.members.email,
                phone: a.members.phone,
                joinDate: a.members.join_date,
                lastVisitDate: a.members.last_visit_date,
                attendanceFrequency: a.members.attendance_frequency,
                status: a.members.status,
                riskLevel: a.members.risk_level as RiskLevel,
                totalClasses: a.members.total_classes,
                monthlyClasses: a.members.monthly_classes,
                lastPRDate: a.members.last_pr_date,
                lastPRExercise: a.members.last_pr_exercise,
                membershipExpires: a.members.membership_expires,
                monthlyRevenue: a.members.monthly_revenue,
                location: a.members.location,
            }));

        return {
            id: c.id,
            time: c.time,
            coach: c.coach,
            name: c.name,
            attendees: attendees,
        };
    });
};
