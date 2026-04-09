export const mockFacilities = [
  {
    id: 1,
    name: "Computer Lab Alpha",
    description: "Modern computer lab with high-performance workstations for programming and design courses",
    facilityType: "COMPUTER_LAB",
    location: "Technology Building, Room 101",
    capacity: 35,
    status: "AVAILABLE",
    imageUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400",
    amenities: "40 Desktop Computers, Projector, Air Conditioning, WiFi, Printer Station",
    availableFrom: "08:00",
    availableTo: "22:00"
  },
  {
    id: 2,
    name: "Main Auditorium",
    description: "Large capacity auditorium for lectures, conferences, and university events",
    facilityType: "AUDITORIUM",
    location: "Central Campus Building, Ground Floor",
    capacity: 500,
    status: "AVAILABLE",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400",
    amenities: "Stage Lighting, Sound System, Wireless Microphones, Projection Screen, Wheelchair Access",
    availableFrom: "07:00",
    availableTo: "23:00"
  },
  {
    id: 3,
    name: "Executive Conference Room",
    description: "Premium meeting space for faculty meetings and executive discussions",
    facilityType: "CONFERENCE_ROOM",
    location: "Administration Building, Floor 3",
    capacity: 20,
    status: "AVAILABLE",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
    amenities: "Video Conferencing System, Whiteboard, Coffee Machine, High-Speed Internet, Presentation Equipment",
    availableFrom: "08:00",
    availableTo: "18:00"
  },
  {
    id: 4,
    name: "Sports Complex",
    description: "Multi-purpose sports facility for basketball, volleyball, and indoor activities",
    facilityType: "SPORTS_HALL",
    location: "Sports Center, Main Court",
    capacity: 200,
    status: "UNDER_MAINTENANCE",
    imageUrl: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=400",
    amenities: "Basketball Court, Bleachers, Scoreboard, Changing Rooms, Equipment Storage, Lockers",
    availableFrom: "06:00",
    availableTo: "22:00"
  },
  {
    id: 5,
    name: "Chemistry Research Lab",
    description: "Advanced laboratory equipped for organic chemistry research and experiments",
    facilityType: "LABORATORY",
    location: "Science Building, Lab Wing",
    capacity: 24,
    status: "AVAILABLE",
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400",
    amenities: "Lab Benches, fume hoods, Analytical Equipment, Safety Showers, Emergency Eyewash, Chemical Storage",
    availableFrom: "08:00",
    availableTo: "20:00"
  },
  {
    id: 6,
    name: "Quiet Study Pod A",
    description: "Individual study space designed for focused academic work",
    facilityType: "STUDY_ROOM",
    location: "Library Building, Study Area",
    capacity: 1,
    status: "AVAILABLE",
    imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400",
    amenities: "Desk, Ergonomic Chair, Reading Lamp, Power Outlets, WiFi, Lockable Storage",
    availableFrom: "06:00",
    availableTo: "02:00"
  },
  {
    id: 7,
    name: "Physics Laboratory",
    description: "Well-equipped physics lab for experiments and research activities",
    facilityType: "LABORATORY",
    location: "Science Building, Physics Wing",
    capacity: 30,
    status: "AVAILABLE",
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400",
    amenities: "Experiment Tables, Measurement Equipment, Oscilloscope, Power Supplies, Safety Equipment",
    availableFrom: "09:00",
    availableTo: "17:00"
  },
  {
    id: 8,
    name: "Student Lounge",
    description: "Casual space for student gatherings and informal meetings",
    facilityType: "OTHER",
    location: "Student Center, Lounge Area",
    capacity: 50,
    status: "AVAILABLE",
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400",
    amenities: "Comfortable Seating, Coffee Machines, Vending Machines, WiFi, TV Screens, Board Games",
    availableFrom: "07:00",
    availableTo: "23:00"
  }
];

export const FACILITY_TYPES = [
  { value: "CONFERENCE_ROOM", label: "Conference Room" },
  { value: "LABORATORY", label: "Laboratory" },
  { value: "SPORTS_HALL", label: "Sports Hall" },
  { value: "AUDITORIUM", label: "Auditorium" },
  { value: "STUDY_ROOM", label: "Study Room" },
  { value: "COMPUTER_LAB", label: "Computer Lab" },
  { value: "OTHER", label: "Other" }
];

export const FACILITY_STATUSES = [
  { value: "AVAILABLE", label: "Available" },
  { value: "UNDER_MAINTENANCE", label: "Under Maintenance" },
  { value: "UNAVAILABLE", label: "Unavailable" }
];