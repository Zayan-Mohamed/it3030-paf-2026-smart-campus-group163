import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FacilityFilterBar from '../components/facilities/FacilityFilterBar';
import FacilityTable from '../components/facilities/FacilityTable';
import { getFacilities } from '../services/facilityService';

const FacilitiesPage = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    facilityType: '',
    status: '',
    location: ''
  });

  useEffect(() => {
    loadFacilities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [facilities, filters]);

  const loadFacilities = async () => {
    setIsLoading(true);
    setError('');

    try {
      const facilitiesData = await getFacilities();
      setFacilities(facilitiesData);
    } catch (err) {
      setError('Failed to load facilities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...facilities];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(facility =>
        facility.name.toLowerCase().includes(searchLower) ||
        facility.location.toLowerCase().includes(searchLower) ||
        facility.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.facilityType) {
      filtered = filtered.filter(facility => facility.facilityType === filters.facilityType);
    }

    if (filters.status) {
      filtered = filtered.filter(facility => facility.status === filters.status);
    }

    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(facility =>
        facility.location.toLowerCase().includes(locationLower)
      );
    }

    setFilteredFacilities(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleAddFacility = () => {
    navigate('/facilities/add');
  };

  const handleViewFacility = (facilityId) => {
    navigate(`/facilities/${facilityId}`);
  };

  const handleEditFacility = (facilityId) => {
    navigate(`/facilities/${facilityId}/edit`);
  };

  const handleDeleteFacility = async (facilityId) => {
    try {
      // The delete logic will be handled in the FacilityTable component
      await loadFacilities(); // Refresh the list after deletion
    } catch (err) {
      setError('Failed to delete facility. Please try again.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>Facilities Management</h1>
            <p>Manage campus facilities and their availability</p>
          </div>
          <button
            onClick={handleAddFacility}
            className="btn btn-primary"
          >
            Add New Facility
          </button>
        </div>
      </div>

      <div className="page-content">
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
            <button
              onClick={loadFacilities}
              className="alert-action"
            >
              Retry
            </button>
          </div>
        )}

        <FacilityFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <div className="facilities-table-container">
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading facilities...</p>
            </div>
          ) : (
            <FacilityTable
              facilities={filteredFacilities}
              onView={handleViewFacility}
              onEdit={handleEditFacility}
              onDelete={handleDeleteFacility}
            />
          )}
        </div>

        {!isLoading && filteredFacilities.length === 0 && facilities.length > 0 && (
          <div className="no-results">
            <p>No facilities match your current filters.</p>
            <button
              onClick={() => setFilters({ search: '', facilityType: '', status: '', location: '' })}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        )}

        {!isLoading && facilities.length === 0 && (
          <div className="empty-state">
            <h3>No facilities found</h3>
            <p>Get started by adding your first facility.</p>
            <button
              onClick={handleAddFacility}
              className="btn btn-primary"
            >
              Add New Facility
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilitiesPage;