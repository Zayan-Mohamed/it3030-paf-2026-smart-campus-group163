import React from "react";

const FacilityTable = ({ facilities, onEdit, onDelete }) => {
  if (!facilities || facilities.length === 0) {
    return (
      <div className="facility-table-container">
        No facilities found
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'status-badge status-available';
      case 'UNDER_MAINTENANCE':
        return 'status-badge status-maintenance';
      case 'UNAVAILABLE':
        return 'status-badge status-unavailable';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="facility-table-container">
      <table className="facility-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Location</th>
            <th>Capacity</th>
            <th>Status</th>
            <th>Available Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {facilities.map(facility => (
            <tr key={facility.id}>
              <td>{facility.name}</td>
              <td>{facility.facilityType}</td>
              <td>{facility.location}</td>
              <td>{facility.capacity}</td>
              <td>
                <span className={getStatusBadgeClass(facility.status)}>
                  {facility.status}
                </span>
              </td>
              <td>{facility.availableFrom} - {facility.availableTo}</td>
              <td>
                <button type="button" onClick={() => onEdit(facility.id)} className="btn btn-edit">
                  Edit
                </button>
                <button type="button" onClick={() => onDelete(facility.id)} className="btn btn-delete">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FacilityTable;
