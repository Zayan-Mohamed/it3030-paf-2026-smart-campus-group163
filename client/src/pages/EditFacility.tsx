import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FACILITY_STATUSES, FACILITY_TYPES } from '../types';
import type { Facility, FacilityStatus, FacilityType } from '../types';

type FacilityFormData = {
  name: string;
  description: string;
  facilityType: FacilityType;
  location: string;
  capacity: number;
  status: FacilityStatus;
  imageUrl: string;
  amenities: string;
  availableFrom: string;
  availableTo: string;
};

const formatLabel = (value: string) =>
  value.replace('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

const EditFacilityPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);

  const [formData, setFormData] = useState<FacilityFormData>({
    name: '',
    description: '',
    facilityType: 'OTHER',
    location: '',
    capacity: 1,
    status: 'AVAILABLE',
    imageUrl: '',
    amenities: '',
    availableFrom: '08:00',
    availableTo: '18:00',
  });

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

      // Populate form with existing data
      setFormData({
        name: data.name,
        description: data.description || '',
        facilityType: data.facilityType,
        location: data.location,
        capacity: data.capacity,
        status: data.status,
        imageUrl: data.imageUrl || '',
        amenities: data.amenities || '',
        availableFrom: data.availableFrom,
        availableTo: data.availableTo,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load facility');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? (value ? parseInt(value) : '') : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError(null);

    // Validate availableFrom < availableTo
    if (formData.availableFrom >= formData.availableTo) {
      setError("Available To time must be after Available From time");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/facilities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || JSON.stringify(errorData.details) || 'Failed to update facility');
      }

      navigate('/facilities');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading facility...</div>;
  }

  if (error && !facility) {
    return <div className="error">Error: {error}</div>;
  }

  if (!facility) {
    return <div className="error">Facility not found</div>;
  }

  return (
    <div className="edit-facility">
      <div className="header">
        <h1>Edit Facility</h1>
        <button
          onClick={() => navigate('/facilities')}
          className="btn btn-secondary"
        >
          Back to Facilities
        </button>
      </div>

      <form onSubmit={handleSubmit} className="facility-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            maxLength={255}
            rows={3}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="facilityType">Type *</label>
            <select
              id="facilityType"
              name="facilityType"
              value={formData.facilityType}
              onChange={handleInputChange}
              required
            >
              {FACILITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
            >
              {FACILITY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="capacity">Capacity *</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleInputChange}
              required
              min={1}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="availableFrom">Available From *</label>
            <input
              type="time"
              id="availableFrom"
              name="availableFrom"
              value={formData.availableFrom}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="availableTo">Available To *</label>
            <input
              type="time"
              id="availableTo"
              name="availableTo"
              value={formData.availableTo}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="imageUrl">Image URL</label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            maxLength={255}
          />
        </div>

        <div className="form-group">
          <label htmlFor="amenities">Amenities</label>
          <textarea
            id="amenities"
            name="amenities"
            value={formData.amenities}
            onChange={handleInputChange}
            maxLength={255}
            rows={2}
            placeholder="Comma-separated list of amenities (e.g., WiFi, Projector, Whiteboard)"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/facilities')}
            className="btn btn-secondary"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Update Facility'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditFacilityPage;
