import React from "react";

const FacilityFilterBar = ({ filters, onChange, onReset }) => {
  const handleFieldChange = (field, value) => {
    onChange(field, value);
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          value={filters.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-group">
        <label htmlFor="location">Location</label>
        <input
          type="text"
          id="location"
          value={filters.location}
          onChange={(e) => handleFieldChange("location", e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-group">
        <label htmlFor="facilityType">Facility Type</label>
        <select
          id="facilityType"
          value={filters.facilityType}
          onChange={(e) => handleFieldChange("facilityType", e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="CONFERENCE_ROOM">CONFERENCE_ROOM</option>
          <option value="LABORATORY">LABORATORY</option>
          <option value="SPORTS_HALL">SPORTS_HALL</option>
          <option value="AUDITORIUM">AUDITORIUM</option>
          <option value="STUDY_ROOM">STUDY_ROOM</option>
          <option value="COMPUTER_LAB">COMPUTER_LAB</option>
          <option value="OTHER">OTHER</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={filters.status}
          onChange={(e) => handleFieldChange("status", e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
          <option value="UNAVAILABLE">UNAVAILABLE</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="minCapacity">Min Capacity</label>
        <input
          type="number"
          id="minCapacity"
          value={filters.minCapacity}
          onChange={(e) => handleFieldChange("minCapacity", e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="filter-actions">
        <button onClick={onReset} className="btn btn-secondary">
          Reset
        </button>
      </div>
    </div>
  );
};

export default FacilityFilterBar;