import React, { useEffect, useState } from "react";

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

const FacilityForm = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  isLoading = false
}) => {
  const [errors, setErrors] = useState({});
  const [localFormData, setLocalFormData] = useState(formData || initialFormData);

  const isControlled = typeof onChange === "function";
  const currentData = isControlled ? (formData || initialFormData) : localFormData;

  useEffect(() => {
    if (isControlled && formData) {
      setLocalFormData(formData);
    }
  }, [formData, isControlled]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (isControlled) {
      onChange(name, value);
    } else {
      setLocalFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!currentData.name?.trim()) {
      newErrors.name = "Name is required";
    }
    if (!currentData.facilityType) {
      newErrors.facilityType = "Facility type is required";
    }
    if (!currentData.location?.trim()) {
      newErrors.location = "Location is required";
    }
    if (!currentData.capacity || Number(currentData.capacity) < 1) {
      newErrors.capacity = "Capacity must be at least 1";
    }
    if (!currentData.status) {
      newErrors.status = "Status is required";
    }
    if (!currentData.availableFrom) {
      newErrors.availableFrom = "Available from time is required";
    }
    if (!currentData.availableTo) {
      newErrors.availableTo = "Available to time is required";
    }

    if (currentData.availableFrom && currentData.availableTo && currentData.availableFrom >= currentData.availableTo) {
      newErrors.availableTo = "Available to time must be after available from time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm() && typeof onSubmit === "function") {
      onSubmit(currentData);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={currentData.name || ""}
          onChange={handleInputChange}
        />
        {errors.name && <span>{errors.name}</span>}
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={currentData.description || ""}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label htmlFor="facilityType">Facility Type</label>
        <select
          id="facilityType"
          name="facilityType"
          value={currentData.facilityType || ""}
          onChange={handleInputChange}
        >
          <option value="">Select Type</option>
          <option value="CONFERENCE_ROOM">CONFERENCE_ROOM</option>
          <option value="LABORATORY">LABORATORY</option>
          <option value="SPORTS_HALL">SPORTS_HALL</option>
          <option value="AUDITORIUM">AUDITORIUM</option>
          <option value="STUDY_ROOM">STUDY_ROOM</option>
          <option value="COMPUTER_LAB">COMPUTER_LAB</option>
          <option value="PROJECTOR">PROJECTOR</option>
          <option value="CAMERA">CAMERA</option>
          <option value="MEETING_ROOM">MEETING_ROOM</option>
          <option value="LECTURE_HALL">LECTURE_HALL</option>
          <option value="OTHER">OTHER</option>
        </select>
        {errors.facilityType && <span>{errors.facilityType}</span>}
      </div>

      <div>
        <label htmlFor="location">Location</label>
        <input
          type="text"
          id="location"
          name="location"
          value={currentData.location || ""}
          onChange={handleInputChange}
        />
        {errors.location && <span>{errors.location}</span>}
      </div>

      <div>
        <label htmlFor="capacity">Capacity</label>
        <input
          type="number"
          id="capacity"
          name="capacity"
          min="1"
          value={currentData.capacity || ""}
          onChange={handleInputChange}
        />
        {errors.capacity && <span>{errors.capacity}</span>}
      </div>

      <div>
        <label htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          value={currentData.status || ""}
          onChange={handleInputChange}
        >
          <option value="">Select Status</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
          <option value="UNAVAILABLE">UNAVAILABLE</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
        </select>
        {errors.status && <span>{errors.status}</span>}
      </div>

      <div>
        <label htmlFor="imageUrl">Image URL</label>
        <input
          type="text"
          id="imageUrl"
          name="imageUrl"
          value={currentData.imageUrl || ""}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label htmlFor="amenities">Amenities</label>
        <input
          type="text"
          id="amenities"
          name="amenities"
          value={currentData.amenities || ""}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label htmlFor="availableFrom">Available From</label>
        <input
          type="time"
          id="availableFrom"
          name="availableFrom"
          value={currentData.availableFrom || ""}
          onChange={handleInputChange}
        />
        {errors.availableFrom && <span>{errors.availableFrom}</span>}
      </div>

      <div>
        <label htmlFor="availableTo">Available To</label>
        <input
          type="time"
          id="availableTo"
          name="availableTo"
          value={currentData.availableTo || ""}
          onChange={handleInputChange}
        />
        {errors.availableTo && <span>{errors.availableTo}</span>}
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : submitLabel}
      </button>

      {typeof onCancel === "function" && (
        <button type="button" onClick={onCancel} disabled={isLoading}>
          Cancel
        </button>
      )}
    </form>
  );
};

export default FacilityForm;
