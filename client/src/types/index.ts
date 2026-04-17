export interface User {
  id: number;
  email: string;
  name: string;
  pictureUrl: string;
  roles: string[];
  studentRegistrationNumber?: string;
  faculty?: string;
  major?: string;
  phoneNumber?: string;
  employeeId?: string;
  department?: string;
}

export type FacilityType =
  | 'CONFERENCE_ROOM'
  | 'LABORATORY'
  | 'SPORTS_HALL'
  | 'AUDITORIUM'
  | 'STUDY_ROOM'
  | 'COMPUTER_LAB'
  | 'OTHER';

export type FacilityStatus = 'AVAILABLE' | 'UNDER_MAINTENANCE' | 'UNAVAILABLE';

export interface Facility {
  id: number;
  name: string;
  description: string;
  facilityType: FacilityType;
  location: string;
  capacity: number;
  status: FacilityStatus;
  imageUrl?: string | null;
  amenities?: string | null;
  availableFrom?: string | null;
  availableTo?: string | null;
}

export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: number;
  facilityId: number;
  facilityName: string;
  facilityType: FacilityType;
  facilityLocation: string;
  facilityCapacity: number;
  userId: number;
  userName: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  purpose: string;
  numberOfAttendees: number;
  status: BookingStatus;
  staffComments?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  adminCancelReason?: string | null;
  cancelledByName?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
  canCancel: boolean;
}

export interface BookingConflict {
  id: number;
  facilityName: string;
  userName: string;
  status: BookingStatus;
  startTime: string;
  endTime: string;
}

export interface BookingConflictResult {
  hasConflict: boolean;
  message: string;
  conflictingBookings: BookingConflict[];
}

export type IncidentCategory =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'HVAC'
  | 'EQUIPMENT'
  | 'CLEANLINESS'
  | 'SECURITY'
  | 'FURNITURE'
  | 'AV_EQUIPMENT'
  | 'NETWORK'
  | 'OTHER';
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface Incident {
  id: number;
  reporterId?: number | null;
  reporterName?: string | null;
  resourceLocation: string;
  category: IncidentCategory;
  description: string;
  priority: IncidentPriority;
  preferredContact: string;
  status: IncidentStatus;
  assignedToId?: number | null;
  assignedToName?: string | null;
  resolutionNotes?: string | null;
  rejectionReason?: string | null;
  imageUrls: string[];
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface IncidentAssignee {
  id: number;
  name: string;
  email: string;
}

export interface IncidentComment {
  id: number;
  incidentId: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  details?: Record<string, string>;
}

export type NotificationType = 'BOOKING_UPDATE' | 'TICKET_UPDATE' | 'NEW_COMMENT';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  referenceId?: string;
  referenceType?: string;
}
