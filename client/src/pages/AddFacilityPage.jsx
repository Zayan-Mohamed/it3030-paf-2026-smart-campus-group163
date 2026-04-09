import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacilityForm from '../components/facilities/FacilityForm';
import { createFacility } from '../services/facilityService';

const AddFacilityPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateFormData = (data) => {
    if (!data?.name?.trim()) {
      return 'Name is required';
    }
    if (!data?.facilityType) {
      return 'Facility type is required';
    }
    if (!data?.location?.trim()) {
      return 'Location is required';
    }
    if (!data?.status) {
      return 'Status is required';
    }
    if (!data?.availableFrom || !data?.availableTo) {
      return 'Available from and available to times are required';
    }

    const capacity = Number(data.capacity);
    if (!Number.isFinite(capacity) || capacity < 1) {
      return 'Capacity must be at least 1';
    }

    if (data.availableFrom >= data.availableTo) {
      return 'Available from time must be earlier than available to time';
    }

    return null;
  };

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setError('');

    const validationError = validateFormData(formData);
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      await createFacility(formData);
      navigate('/dashboard/admin/facilities');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create facility');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/admin/facilities');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Add New Facility</h1>
        <p>Create a new facility for the campus</p>
      </div>

      <div className="page-content">
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">??</span>
            <span>{error}</span>
          </div>
        )}

        <div className="form-card">
          <FacilityForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            submitLabel="Create Facility"
          />
        </div>
      </div>
    </div>
  );
};

export default AddFacilityPage;
