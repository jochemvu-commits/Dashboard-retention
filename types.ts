
export enum RiskLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  OK = 'OK'
}

export type Language = 'en' | 'ro';

export interface Milestone {
  id: string;
  memberId: string;
  memberName: string;
  type: 'pr' | 'class_count' | 'comeback' | 'streak';
  value: string;
  date: string;
  celebrated?: boolean;
  previousValue?: string;
  improvement?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  lastVisitDate: string;
  attendanceFrequency: number; // avg per week
  status: 'active' | 'inactive' | 'cooling_off';
  riskLevel: RiskLevel;
  totalClasses: number;
  monthlyClasses: number;
  lastPRDate?: string;
  lastPRExercise?: string;
  membershipExpires: string;
  monthlyRevenue: number;
  lastMonthClasses?: number;
  autoRenew?: boolean;
  coach?: string;
  lastVisitClass?: string;
  // New Fields for Enhanced Dashboard
  membershipType?: string;
  hasPT?: boolean;
  cancelledBookings?: number;
  totalBookings?: number;
  attendanceThisWeek?: number;
}

export interface DashboardStats {
  totalMembers: number;
  atRiskCount: number;
  atRiskRevenue: number;
  avgAttendance: number;
  monthlyRevenue: number;
}

export interface DailyClass {
  id: string;
  time: string;
  coach: string;
  name: string;
  attendees: Member[];
}

export interface Activity {
  id: string;
  date: string;
  memberId: string;
  memberName: string;
  memberValue: number;
  reason: 'at-risk' | 'expiring' | 'win-back' | 'milestone' | 'other';
  type: 'whatsapp' | 'email' | 'call' | 'inperson';
  message?: string;
  outcome: 'pending' | 'returned' | 'no_response' | 'churned';
}
