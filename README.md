# Smart Campus Operations Hub

[![API CI](https://github.com/Zayan-Mohamed/it3030-paf-2026-smart-campus-core/actions/workflows/ci-api.yml/badge.svg)](https://github.com/Zayan-Mohamed/it3030-paf-2026-smart-campus-core/actions/workflows/ci-api.yml)
[![Client CI](https://github.com/Zayan-Mohamed/it3030-paf-2026-smart-campus-core/actions/workflows/ci-client.yml/badge.svg)](https://github.com/Zayan-Mohamed/it3030-paf-2026-smart-campus-core/actions/workflows/ci-client.yml)
[![Java](https://img.shields.io/badge/Java-21-blue?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.4-brightgreen?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135.3-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**IT3030 - Programming Applications and Frameworks (2026 - Year 3, Semester 2)**

A comprehensive web platform designed to modernize day-to-day operations of modern universities by centralizing facility booking, incident management, campus events, and AI-powered services.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Team Contribution](#team-contribution)
- [License](#license)

---

## Overview

The Smart Campus Operations Hub serves as a unified system to manage:
- Facility and asset bookings with conflict prevention
- Maintenance and incident ticketing with image attachments
- Campus events with Looking for Group (LFG) functionality
- Interactive campus map with real-time availability
- AI-powered booking concierge and maintenance triage
- Role-based dashboards with analytics and audit logging

## Technology Stack

### Backend API
- **Java 21** with **Spring Boot 4.0.4**
- **Spring Data JPA** with PostgreSQL
- **Spring Security** with OAuth 2.0 and JWT
- **Spring WebSocket** for real-time notifications
- **Lombok** for reducing boilerplate code
- **JJWT** for JWT token management
- **Supabase** for file storage

### Frontend Client
- **React 19** with **TypeScript 5.9**
- **Vite** for build tooling
- **Tailwind CSS** with **shadcn/ui** components
- **React Router DOM** for routing
- **React Hook Form** for form handling
- **Mapbox GL JS** for interactive campus map
- **Recharts** for analytics visualization
- **STOMP.js** for WebSocket communication

### AI Service
- **Python 3.11+** with **FastAPI**
- **LangGraph** for AI agent workflows
- **Groq LLM** for language model capabilities
- **FAISS** vector store for RAG pipeline
- **HuggingFace** embeddings
- **Redis** for approval workflow state

---

## Project Structure

```
it3030-paf-2026-smart-campus-core/
├── api/                    # Spring Boot Backend API
│   ├── src/main/java/com/smartcampus/api/
│   │   ├── controller/     # REST controllers (12 controllers)
│   │   ├── service/       # Business logic (14 services)
│   │   ├── repository/    # JPA repositories (11 repositories)
│   │   ├── model/         # JPA entities
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── security/      # JWT & OAuth2 security config
│   │   ├── exception/    # Global exception handling
│   │   └── event/         # Application events
│   ├── src/main/resources/
│   │   ├── db/migration/  # SQL migration files
│   │   └── application.yml
│   └── pom.xml
├── client/                 # React TypeScript Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (26+ pages)
│   │   ├── contexts/      # React contexts (Auth, Notifications)
│   │   ├── services/      # API service layers
│   │   ├── types/         # TypeScript interfaces
│   │   ├── layouts/       # Layout components
│   │   └── data/          # GeoJSON campus data
│   └── package.json
├── ai-service/            # Python FastAPI AI Service
│   ├── main.py           # FastAPI application
│   ├── utils/            # Utility functions
│   ├── campus_kb.txt     # Campus knowledge base
│   └── pyproject.toml
├── docs/                  # Documentation
│   ├── IT3030_PAF_Assignment_2026_Report.md
│   ├── RBAC_IMPLEMENTATION_SUMMARY.md
│   ├── BRUNO_TESTING_GUIDE_COMPLETE.md
│   └── ...
└── .github/               # GitHub Actions CI/CD
    └── workflows/
        ├── ci-api.yml
        └── ci-client.yml
```

---

## Core Modules

### Module A - Facilities & Assets Catalogue
- Catalog of bookable resources (lecture halls, labs, meeting rooms, equipment)
- Metadata management: type, capacity, location, status, amenities
- Facility categories: `LECTURE_HALL`, `LABORATORY`, `MEETING_ROOM`, `STUDY_AREA`, `EQUIPMENT`, `OTHER`

### Module B - Booking Management
- Booking workflow with conflict prevention
- Status workflow: `PENDING` → `APPROVED`/`REJECTED` → `CANCELLED`/`COMPLETED`
- Calendar view for visualizing bookings
- Admin approval/rejection with reasons

### Module C - Maintenance & Incident Ticketing
- Incident tickets with up to 3 image attachments via Supabase
- Ticket workflow: `OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`/`REJECTED`
- Priority levels: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- Categories: `ELECTRICAL`, `PLUMBING`, `HVAC`, `CLEANING`, `SECURITY`, `IT_NETWORK`, `FURNITURE`, `OTHER`
- Secure commenting system

### Module D - Notifications
- Real-time in-app notifications via WebSocket
- Notification types: `BOOKING_UPDATE`, `TICKET_UPDATE`, `NEW_COMMENT`
- Read/unread tracking with notification bell

### Module E - Authentication & Authorization
- Google OAuth 2.0 login with JWT session management
- OTP email verification for signup
- Role-Based Access Control (RBAC): `STUDENT`, `STAFF`, `ADMIN`
- Protected routes with role-based redirects

### Module F - AI Service
- **Booking Concierge**: Conversational AI for natural language booking requests
- **Maintenance Triage**: Automated categorization with severity assessment
- **Approval Workflow**: Human-in-the-loop LangGraph workflow for restricted assets
- **RAG Chat**: Retrieval-Augmented Generation with FAISS vector store

### Module G - Campus Events
- Event types: `SEMESTER_PROJECT`, `FINAL_YEAR_PROJECT`, `HACKATHON`, `WORKSHOP`, `SOCIAL`, `OTHER`
- Looking for Group (LFG) functionality with squad creation
- Squad management with member approval workflow
- Target filters: year, semester, major

### Module H - Campus Map
- Interactive map using Mapbox GL JS with GeoJSON data
- Color-coded facilities: Green (available), Orange (booked), Red (maintenance)
- Real-time integration with database for availability status
- Navigation controls and geolocation

### Module I - Analytics & Audit
- Role-based dashboards: Admin, Staff, Student
- Analytics for booking trends and incident statistics
- Comprehensive audit logging for sensitive operations (AOP-based)
- User management with role assignment

---

## Getting Started

### Prerequisites
- Java 21+
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Redis (for AI service approval workflow)
- Supabase account (for file storage)
- Google OAuth 2.0 credentials
- Groq API key (for AI service)

### Backend API Setup

```bash
cd api
cp .env.example .env
# Edit .env with your configuration
./mvnw spring-boot:run
```

### Frontend Client Setup

```bash
cd client
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

### AI Service Setup

```bash
cd ai-service
cp .env.example .env
# Edit .env with your configuration
poetry install  # or pip install -r requirements.txt
poetry run uvicorn main:app --reload
```

---

## Environment Configuration

### Backend API (api/.env)
```env
DATABASE_URL=jdbc:postgresql://localhost:5432/smartcampus
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### Frontend Client (client/.env)
```env
VITE_API_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### AI Service (ai-service/.env)
```env
GROQ_API_KEY=your_groq_api_key
SPRING_BOOT_API_URL=http://localhost:8080
REDIS_URL=redis://localhost:6379
```

---

## API Endpoints

### Facilities
- `GET /api/facilities` - List all facilities (with filters)
- `GET /api/facilities/{id}` - Get facility details
- `POST /api/facilities` - Create facility (Admin/Staff)
- `PUT /api/facilities/{id}` - Update facility (Admin/Staff)
- `DELETE /api/facilities/{id}` - Delete facility (Admin)

### Bookings
- `GET /api/bookings` - List bookings (role-filtered)
- `POST /api/bookings` - Request booking
- `GET /api/bookings/{id}` - Get booking details
- `PATCH /api/bookings/{id}/status` - Approve/Reject/Cancel
- `DELETE /api/bookings/{id}` - Cancel booking
- `GET /api/bookings/check-conflicts` - Check conflicts

### Campus Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `GET /api/events/{id}` - Get event details
- `PUT /api/events/{id}` - Update event
- `DELETE /api/events/{id}` - Delete event
- `GET /api/events/{id}/squads` - Get event squads
- `POST /api/events/{id}/squads` - Create squad
- `POST /api/events/{id}/squads/{squadId}/join` - Join squad
- `POST /api/events/{id}/squads/{squadId}/approve/{userId}` - Approve member

### Incidents
- `GET /api/incidents` - List incidents (role-filtered)
- `POST /api/incidents` - Create incident (multipart/form-data)
- `GET /api/incidents/{id}` - Get incident details
- `PATCH /api/incidents/{id}/status` - Update status
- `POST /api/incidents/{id}/comments` - Add comment
- `DELETE /api/incidents/{id}` - Delete incident

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{id}/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- WebSocket: `/topic/notifications/{userId}`

### Authentication
- `POST /api/auth/oauth/google` - Google OAuth exchange
- `POST /api/auth/signup` - Register with OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/users/me` - Get current user
- `GET /api/users` - List all users (Admin)
- `PUT /api/users/{id}/role` - Update role (Admin)

### Analytics & Audit
- `GET /api/analytics/admin` - Admin analytics
- `GET /api/analytics/staff` - Staff analytics
- `GET /api/analytics/student` - Student analytics
- `GET /api/audit-logs` - List audit logs (Admin)

### AI Service Endpoints
- `POST /api/chat/booking` - Booking Concierge
- `POST /api/triage` - Maintenance triage
- `POST /api/approval/request` - Request approval
- `POST /api/approval/resume` - Resume approval workflow
- `POST /api/chat/rag` - RAG knowledge chat

---

## Testing

### Backend Testing
- **Unit Tests**: JUnit 5 + Mockito for service layer testing
- **API Tests**: Bruno/Postman collections for endpoint testing
- **Testcontainers**: PostgreSQL container for integration tests

### Frontend Testing
- TypeScript type checking
- ESLint for code quality
- Functional testing of components and workflows

### AI Service Testing
- LangGraph workflow testing
- RAG pipeline validation
- API integration testing

### CI/CD Pipeline
- GitHub Actions for automated builds
- Separate workflows for API and Client
- Runs on push/PR to main branch

---

## Team Contribution

| IT Number | Name | Modules | Key Responsibilities |
|-----------|------|----------|---------------------|
| IT23248212 | Zayan Mohamed | E, D, F, G, H, I, J | Authentication & OAuth 2.0, RBAC & User Management, Real-time Notifications, Campus Events & LFG Squads, Interactive Campus Map, CampusBot AI Assistant, Admin Analytics, Audit Logs |
| IT23189676 | Withana N.K. | B | Booking Workflow & Conflict Checking, Calendar View, Booking Status Management |
| IT23218994 | Athuraliya D.S | A | Facilities & Assets Catalogue, Resource Management, Amenities Management |
| IT23213708 | S.I.C Senevirathne | C | Maintenance & Incident Ticketing, Image Attachments via Supabase, Priority/Category Management, AI-powered Triage |

---

## Security Features

- **OWASP Top 10** compliance
- **JWT** tokens with secure handling
- **OAuth 2.0** with Google authentication
- **RBAC** with default-deny posture
- **Input validation** with Jakarta validation constraints
- **SQL injection** prevention via JPA parameterized queries
- **XSS protection** via React's default escaping
- **File upload** validation (MIME type, size limits, path traversal prevention)
- **Environment variables** for all secrets (no hardcoded credentials)
- **Audit logging** for sensitive operations

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Course Information

**Course**: IT3030 - Programming Applications and Frameworks  
**Semester**: 2026 - Year 3, Semester 2  
**Institution**: _Sri Lanka Institute of Information Technology_  
**Project Type**: Group Coursework

---

## Documentation

For detailed documentation, see the [docs](docs/) folder:
- [IT3030 PAF Assignment Report](docs/IT3030_PAF_Assignment_2026_Report.md)
- [RBAC Implementation Summary](docs/RBAC_IMPLEMENTATION_SUMMARY.md)
- [Bruno Testing Guide](docs/BRUNO_TESTING_GUIDE_COMPLETE.md)
- [Auth Setup Guide](docs/AUTH_SETUP.md)
- [Supabase Storage Setup](docs/SUPABASE_STORAGE_SETUP.md)

---

## Acknowledgments

- Spring Boot and Spring Ecosystem
- React and TypeScript communities
- LangChain and LangGraph teams
- Mapbox for mapping solutions
- Supabase for storage and backend services
