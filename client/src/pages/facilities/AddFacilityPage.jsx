import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const initialFormData = {
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

const statuses = [
  "AVAILABLE",
  "UNDER_MAINTENANCE",
  "UNAVAILABLE",
  "ACTIVE",
  "OUT_OF_SERVICE"
];

const AddFacilityPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    setError("");
    setSuccessMessage("");

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

      const response = await fetch("http://localhost:8080/api/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create facility");
      }

      setSuccessMessage("Facility created successfully");
      setFormData(initialFormData);

      setTimeout(() => {
        navigate("/facilities");
      }, 1000);
    } catch (err) {
      setError(err?.message || "Failed to create facility");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <h1>Add Facility</h1>

      {error && <p className="error-message">{error}</p>}
      {successMessage && <p className="success-message">{successMessage}</p>}

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
          {submitting ? "Creating..." : "Create Facility"}
        </button>
      </form>
    </div>
  );
};

export default AddFacilityPage;
