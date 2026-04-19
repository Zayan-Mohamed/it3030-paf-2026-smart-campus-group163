export interface User {
  id: number;
  username: string;
  email: string;
  major?: string;
}

export interface CampusEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  location?: string;
  externalFormUrl?: string;
  lfgEnabled: boolean;
  eventType: 'SEMESTER_PROJECT' | 'FINAL_YEAR_PROJECT' | 'HACKATHON' | 'WORKSHOP' | 'SOCIAL' | 'OTHER';
  creator: User;
  createdAt: string;
}

export interface EventSquad {
  id: number;
  event: CampusEvent;
  name: string;
  description?: string;
  creator: User;
  maxMembers?: number;
  targetYear?: string;
  targetSemester?: string;
  targetMajor?: string;
  members: User[];
  pendingMembers: User[];
  createdAt: string;
}
