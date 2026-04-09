import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditFacilityPage.css";

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
      const detailMessage = Object.values(errorData.details).find((value) => typeof value === "string" && value.trim());
      if (detailMessage) {
        return detailMessage;
      }
    }
    return fallbackMessage;
  };

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
          throw new Error(await getBackendErrorMessage(response, "Failed to fetch facility"));
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
      setError("Available From time must be before Available To time");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name,
        description: formData.description,
        facilityType: formData.facilityType,
        location: formData.location,
        capacity: Number(formData.capacity),
        status: formData.status,
        imageUrl: formData.imageUrl,
        amenities: formData.amenities,
        availableFrom: normalizeTimeForApi(formData.availableFrom),
        availableTo: normalizeTimeForApi(formData.availableTo)
      };

      const response = await fetch(`http://localhost:8080/api/facilities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(await getBackendErrorMessage(response, "Failed to update facility"));
      }

      navigate("/dashboard/admin/facilities");
    } catch (err) {
      setError(err?.message || "Failed to update facility");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-facility-page">
        <div className="edit-facility-card">
          <p className="edit-facility-loading">Loading facility details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-facility-page">
      <div className="edit-facility-card">
        <h1 className="edit-facility-title">Edit Facility</h1>

        {error && <div className="edit-facility-error">{error}</div>}

        <form onSubmit={handleSubmit} className="edit-facility-form">
          <div className="edit-facility-grid two-col">
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

          <div className="edit-facility-grid two-col">
            <div className="form-field">
              <label htmlFor="location">Location</label>
              <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} required />
            </div>

            <div className="form-field">
              <label htmlFor="capacity">Capacity</label>
              <input id="capacity" name="capacity" type="number" min="1" value={formData.capacity} onChange={handleChange} required />
            </div>
          </div>

          <div className="edit-facility-grid two-col">
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

          <div className="edit-facility-grid two-col">
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

          <div className="edit-facility-actions">
            <button type="button" className="btn btn-cancel" onClick={() => navigate("/dashboard/admin/facilities")}>
              Cancel
            </button>
            <button type="submit" className="btn btn-update" disabled={submitting}>
              {submitting ? "Updating..." : "Update Facility"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFacilityPage;
