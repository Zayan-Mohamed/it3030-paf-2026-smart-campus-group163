import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Facility, FacilityType, FacilityStatus } from '../types';

const FACILITY_TYPE_OPTIONS: FacilityType[] = [
  'CONFERENCE_ROOM',
  'LABORATORY',
  'SPORTS_HALL',
  'AUDITORIUM',
  'STUDY_ROOM',
  'COMPUTER_LAB',
  'OTHER'
];

const FACILITY_STATUS_OPTIONS: FacilityStatus[] = [
  'AVAILABLE',
  'UNDER_MAINTENANCE',
  'UNAVAILABLE'
];

const FacilityList: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<FacilityType | ''>('');
  const [statusFilter, setStatusFilter] = useState<FacilityStatus | ''>('');
  const [minCapacityFilter, setMinCapacityFilter] = useState<number | ''>('');

  useEffect(() => {
    fetchFacilities();
  }, [nameFilter, locationFilter, typeFilter, statusFilter, minCapacityFilter]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();

      if (nameFilter) params.append('name', nameFilter);
      if (locationFilter) params.append('location', locationFilter);
      if (typeFilter) params.append('facilityType', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (minCapacityFilter !== '') params.append('minCapacity', minCapacityFilter.toString());

      const query = params.toString();
      const url = query
        ? `http://localhost:8080/api/facilities?${query}`
        : 'http://localhost:8080/api/facilities';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch facilities');
      }
      const data = await response.json();
      setFacilities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`http://localhost:8080/api/facilities/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete facility');
      }

      setFacilities((prev) => prev.filter((facility) => facility.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete facility');
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/dashboard/admin/facilities/${id}/edit`);
  };

  const handleAdd = () => {
    navigate('/dashboard/admin/facilities/new');
  };

  const clearFilters = () => {
    setNameFilter('');
    setLocationFilter('');
    setTypeFilter('');
    setStatusFilter('');
    setMinCapacityFilter('');
  };

  if (loading) {
    return <div className="loading">Loading facilities...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="facility-list">
      <div className="header">
        <h1>Facilities</h1>
        <button type="button" onClick={handleAdd} className="btn btn-primary">
          Add New Facility
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="filters">
        <div className="filter-row">
          <input
            type="text"
            placeholder="Search by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="filter-input"
          />
          <input
            type="text"
            placeholder="Search by location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="filter-input"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FacilityType | '')}
            className="filter-select"
          >
            <option value="">All Types</option>
            {FACILITY_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FacilityStatus | '')}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {FACILITY_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Min capacity..."
            value={minCapacityFilter}
            onChange={(e) => setMinCapacityFilter(e.target.value ? parseInt(e.target.value) : '')}
            className="filter-input"
            min="1"
          />
          <button onClick={clearFilters} className="btn btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Facilities Table */}
      <div className="table-container">
        <table className="facility-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Available Hours</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {facilities.map(facility => (
              <tr key={facility.id}>
                <td>
                  <Link to={`/facilities/${facility.id}`} className="facility-link">
                    {facility.name}
                  </Link>
                </td>
                <td>{facility.facilityType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</td>
                <td>{facility.location}</td>
                <td>{facility.capacity}</td>
                <td>
                  <span className={`status status-${facility.status.toLowerCase()}`}>
                    {facility.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </td>
                <td>{facility.availableFrom} - {facility.availableTo}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      type="button"
                      onClick={() => handleEdit(facility.id)}
                      className="btn btn-sm btn-secondary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(facility.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {facilities.length === 0 && (
          <div className="no-facilities">
            <p>No facilities found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityList;
