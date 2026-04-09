const API_BASE_URL = "http://localhost:8080/api/facilities";

const normalizeTimeForApi = (timeValue) => {
  if (!timeValue) {
    return timeValue;
  }
  return /^\d{2}:\d{2}$/.test(timeValue) ? `${timeValue}:00` : timeValue;
};

const extractErrorMessage = async (response, fallback = "Request failed") => {
  const errorData = await response.json().catch(() => null);
  if (!errorData) {
    return fallback;
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

  return fallback;
};

const toFacilityPayload = (data) => ({
  name: data.name?.trim() || "",
  description: data.description?.trim() || "",
  facilityType: data.facilityType,
  location: data.location?.trim() || "",
  capacity: Number(data.capacity),
  status: data.status,
  imageUrl: data.imageUrl?.trim() || "",
  amenities: data.amenities?.trim() || "",
  availableFrom: normalizeTimeForApi(data.availableFrom),
  availableTo: normalizeTimeForApi(data.availableTo)
});

export async function getFacilities(filters = {}) {
  const params = new URLSearchParams();

  if (filters.name) params.set("name", filters.name);
  if (filters.location) params.set("location", filters.location);
  if (filters.facilityType) params.set("facilityType", filters.facilityType);
  if (filters.status) params.set("status", filters.status);
  if (filters.minCapacity !== undefined && filters.minCapacity !== null && filters.minCapacity !== "") {
    params.set("minCapacity", String(filters.minCapacity));
  }

  const query = params.toString();
  const url = query ? `${API_BASE_URL}?${query}` : API_BASE_URL;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "Failed to fetch facilities"));
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function getFacilityById(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "Failed to fetch facility"));
  }

  return response.json();
}

export async function createFacility(data) {
  const payload = toFacilityPayload(data);

  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "Failed to create facility"));
  }

  return response.json();
}

export async function updateFacility(id, data) {
  const payload = toFacilityPayload(data);

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "Failed to update facility"));
  }

  return response.json();
}

export async function deleteFacility(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "Failed to delete facility"));
  }

  return true;
}
