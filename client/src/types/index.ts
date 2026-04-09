export interface User {
  id: number;
  email: string;
  name: string;
  pictureUrl: string;
  roles: string[];
}

export const FACILITY_TYPES = [
  'CONFERENCE_ROOM',
  'LABORATORY',
  'SPORTS_HALL',
  'AUDITORIUM',
  'STUDY_ROOM',
  'COMPUTER_LAB',
  'PROJECTOR',
  'CAMERA',
  'MEETING_ROOM',
  'LECTURE_HALL',
  'OTHER',
] as const;

export type FacilityType = (typeof FACILITY_TYPES)[number];

export const FACILITY_STATUSES = [
  'AVAILABLE',
  'UNDER_MAINTENANCE',
  'UNAVAILABLE',
  'ACTIVE',
  'OUT_OF_SERVICE',
] as const;

export type FacilityStatus = (typeof FACILITY_STATUSES)[number];

export interface Facility {
  id: number;
  name: string;
  description?: string;
  facilityType: FacilityType;
  location: string;
  capacity: number;
  status: FacilityStatus;
  imageUrl?: string | null;
  amenities?: string | null;
  availableFrom: string;
  availableTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacilityRequest {
  name: string;
  description?: string;
  facilityType: FacilityType;
  location: string;
  capacity: number;
  status: FacilityStatus;
  imageUrl?: string;
  amenities?: string;
  availableFrom: string;
  availableTo: string;
}

export interface UpdateFacilityRequest {
  name?: string;
  description?: string;
  facilityType?: FacilityType;
  location?: string;
  capacity?: number;
  status?: FacilityStatus;
  imageUrl?: string;
  amenities?: string;
  availableFrom?: string;
  availableTo?: string;
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
  startTime: string;
  endTime: string;
  purpose: string;
  numberOfAttendees: number;
  status: BookingStatus;
  staffComments?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
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

export interface ApiError {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  details?: Record<string, string>;
}
