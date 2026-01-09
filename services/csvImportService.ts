import { supabase } from './supabaseClient';
import { RiskLevel } from '../types';

// =====================================================
// TYPE DEFINITIONS FOR WODIFY CSV DATA
// =====================================================

interface WodifyClient {
  'Client ID': string;
  'Client Name': string;
  'Location': string;
  'Client Active': string;
  'Phone Number': string;
  'Email': string;
  'Gender': string;
  'City': string;
  'State Province': string;
  'Created Date': string;
  'Client Owner': string;
  'Last Class Sign In: Day': string;
  'Retain At Risk': string;
  'Total Segments': string;
  'Total Memberships': string;
}

interface WodifyAttendance {
  'Client ID': string;
  'Name': string;
  'Type': string;
  'Participant Status': string;
  'Status': string;
  'Class Name': string;
  'Login Source': string;
  'Membership Type': string;
  'Location': string;
  'Program Service': string;
  'Counts Towards Membership Limits': string;
  'Client Active': string;
  'Coach Name': string;
  'Appointment Details - Appointment Booking → Provider Name': string;
  'Start Datetime': string;
}

interface WodifyMembership {
  'Client ID': string;
  'Client Name': string;
  'Membership ID': string;
  'Membership': string;
  'Membership Type': string;
  'Location': string;
  'Programs': string;
  'Payment Plan': string;
  'Default Payment Method': string;
  'Start Date': string;
  'Expiration Date': string;
  'Membership Autorenew': string;
  'Autorenew Commitment Total': string;
  'Commitment Total': string;
  'Payment Plan Type': string;
  'Email': string;
  'Mass Email Subscribed': string;
  'Membership Active': string;
}

interface WodifyPR {
  'Result Date': string;
  'Client Name': string;
  'Client ID': string;
  'Clients → Phone Number': string;
  'Clients → Email': string;
  'Workout': string;
  'Program': string;
  'Component': string;
  'Component Type': string;
  'Rep Scheme': string;
  'Result': string;
  'Personal Record Details': string;
  'Class → Location': string;
  'Class → Class': string;
  'Component Description': string;
  'Component Comment': string;
}

// =====================================================
// CSV PARSING UTILITY
// =====================================================

export function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];

  // Parse header - handle quoted fields
  const parseRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const data: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseRow(line);
    const row: any = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    data.push(row as T);
  }

  return data;
}

// =====================================================
// DATE PARSING UTILITIES
// =====================================================

function parseWodifyDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;

  // Format: "Dec 31, 2025" or "Dec 31, 2025, 7:00 AM"
  const cleanDate = dateStr.split(',').slice(0, 2).join(',').trim();
  const parsed = new Date(cleanDate);

  if (isNaN(parsed.getTime())) {
    // Try alternative format: "2025-12-31"
    const altParsed = new Date(dateStr);
    if (isNaN(altParsed.getTime())) return null;
    return altParsed;
  }

  return parsed;
}

function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// =====================================================
// RISK CALCULATION LOGIC (Ported from Python app)
// =====================================================

interface MemberAnalysis {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  joinDate: Date | null;
  lastVisitDate: Date | null;
  daysInactive: number;
  totalClasses: number;
  classesLast30Days: number;
  classesLast7Days: number;
  attendanceFrequency: number; // avg per week
  status: 'active' | 'inactive' | 'cooling_off';
  riskLevel: RiskLevel;
  membershipExpires: Date | null;
  monthlyRevenue: number;
  autoRenew: boolean;
  lastPRDate: Date | null;
  lastPRExercise: string | null;
}

function calculateRiskLevel(
  daysInactive: number,
  classesLast30Days: number,
  previousMonthClasses: number,
  isActive: boolean
): RiskLevel {
  if (!isActive) {
    return RiskLevel.CRITICAL;
  }

  // Critical: 14+ days inactive OR 0-1 classes in 30 days
  if (daysInactive >= 14 || classesLast30Days <= 1) {
    return RiskLevel.CRITICAL;
  }

  // High: 7-13 days inactive OR significant drop in attendance
  const dropPercentage = previousMonthClasses > 0
    ? ((previousMonthClasses - classesLast30Days) / previousMonthClasses) * 100
    : 0;

  if (daysInactive >= 7 || classesLast30Days <= 3 || dropPercentage >= 50) {
    return RiskLevel.HIGH;
  }

  // Medium: 4-6 days inactive OR moderate drop
  if (daysInactive >= 4 || classesLast30Days <= 5 || dropPercentage >= 25) {
    return RiskLevel.MEDIUM;
  }

  // OK: Regular attendance
  return RiskLevel.OK;
}

function extractMonthlyRevenue(membership: string, commitmentTotal: string): number {
  // Try to extract price from membership name
  const priceMatch = membership.match(/(\d+)\s*(NEW|lei)?/i);
  if (priceMatch) {
    return parseFloat(priceMatch[1]);
  }

  // Fallback to commitment total
  const total = parseFloat(commitmentTotal.replace(/,/g, ''));
  if (!isNaN(total)) {
    return total;
  }

  return 0;
}

function extractLocation(membershipType: string): string {
  if (!membershipType) return 'Unknown';
  const upper = membershipType.toUpperCase();
  if (upper.startsWith('UNU MAI')) return 'UNU MAI';
  if (upper.startsWith('BERARIEI')) return 'BERARIEI';
  return 'Unknown';
}

// =====================================================
// MAIN IMPORT FUNCTION
// =====================================================

export interface ImportResult {
  success: boolean;
  membersImported: number;
  milestonesImported: number;
  errors: string[];
}

export async function importWodifyData(
  clientsCSV: string,
  attendanceCSV: string,
  membershipsCSV: string,
  prsCSV?: string
): Promise<ImportResult> {
  const errors: string[] = [];
  const today = new Date();

  try {
    // Parse all CSVs
    console.log('Parsing CSVs...');
    const clients = parseCSV<WodifyClient>(clientsCSV);
    const attendance = parseCSV<WodifyAttendance>(attendanceCSV);
    const memberships = parseCSV<WodifyMembership>(membershipsCSV);
    const prs = prsCSV ? parseCSV<WodifyPR>(prsCSV) : [];

    console.log(`Parsed: ${clients.length} clients, ${attendance.length} attendance records, ${memberships.length} memberships, ${prs.length} PRs`);

    // Build attendance stats per client
    const attendanceByClient = new Map<string, {
      totalAttended: number;
      last30Days: number;
      last7Days: number;
      previous30Days: number;
      lastVisit: Date | null;
      dates: Date[];
      thisWeek: number;
      cancelled: number;
      totalBookings: number;
    }>();

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Calculate start of current week (Monday)
    const currentWeekStart = new Date(today);
    currentWeekStart.setHours(0, 0, 0, 0);
    const day = currentWeekStart.getDay() || 7; // Get current day number, converting Sun(0) to 7
    if (day !== 1) currentWeekStart.setHours(-24 * (day - 1)); // Adjust backwards to Monday


    for (const record of attendance) {
      const status = record['Status'];
      const clientId = record['Client ID'];
      const date = parseWodifyDate(record['Start Datetime']);

      if (!date) continue;

      if (!attendanceByClient.has(clientId)) {
        attendanceByClient.set(clientId, {
          totalAttended: 0,
          last30Days: 0,
          last7Days: 0,
          previous30Days: 0,
          lastVisit: null,
          dates: [],
          thisWeek: 0,
          cancelled: 0,
          totalBookings: 0
        });
      }

      const stats = attendanceByClient.get(clientId)!;
      stats.totalBookings++;

      if (status === 'Cancelled' || status === 'Late Cancel') {
        stats.cancelled++;
      }

      if (status !== 'Attended' && status !== 'Signed In') continue;

      // Rest of logic for attended classes
      stats.totalAttended++;
      stats.dates.push(date);

      if (date >= currentWeekStart) {
        stats.thisWeek++;
      }

      if (date >= thirtyDaysAgo) {
        stats.last30Days++;
      } else if (date >= sixtyDaysAgo) {
        stats.previous30Days++;
      }

      if (date >= sevenDaysAgo) {
        stats.last7Days++;
      }

      if (!stats.lastVisit || date > stats.lastVisit) {
        stats.lastVisit = date;
      }
    }

    // Build membership data per client (get most recent active membership)
    const membershipByClient = new Map<string, {
      expires: Date | null;
      monthlyRevenue: number;
      autoRenew: boolean;
      membershipName: string;
    }>();

    for (const mem of memberships) {
      const clientId = mem['Client ID'];
      const expires = parseWodifyDate(mem['Expiration Date']);
      const revenue = extractMonthlyRevenue(mem['Membership'], mem['Commitment Total']);
      const autoRenew = mem['Membership Autorenew'] === 'Auto Renew';

      const existing = membershipByClient.get(clientId);

      // Keep the membership with the latest expiration
      if (!existing || (expires && (!existing.expires || expires > existing.expires))) {
        membershipByClient.set(clientId, {
          expires,
          monthlyRevenue: revenue,
          autoRenew,
          membershipName: mem['Membership']
        });
      }
    }

    // Determine PT status
    const ptClientIds = new Set<string>();
    for (const mem of memberships) {
      if (mem['Membership Active'] === 'Active' || (mem['Expiration Date'] && new Date(mem['Expiration Date']) >= today)) {
        const name = mem['Membership'].toLowerCase();
        if (name.includes('personal') || name.includes('pt') || name.includes('training')) {
          ptClientIds.add(mem['Client ID']);
        }
      }
    }


    // Build PR data per client (most recent PR)
    const prByClient = new Map<string, {
      date: Date;
      exercise: string;
      result: string;
    }>();

    for (const pr of prs) {
      const clientId = pr['Client ID'];
      const date = parseWodifyDate(pr['Result Date']);

      if (!date || !pr['Personal Record Details']) continue;

      const existing = prByClient.get(clientId);
      if (!existing || date > existing.date) {
        prByClient.set(clientId, {
          date,
          exercise: pr['Component'] || pr['Workout'] || 'Unknown',
          result: pr['Result']
        });
      }
    }

    // Process clients and calculate risk
    const membersToInsert: any[] = [];
    const milestonesToInsert: any[] = [];

    for (const client of clients) {
      const clientId = client['Client ID'];
      const isActive = client['Client Active'] === 'Active';

      // Get attendance stats
      const attStats = attendanceByClient.get(clientId) || {
        totalAttended: 0,
        last30Days: 0,
        last7Days: 0,
        previous30Days: 0,
        lastVisit: null,
        dates: [],

        thisWeek: 0,
        cancelled: 0,
        totalBookings: 0
      };

      // Get membership info
      const memInfo = membershipByClient.get(clientId);

      // Get PR info
      const prInfo = prByClient.get(clientId);

      // Calculate days inactive
      const lastVisit = attStats.lastVisit || parseWodifyDate(client['Last Class Sign In: Day']);
      const daysInactive = lastVisit ? daysBetween(lastVisit, today) : 999;

      // Calculate attendance frequency (avg classes per week over last 30 days)
      const attendanceFrequency = attStats.last30Days / 4.3; // ~4.3 weeks in a month

      // Calculate risk level
      const riskLevel = calculateRiskLevel(
        daysInactive,
        attStats.last30Days,
        attStats.previous30Days,
        isActive
      );

      // Determine status
      let status: 'active' | 'inactive' | 'cooling_off' = 'inactive';
      if (isActive) {
        status = daysInactive > 7 ? 'cooling_off' : 'active';
      }

      // Only import active members or recently inactive (within 90 days)
      if (!isActive && daysInactive > 90) continue;

      const member = {
        id: clientId,
        name: client['Client Name'].trim(),
        email: client['Email'] || '',
        phone: client['Phone Number'] || '',

        last_visit_date: lastVisit ? lastVisit.toISOString().split('T')[0] : null,
        attendance_frequency: Math.round(attendanceFrequency * 10) / 10,
        status,
        risk_level: riskLevel,
        total_classes: attStats.totalAttended,
        monthly_classes: attStats.last30Days,
        last_pr_date: prInfo?.date ? prInfo.date.toISOString().split('T')[0] : null,
        last_pr_exercise: prInfo?.exercise || null,
        membership_expires: memInfo?.expires ? memInfo.expires.toISOString().split('T')[0] : null,
        monthly_revenue: memInfo?.monthlyRevenue || 0,
        membership_type: memInfo?.membershipName || 'Unknown',
        location: extractLocation(memInfo?.membershipName || ''),
        has_pt: ptClientIds.has(clientId),


        attendance_this_week: attStats.thisWeek,
        auto_renew: memInfo?.autoRenew || false,
        cancelled_bookings: attStats.cancelled,
        total_bookings: attStats.totalBookings,
        join_date: client['Created Date'] ? new Date(client['Created Date']).toISOString().split('T')[0] : today.toISOString().split('T')[0] // Fallback
      };

      membersToInsert.push(member);

      // Create milestone for recent PRs (last 7 days)
      if (prInfo && prInfo.date >= sevenDaysAgo) {
        milestonesToInsert.push({
          id: `pr-${clientId}-${prInfo.date.toISOString().split('T')[0]}`,
          member_id: clientId,
          type: 'pr',
          value: `${prInfo.exercise}: ${prInfo.result}`,
          date: prInfo.date.toISOString().split('T')[0]
        });
      }

      // Create milestone for class counts
      const classCount = attStats.totalAttended;
      const milestones = [500, 400, 300, 250, 200, 150, 100, 50, 25, 10];
      for (const milestone of milestones) {
        if (classCount >= milestone && classCount < milestone + attStats.last7Days) {
          milestonesToInsert.push({
            id: `classes-${clientId}-${milestone}`,
            member_id: clientId,
            type: 'class_count',
            value: `${milestone} Classes!`,
            date: today.toISOString().split('T')[0]
          });
          break;
        }
      }
    }

    console.log(`Prepared ${membersToInsert.length} members and ${milestonesToInsert.length} milestones for import`);

    // Clear existing data
    console.log('Clearing existing data...');
    await supabase.from('class_attendees').delete().neq('class_id', '');
    await supabase.from('milestones').delete().neq('id', '');
    await supabase.from('classes').delete().neq('id', '');
    await supabase.from('members').delete().neq('id', '');

    // Insert members in batches
    console.log('Inserting members...');
    const batchSize = 100;
    for (let i = 0; i < membersToInsert.length; i += batchSize) {
      const batch = membersToInsert.slice(i, i + batchSize);
      const { error } = await supabase.from('members').insert(batch);
      if (error) {
        console.error('Error inserting members batch:', error);
        errors.push(`Error inserting members: ${error.message}`);
      }
    }

    // Insert milestones
    console.log('Inserting milestones...');
    if (milestonesToInsert.length > 0) {
      for (let i = 0; i < milestonesToInsert.length; i += batchSize) {
        const batch = milestonesToInsert.slice(i, i + batchSize);
        const { error } = await supabase.from('milestones').insert(batch);
        if (error) {
          console.error('Error inserting milestones batch:', error);
          errors.push(`Error inserting milestones: ${error.message}`);
        }
      }
    }

    console.log('Import complete!');

    return {
      success: errors.length === 0,
      membersImported: membersToInsert.length,
      milestonesImported: milestonesToInsert.length,
      errors
    };

  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      membersImported: 0,
      milestonesImported: 0,
      errors: [(error as Error).message]
    };
  }
}

// =====================================================
// HELPER: Get import statistics
// =====================================================

export function analyzeImportData(
  clientsCSV: string,
  attendanceCSV: string,
  membershipsCSV: string
): {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  attendanceRecords: number;
  activeMemberships: number;
} {
  const clients = parseCSV<WodifyClient>(clientsCSV);
  const attendance = parseCSV<WodifyAttendance>(attendanceCSV);
  const memberships = parseCSV<WodifyMembership>(membershipsCSV);

  const activeClients = clients.filter(c => c['Client Active'] === 'Active').length;

  return {
    totalClients: clients.length,
    activeClients,
    inactiveClients: clients.length - activeClients,
    attendanceRecords: attendance.length,
    activeMemberships: memberships.length
  };
}
