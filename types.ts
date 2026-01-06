
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
