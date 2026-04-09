import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getFacilityById, deleteFacility } from '../services/facilityService';
import { FACILITY_TYPES, FACILITY_STATUSES } from '../data/mockFacilities';

const FacilityDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [facility, setFacility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFacility = async () => {
      try {
        const facilityData = await getFacilityById(id);
        setFacility(facilityData);
      } catch (err) {
        setError('Failed to load facility. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFacility();
  }, [id]);

  const handleEdit = () => {
    navigate(`/facilities/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this facility? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteFacility(id);
      navigate('/facilities');
    } catch (err) {
      setError(err.message || 'Failed to delete facility. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'status-badge status-available';
      case 'MAINTENANCE':
        return 'status-badge status-maintenance';
      case 'OUT_OF_ORDER':
        return 'status-badge status-out-of-order';
      default:
        return 'status-badge';
    }
  };

  const getFacilityTypeLabel = (type) => {
    const facilityType = FACILITY_TYPES.find(t => t.value === type);
    return facilityType ? facilityType.label : type;
  };

  const getStatusLabel = (status) => {
    const facilityStatus = FACILITY_STATUSES.find(s => s.value === status);
    return facilityStatus ? facilityStatus.label : status;
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading facility details...</p>
        </div>
      </div>
    );
  }

  if (error && !facility) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Facility Details</h1>
        </div>
        <div className="page-content">
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => navigate('/facilities')}
            className="btn btn-secondary"
          >
            Back to Facilities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>{facility.name}</h1>
            <p className="facility-subtitle">{getFacilityTypeLabel(facility.facilityType)}</p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => navigate('/facilities')}
              className="btn btn-secondary"
            >
              Back to Facilities
            </button>
            <button
              onClick={handleEdit}
              className="btn btn-primary"
            >
              Edit Facility
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Facility'}
            </button>
          </div>
        </div>
      </div>

      <div className="page-content">
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="facility-details">
          <div className="details-grid">
            <div className="detail-card">
              <h3>Basic Information</h3>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{facility.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{getFacilityTypeLabel(facility.facilityType)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{facility.location}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Capacity:</span>
                <span className="detail-value">{facility.capacity} people</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`detail-value ${getStatusBadgeClass(facility.status)}`}>
                  {getStatusLabel(facility.status)}
                </span>
              </div>
            </div>

            <div className="detail-card">
              <h3>Availability</h3>
              <div className="detail-row">
                <span className="detail-label">Available From:</span>
                <span className="detail-value">{facility.availableFrom}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Available To:</span>
                <span className="detail-value">{facility.availableTo}</span>
              </div>
            </div>

            {facility.description && (
              <div className="detail-card full-width">
                <h3>Description</h3>
                <p className="facility-description">{facility.description}</p>
              </div>
            )}

            {facility.amenities && (
              <div className="detail-card full-width">
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

            {facility.imageUrl && (
              <div className="detail-card full-width">
                <h3>Image</h3>
                <div className="facility-image">
                  <img
                    src={facility.imageUrl}
                    alt={facility.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDetailsPage;