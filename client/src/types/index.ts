export interface User {
  id: number;
  email: string;
  name: string;
  pictureUrl: string;
  roles: string[];
}

export type IncidentCategory = 'ELECTRICAL' | 'FURNITURE' | 'AV_EQUIPMENT' | 'NETWORK' | 'OTHER';
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface Incident {
  id: number;
  resourceLocation: string;
  category: IncidentCategory;
  description: string;
  priority: IncidentPriority;
  preferredContact: string;
  status: IncidentStatus;
  imageUrls: string[];
  createdAt: string;
}
