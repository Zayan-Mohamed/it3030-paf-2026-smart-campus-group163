import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Facility = {
  id: number;
  name: string;
  facilityType: string;
  location: string;
  capacity: number;
  status: string;
  availableFrom?: string;
  availableTo?: string;
};

const FacilityListPage: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchFacilities = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:8080/api/facilities");
      if (!response.ok) {
        throw new Error("Failed to fetch facilities");
      }

      const data = await response.json();
      setFacilities(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch facilities");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFacilities();
  }, []);

  const handleEdit = (id: number): void => {
    navigate(`/facilities/${id}/edit`);
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:8080/api/facilities/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete facility");
      }

      setFacilities((prev) => prev.filter((facility) => facility.id !== id));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete facility");
      }
    }
  };

  return (
    <div className="page-container">
      <h1>Facilities & Assets</h1>

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
                  <button type="button" onClick={() => void handleDelete(facility.id)}>
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
