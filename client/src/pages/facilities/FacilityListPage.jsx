import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const initialFilters = {
  name: "",
  location: "",
  facilityType: "",
  status: "",
  minCapacity: ""
};

const facilityTypes = [
  "CONFERENCE_ROOM",
  "LABORATORY",
  "SPORTS_HALL",
  "AUDITORIUM",
  "STUDY_ROOM",
  "COMPUTER_LAB",
  "PROJECTOR",
  "CAMERA",
  "MEETING_ROOM",
  "LECTURE_HALL",
  "OTHER"
];

const facilityStatuses = [
  "AVAILABLE",
  "UNDER_MAINTENANCE",
  "UNAVAILABLE",
  "ACTIVE",
  "OUT_OF_SERVICE"
];

const FacilityListPage = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(initialFilters);

  const fetchFacilities = async (appliedFilters = initialFilters) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (appliedFilters.name.trim()) {
        params.set("name", appliedFilters.name.trim());
      }
      if (appliedFilters.location.trim()) {
        params.set("location", appliedFilters.location.trim());
      }
      if (appliedFilters.facilityType) {
        params.set("facilityType", appliedFilters.facilityType);
      }
      if (appliedFilters.status) {
        params.set("status", appliedFilters.status);
      }
      if (appliedFilters.minCapacity !== "") {
        params.set("minCapacity", appliedFilters.minCapacity);
      }

      const queryString = params.toString();
      const url = queryString
        ? `http://localhost:8080/api/facilities?${queryString}`
        : "http://localhost:8080/api/facilities";

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch facilities");
      }

      const data = await response.json();
      setFacilities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to fetch facilities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    fetchFacilities(filters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    fetchFacilities(initialFilters);
  };

  const handleEdit = (id) => {
    navigate(`/facilities/${id}/edit`);
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this facility?");
    if (!isConfirmed) {
      return;
    }

    try {
      setError("");
      const response = await fetch(`http://localhost:8080/api/facilities/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to delete facility");
      }

      setFacilities((prev) => prev.filter((facility) => facility.id !== id));
    } catch (err) {
      setError(err?.message || "Failed to delete facility");
    }
  };

  return (
    <div className="page-container">
      <h1>Facilities & Assets</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={filters.name}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={filters.location}
          onChange={handleFilterChange}
        />
        <select name="facilityType" value={filters.facilityType} onChange={handleFilterChange}>
          <option value="">All Types</option>
          {facilityTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Statuses</option>
          {facilityStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          name="minCapacity"
          placeholder="Min Capacity"
          value={filters.minCapacity}
          onChange={handleFilterChange}
        />
        <button type="submit">Search</button>
        <button type="button" onClick={handleReset}>
          Reset
        </button>
      </form>

      {loading && <p>Loading facilities...</p>}

      {!loading && error && <p>{error}</p>}

      {!loading && !error && facilities.length === 0 && <p>No facilities found</p>}

      {!loading && !error && facilities.length > 0 && (
        <table>
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
            {facilities.map((facility) => (
              <tr key={facility.id}>
                <td>{facility.name}</td>
                <td>{facility.facilityType}</td>
                <td>{facility.location}</td>
                <td>{facility.capacity}</td>
                <td>{facility.status}</td>
                <td>{`${facility.availableFrom || "-"} - ${facility.availableTo || "-"}`}</td>
                <td>
                  <button type="button" onClick={() => handleEdit(facility.id)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(facility.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FacilityListPage;
