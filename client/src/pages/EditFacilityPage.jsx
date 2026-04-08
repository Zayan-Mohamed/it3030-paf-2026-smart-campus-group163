import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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

const statuses = [
  "AVAILABLE",
  "UNDER_MAINTENANCE",
  "UNAVAILABLE",
  "ACTIVE",
  "OUT_OF_SERVICE"
];

const EditFacilityPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    facilityType: "",
    location: "",
    capacity: "",
    status: "",
    imageUrl: "",
    amenities: "",
    availableFrom: "",
    availableTo: ""
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFacility = async () => {
      if (!id) {
        setError("Facility ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`http://localhost:8080/api/facilities/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch facility");
        }

        const facility = await response.json();

        setFormData({
          name: facility.name || "",
          description: facility.description || "",
          facilityType: facility.facilityType || "",
          location: facility.location || "",
          capacity: facility.capacity != null ? String(facility.capacity) : "",
          status: facility.status || "",
          imageUrl: facility.imageUrl || "",
          amenities: facility.amenities || "",
          availableFrom: facility.availableFrom || "",
          availableTo: facility.availableTo || ""
        });
      } catch (err) {
        setError(err?.message || "Failed to load facility");
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateAvailability = () => {
    if (!formData.availableFrom || !formData.availableTo) {
      return true;
    }

    return formData.availableFrom < formData.availableTo;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!id) {
      setError("Facility ID is required");
      return;
    }

    setError("");

    if (!validateAvailability()) {
      setError("availableFrom must be before availableTo");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        capacity: Number(formData.capacity)
      };

      const response = await fetch(`http://localhost:8080/api/facilities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to update facility");
      }

      navigate("/facilities");
    } catch (err) {
      setError(err?.message || "Failed to update facility");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading facility...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1>Edit Facility</h1>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="facilityType">Facility Type</label>
          <select
            id="facilityType"
            name="facilityType"
            value={formData.facilityType}
            onChange={handleChange}
            required
          >
            <option value="">Select type</option>
            {facilityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="capacity">Capacity</label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange} required>
            <option value="">Select status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="imageUrl">Image URL</label>
          <input id="imageUrl" name="imageUrl" type="text" value={formData.imageUrl} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="amenities">Amenities</label>
          <input id="amenities" name="amenities" type="text" value={formData.amenities} onChange={handleChange} />
        </div>

        <div>
          <label htmlFor="availableFrom">Available From</label>
          <input
            id="availableFrom"
            name="availableFrom"
            type="time"
            value={formData.availableFrom}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="availableTo">Available To</label>
          <input
            id="availableTo"
            name="availableTo"
            type="time"
            value={formData.availableTo}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Updating..." : "Update Facility"}
        </button>
      </form>
    </div>
  );
};

export default EditFacilityPage;
