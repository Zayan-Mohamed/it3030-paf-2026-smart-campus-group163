import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddFacilityPage.css";

const initialFormData = {
  name: "",
  description: "",
  facilityType: "",
  location: "",
  capacity: "",
  status: "",
  imageUrl: "",
  amenities: "",
  availableFrom: "08:00",
  availableTo: "17:00"
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
  const [submitting, setSubmitting] = useState(false);

  const normalizeTimeForApi = (timeValue) => {
    if (!timeValue) {
      return timeValue;
    }
    return /^\d{2}:\d{2}$/.test(timeValue) ? `${timeValue}:00` : timeValue;
  };

  const getBackendErrorMessage = async (response, fallbackMessage) => {
    const errorData = await response.json().catch(() => null);
    if (!errorData) {
      return fallbackMessage;
    }

    if (typeof errorData.message === "string" && errorData.message.trim()) {
      return errorData.message;
    }

    if (errorData.details && typeof errorData.details === "object") {
      const detailMessage = Object.values(errorData.details).find(
        (value) => typeof value === "string" && value.trim()
      );
      if (detailMessage) {
        return detailMessage;
      }
    }

    return fallbackMessage;
  };

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

  const validateRequiredFields = () => {
    if (!formData.name.trim()) {
      return "Name is required";
    }
    if (!formData.facilityType) {
      return "Facility Type is required";
    }
    if (!formData.location.trim()) {
      return "Location is required";
    }
    if (!formData.status) {
      return "Status is required";
    }
    if (!formData.availableFrom || !formData.availableTo) {
      return "Available From and Available To are required";
    }

    const parsedCapacity = Number(formData.capacity);
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      return "Capacity must be at least 1";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const requiredValidationError = validateRequiredFields();
    if (requiredValidationError) {
      setError(requiredValidationError);
      return;
    }

    if (!validateAvailability()) {
      setError("Available From time must be before Available To time");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        facilityType: formData.facilityType,
        location: formData.location.trim(),
        capacity: Number(formData.capacity),
        status: formData.status,
        imageUrl: formData.imageUrl.trim(),
        amenities: formData.amenities.trim(),
        availableFrom: normalizeTimeForApi(formData.availableFrom),
        availableTo: normalizeTimeForApi(formData.availableTo)
      };

      const response = await fetch("http://localhost:8080/api/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await getBackendErrorMessage(response, "Failed to create facility"));
      }

      navigate("/dashboard/admin/facilities");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create facility");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-facility-page">
      <div className="add-facility-card">
        <h1 className="add-facility-title">Add Facility</h1>

        {error && <div className="add-facility-error">{error}</div>}

        <form onSubmit={handleSubmit} className="add-facility-form">
          <div className="add-facility-grid two-col">
            <div className="form-field">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-field">
              <label htmlFor="facilityType">Facility Type</label>
              <select id="facilityType" name="facilityType" value={formData.facilityType} onChange={handleChange} required>
                <option value="">Select type</option>
                {facilityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field full-row">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} />
          </div>

          <div className="add-facility-grid two-col">
            <div className="form-field">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} required />
            </div>

            <div className="form-field">
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
          </div>

          <div className="add-facility-grid two-col">
            <div className="form-field">
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

            <div className="form-field">
              <label htmlFor="imageUrl">Image URL</label>
              <input id="imageUrl" name="imageUrl" type="text" value={formData.imageUrl} onChange={handleChange} />
            </div>
          </div>

          <div className="form-field full-row">
            <label htmlFor="amenities">Amenities</label>
            <textarea id="amenities" name="amenities" value={formData.amenities} onChange={handleChange} rows={3} />
          </div>

          <div className="add-facility-grid two-col">
            <div className="form-field">
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

            <div className="form-field">
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
          </div>

          <div className="add-facility-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => navigate("/dashboard/admin/facilities")}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-create" disabled={submitting}>
              {submitting ? "Creating..." : "Create Facility"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFacilityPage;
