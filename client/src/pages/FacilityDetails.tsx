import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { Facility } from '../types';

const FacilityDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchFacility();
    }
  }, [id]);

  const fetchFacility = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/facilities/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch facility');
      }
      const data: Facility = await response.json();
      setFacility(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load facility');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'status-available';
      case 'UNDER_MAINTENANCE':
        return 'status-maintenance';
      case 'UNAVAILABLE':
        return 'status-unavailable';
      default:
        return 'status-default';
    }
  };

  if (loading) {
    return <div className="loading">Loading facility details...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!facility) {
    return <div className="error">Facility not found</div>;
  }

  return (
    <div className="facility-details">
      <div className="header">
        <h1>{facility.name}</h1>
        <div className="header-actions">
          <Link to={`/facilities/${facility.id}/edit`} className="btn btn-secondary">
            Edit Facility
          </Link>
          <button
            onClick={() => navigate('/facilities')}
            className="btn btn-secondary"
          >
            Back to Facilities
          </button>
        </div>
      </div>

      <div className="facility-content">
        <div className="facility-image-section">
          {facility.imageUrl ? (
            <img
              src={facility.imageUrl}
              alt={facility.name}
              className="facility-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="no-image">
              <span>No image available</span>
            </div>
          )}
        </div>

        <div className="facility-info">
          <div className="info-section">
            <h3>Basic Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Type:</label>
                <span>{facility.facilityType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
              </div>
              <div className="info-item">
                <label>Location:</label>
                <span>{facility.location}</span>
              </div>
              <div className="info-item">
                <label>Capacity:</label>
                <span>{facility.capacity} people</span>
              </div>
              <div className="info-item">
                <label>Status:</label>
                <span className={`status ${getStatusColor(facility.status)}`}>
                  {facility.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3>Availability</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Available From:</label>
                <span>{formatTime(facility.availableFrom)}</span>
              </div>
              <div className="info-item">
                <label>Available To:</label>
                <span>{formatTime(facility.availableTo)}</span>
              </div>
            </div>
          </div>

          {facility.description && (
            <div className="info-section">
              <h3>Description</h3>
              <p className="description">{facility.description}</p>
            </div>
          )}

          {facility.amenities && (
            <div className="info-section">
              <h3>Amenities</h3>
              <div className="amenities-list">
                {facility.amenities.split(',').map((amenity, index) => (
                  <span key={index} className="amenity-tag">
                    {amenity.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="info-section">
            <h3>Timestamps</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Created:</label>
                <span>{formatDateTime(facility.createdAt)}</span>
              </div>
              <div className="info-item">
                <label>Last Updated:</label>
                <span>{formatDateTime(facility.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetails;
