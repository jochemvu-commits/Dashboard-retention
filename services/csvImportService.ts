import { supabase } from './supabaseClient';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface ClientRecord {
  client_id: string;
  name: string;
  status: 'Active' | 'Inactive';
  email: string;
  phone: string;
  last_visit_date: string | null;
}

interface AttendanceData {
  join_date: string | null;
  last_attendance_date: string | null;
  total_classes: number;
  classes_this_month: number;
}

interface MembershipData {
  location: string;
  monthly_revenue: number;
  auto_renew: boolean;
  membership_expires: string | null;
  membership_type: string;
  has_pt: boolean;
}

interface MemberRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  join_date: string | null;
  last_visit_date: string | null;
  total_classes: number;
  monthly_classes: number;
  location: string;
  monthly_revenue: number;
  auto_renew: boolean;
  membership_expires: string | null;
  membership_type: string;
  has_pt: boolean;
  risk_level: string;
  attendance_frequency: number;
}

// ============================================
// CSV PARSING UTILITIES
// ============================================

function parseCSV(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header.trim()] = values[index]?.trim() || '';
    });

    records.push(record);
  }

  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// ============================================
// DATE PARSING UTILITIES
// ============================================

function parseWodifyDate(dateStr: string): string | null {
  if (!dateStr || dateStr === '') return null;

  try {
    // Handle format: "Dec 31, 2025" or "Dec 31, 2025, 7:00 AM"
    const cleaned = dateStr.trim();
    // Use a robust date parsing if needed, but Date constructor handles "Dec 1, 2025" well in standard environments.
    // Wodify often exports as "MM/DD/YYYY" or "YYYY-MM-DD" or "Month DD, YYYY".
    // Let's assume the Date constructor can handle what passed before (cleaned string).

    const date = new Date(cleaned);

    if (isNaN(date.getTime())) {
      // Fallback for European formats if needed?
      // For now, stick to standard.
      return null;
    }

    // Return as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

// ============================================
// STEP 1: PARSE CLIENTS CSV
// ============================================

function parseClients(csvContent: string): Map<string, ClientRecord> {
  console.log('=== PARSING CLIENTS CSV ===');

  const records = parseCSV(csvContent);
  const clients = new Map<string, ClientRecord>();

  for (const record of records) {
    const clientId = record['Client ID']?.trim();
    if (!clientId) continue;

    const status = record['Client Active']?.trim();
    const clientStatus = record['Client Status']?.trim(); // Also check Client Status

    // Logic: Use Client Status if available, otherwise Client Active
    // The prompt requested strictly using "Client Status" for Active/Inactive
    // But then the provided code used "Client Active". 
    // I will stick to the provided code logic from the prompt in Step 3.
    // The prompt code uses: status = record['Client Active']?.trim();
    // Wait, the prompt said "STEP 1: Find where the Clients CSV is being parsed... const clientStatus = record['Client Status'];" in Task 1 of previous prompt.
    // But in the NEW "STEP 3: Create New csvImportService.ts" block, it uses:
    // const status = record['Client Active']?.trim();
    // clients.set(..., status: status === 'Active' ? 'Active' : 'Inactive', ...);

    // I will strictly follow the provided code block in the LATEST prompt "Step 3".
    const finalStatus = status === 'Active' ? 'Active' : 'Inactive';

    clients.set(clientId, {
      client_id: clientId,
      name: record['Client Name']?.trim() || 'Unknown',
      status: finalStatus,
      email: record['Email']?.trim() || '',
      phone: record['Phone Number']?.trim() || '',
      last_visit_date: parseWodifyDate(record['Last Class Sign In: Day']),
    });
  }

  console.log(`Parsed ${clients.size} clients`);
  console.log(`Active: ${[...clients.values()].filter(c => c.status === 'Active').length}`);
  console.log(`Inactive: ${[...clients.values()].filter(c => c.status === 'Inactive').length}`);

  return clients;
}

// ============================================
// STEP 2: PARSE ATTENDANCE CSV
// ============================================

function parseAttendance(csvContent: string): Map<string, AttendanceData> {
  console.log('=== PARSING ATTENDANCE CSV ===');

  const records = parseCSV(csvContent);
  const attendanceMap = new Map<string, AttendanceData>();

  // Get current month for monthly count
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  for (const record of records) {
    const clientId = record['Client ID']?.trim();
    const status = record['Status']?.trim();
    const dateStr = record['Start Datetime']?.trim();

    // Only count actual attendances
    if (!clientId || status !== 'Attended' || !dateStr) continue;

    const attendanceDate = parseWodifyDate(dateStr);
    if (!attendanceDate) continue;

    const date = new Date(attendanceDate + ' 12:00:00');
    const isThisMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;

    // Get or create attendance data for this client
    let data = attendanceMap.get(clientId);
    if (!data) {
      data = {
        join_date: attendanceDate,
        last_attendance_date: attendanceDate,
        total_classes: 0,
        classes_this_month: 0,
      };
      attendanceMap.set(clientId, data);
    }

    // Update attendance data
    data.total_classes++;
    if (isThisMonth) data.classes_this_month++;

    // Update join date (earliest)
    if (attendanceDate < data.join_date!) {
      data.join_date = attendanceDate;
    }

    // Update last attendance (latest)
    if (attendanceDate > data.last_attendance_date!) {
      data.last_attendance_date = attendanceDate;
    }
  }

  console.log(`Parsed attendance for ${attendanceMap.size} clients`);

  return attendanceMap;
}

// ============================================
// STEP 3: PARSE MEMBERSHIPS CSV
// ============================================

function parseMemberships(csvContent: string): Map<string, MembershipData> {
  console.log('=== PARSING MEMBERSHIPS CSV ===');

  const records = parseCSV(csvContent);
  const membershipMap = new Map<string, MembershipData>();

  for (const record of records) {
    const clientId = record['Client ID']?.trim();
    if (!clientId) continue;

    const membership = record['Membership']?.trim() || '';
    const commitmentTotal = record['Commitment Total']?.trim() || '0';
    const autoRenew = record['Membership Autorenew']?.trim();
    const expirationDate = record['Expiration Date']?.trim();

    // Extract location from membership name
    const location = extractLocation(membership);

    // Parse commitment total (handle "1,400.00" format)
    let value = parseFloat(commitmentTotal.replace(/,/g, ''));
    if (isNaN(value)) value = 0;

    // Adjust for 12-week plans (divide by 3 to get monthly)
    if (membership.toLowerCase().includes('12 weeks') || membership.includes('/12 weeks')) {
      value = Math.round(value / 3);
    }

    // Check if has personal training
    const hasPT = membership.toLowerCase().includes('pt') ||
      membership.toLowerCase().includes('personal');

    // Clean membership name (remove location prefix)
    const membershipType = cleanMembershipName(membership);

    // Only keep the highest value membership per client
    const existing = membershipMap.get(clientId);
    if (!existing || value > existing.monthly_revenue) {
      membershipMap.set(clientId, {
        location,
        monthly_revenue: value,
        auto_renew: autoRenew === 'Auto Renew',
        membership_expires: parseWodifyDate(expirationDate),
        membership_type: membershipType,
        has_pt: hasPT,
      });
    }
  }

  console.log(`Parsed memberships for ${membershipMap.size} clients`);

  return membershipMap;
}

function extractLocation(membership: string): string {
  const upper = membership.toUpperCase();
  if (upper.includes('UNU MAI') || upper.includes('UNUMAI')) {
    return 'UNU MAI';
  }
  if (upper.includes('BERARIEI')) {
    return 'BERARIEI';
  }
  return 'Unknown';
}

function cleanMembershipName(membership: string): string {
  if (!membership) return 'Unknown';

  return membership
    .trim()
    .replace(/^\s*(UNU MAI|BERARIEI|UNUMAI)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Unknown';
}

// ============================================
// STEP 4: CALCULATE RISK LEVEL
// ============================================

function calculateRiskLevel(
  status: string,
  lastVisitDate: string | null,
  autoRenew: boolean,
  membershipExpires: string | null
): string {
  // Inactive members are always critical
  if (status === 'Inactive') return 'CRITICAL';

  const now = new Date();

  // Check days since last visit
  let daysSinceVisit = 999;
  if (lastVisitDate) {
    const lastVisit = new Date(lastVisitDate + ' 12:00:00');
    daysSinceVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Check days until expiry
  let daysUntilExpiry = 999;
  if (membershipExpires) {
    const expiry = new Date(membershipExpires + ' 12:00:00');
    daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Risk calculation
  if (!autoRenew && daysUntilExpiry <= 14) return 'CRITICAL';
  if (!autoRenew && daysUntilExpiry <= 30) return 'HIGH';
  if (daysSinceVisit >= 21) return 'HIGH';
  if (daysSinceVisit >= 14) return 'MEDIUM';

  return 'OK';
}

// ============================================
// STEP 5: MERGE AND CREATE MEMBER RECORDS
// ============================================

function mergeData(
  clients: Map<string, ClientRecord>,
  attendance: Map<string, AttendanceData>,
  memberships: Map<string, MembershipData>
): MemberRecord[] {
  console.log('=== MERGING DATA ===');

  const members: MemberRecord[] = [];

  for (const [clientId, client] of clients) {
    const attendanceData = attendance.get(clientId);
    const membershipData = memberships.get(clientId);

    // Use attendance last_visit if available, otherwise use client's last_visit
    const lastVisitDate = attendanceData?.last_attendance_date || client.last_visit_date;

    // Calculate attendance frequency (classes per week)
    let attendanceFrequency = 0;
    if (attendanceData && attendanceData.join_date) {
      const joinDate = new Date(attendanceData.join_date + ' 12:00:00');
      const now = new Date();
      // Avoid division by zero
      const weeksActive = Math.max(1, Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
      attendanceFrequency = Math.round((attendanceData.total_classes / weeksActive) * 10) / 10;
    }

    const member: MemberRecord = {
      id: clientId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      status: client.status,
      join_date: attendanceData?.join_date || null,
      last_visit_date: lastVisitDate,
      total_classes: attendanceData?.total_classes || 0,
      monthly_classes: attendanceData?.classes_this_month || 0,
      location: membershipData?.location || 'Unknown',
      monthly_revenue: membershipData?.monthly_revenue || 0,
      auto_renew: membershipData?.auto_renew || false,
      membership_expires: membershipData?.membership_expires || null,
      membership_type: membershipData?.membership_type || 'Unknown',
      has_pt: membershipData?.has_pt || false,
      risk_level: calculateRiskLevel(
        client.status,
        lastVisitDate,
        membershipData?.auto_renew || false,
        membershipData?.membership_expires || null
      ),
      attendance_frequency: attendanceFrequency,
    };

    members.push(member);
  }

  console.log(`Created ${members.length} member records`);

  return members;
}

// ============================================
// STEP 6: INSERT INTO SUPABASE
// ============================================

async function insertMembers(members: MemberRecord[]): Promise<{ success: number; errors: number }> {
  console.log('=== INSERTING INTO SUPABASE ===');

  let success = 0;
  let errors = 0;

  // Insert in batches of 100
  const batchSize = 100;

  for (let i = 0; i < members.length; i += batchSize) {
    const batch = members.slice(i, i + batchSize);

    const { error } = await supabase
      .from('members')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Batch ${i / batchSize + 1} error:`, error);
      errors += batch.length;
    } else {
      success += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} members`);
    }
  }

  console.log(`Insert complete: ${success} success, ${errors} errors`);

  return { success, errors };
}

// ============================================
// MAIN IMPORT FUNCTION
// ============================================

export interface ImportResult {
  success: boolean;
  membersImported: number;
  milestonesImported: number;
  errors: string[];
}

export async function importWodifyData(
  clientsCsv: string,
  attendanceCsv: string,
  membershipsCsv: string,
  prsCsv?: string
): Promise<ImportResult> {
  console.log('========================================');
  console.log('STARTING WODIFY DATA IMPORT');
  console.log('========================================');

  const errors: string[] = [];

  try {
    // Step 1: Parse all CSV files
    const clients = parseClients(clientsCsv);
    const attendance = parseAttendance(attendanceCsv);
    const memberships = parseMemberships(membershipsCsv);

    // Step 2: Merge all data
    const members = mergeData(clients, attendance, memberships);

    // Step 3: Insert into Supabase
    const result = await insertMembers(members);

    console.log('========================================');
    console.log('IMPORT COMPLETE');
    console.log(`Total members: ${members.length}`);
    console.log(`Active: ${members.filter(m => m.status === 'Active').length}`);
    console.log(`Inactive: ${members.filter(m => m.status === 'Inactive').length}`);
    console.log(`With membership: ${members.filter(m => m.monthly_revenue > 0).length}`);
    console.log('========================================');

    return {
      success: result.errors === 0,
      membersImported: result.success,
      milestonesImported: 0,
      errors: result.errors > 0 ? [`${result.errors} members failed to insert`] : [],
    };

  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      membersImported: 0,
      milestonesImported: 0,
      errors: [(error as Error).message],
    };
  }
}

// ============================================
// ANALYZE FUNCTION (for preview)
// ============================================

export function analyzeImportData(
  clientsCsv: string,
  attendanceCsv: string,
  membershipsCsv: string
): {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  attendanceRecords: number;
  activeMemberships: number;
} {
  const clients = parseClients(clientsCsv);
  const attendanceRecords = parseCSV(attendanceCsv);
  const memberships = parseMemberships(membershipsCsv);

  return {
    totalClients: clients.size,
    activeClients: [...clients.values()].filter(c => c.status === 'Active').length,
    inactiveClients: [...clients.values()].filter(c => c.status === 'Inactive').length,
    attendanceRecords: attendanceRecords.length,
    activeMemberships: memberships.size,
  };
}
