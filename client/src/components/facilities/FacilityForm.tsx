import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Facility, FacilityStatus, FacilityType } from '../../types';
import {
  facilityStatusLabel,
  facilityTypeLabel,
  normalizeFacilityTime,
  toTimeInputValue,
  type FacilityPayload,
} from '../../lib/facilityService';

type FacilityFormProps = {
  initialValues?: Facility | null;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (payload: FacilityPayload) => Promise<void>;
};

type FacilityFormState = {
  name: string;
  description: string;
  facilityType: FacilityType | '';
  location: string;
  capacity: string;
  status: FacilityStatus | '';
  imageUrl: string;
  otherAmenities: string;
  availableFrom: string;
  availableTo: string;
};

type FacilityFormErrors = Partial<Record<keyof FacilityFormState, string>>;

const facilityTypes: FacilityType[] = [
  'CONFERENCE_ROOM',
  'LABORATORY',
  'SPORTS_HALL',
  'AUDITORIUM',
  'STUDY_ROOM',
  'COMPUTER_LAB',
  'OTHER',
];

const facilityStatuses: FacilityStatus[] = ['AVAILABLE', 'UNDER_MAINTENANCE', 'UNAVAILABLE'];
const amenityOptions = [
  'Projector',
  'WiFi',
  'Air Conditioning',
  'Whiteboard',
  'Sound System',
  'Microphone',
  'Smart Board',
  'Computers',
  'Internet Access',
  'Parking',
  'Wheelchair Access',
];

function splitAmenities(value?: string | string[] | null) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitAmenitySelections(value?: string | string[] | null) {
  const amenities = splitAmenities(value);

  return {
    selectedAmenities: amenities.filter((amenity) => amenityOptions.includes(amenity)),
    otherAmenities: amenities.filter((amenity) => !amenityOptions.includes(amenity)).join(', '),
  };
}

function getInitialState(initialValues?: Facility | null): FacilityFormState {
  const { otherAmenities } = splitAmenitySelections(initialValues?.amenities);

  return {
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    facilityType: initialValues?.facilityType ?? '',
    location: initialValues?.location ?? '',
    capacity: initialValues?.capacity !== undefined ? String(initialValues.capacity) : '',
    status: initialValues?.status ?? '',
    imageUrl: initialValues?.imageUrl ?? '',
    otherAmenities,
    availableFrom: toTimeInputValue(initialValues?.availableFrom),
    availableTo: toTimeInputValue(initialValues?.availableTo),
  };
}

export const FacilityForm = ({
  initialValues,
  submitLabel,
  onCancel,
  onSubmit,
}: FacilityFormProps) => {
  const [form, setForm] = useState<FacilityFormState>(() => getInitialState(initialValues));
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(() => splitAmenitySelections(initialValues?.amenities).selectedAmenities);
  const [fieldErrors, setFieldErrors] = useState<FacilityFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm(getInitialState(initialValues));
    setSelectedAmenities(splitAmenitySelections(initialValues?.amenities).selectedAmenities);
    setFieldErrors({});
    setSubmitError(null);
  }, [initialValues]);

  const updateField = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
  };

  const validate = () => {
    const nextErrors: FacilityFormErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Facility name is required';
    }

    if (!form.facilityType) {
      nextErrors.facilityType = 'Facility type is required';
    }

    if (!form.location.trim()) {
      nextErrors.location = 'Location is required';
    }

    if (!form.capacity.trim()) {
      nextErrors.capacity = 'Capacity is required';
    } else if (Number.isNaN(Number(form.capacity)) || Number(form.capacity) < 1) {
      nextErrors.capacity = 'Capacity must be at least 1';
    }

    if (!form.status) {
      nextErrors.status = 'Status is required';
    }

    if (!form.availableFrom) {
      nextErrors.availableFrom = 'Available from time is required';
    }

    if (!form.availableTo) {
      nextErrors.availableTo = 'Available to time is required';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities((current) =>
      current.includes(amenity)
        ? current.filter((item) => item !== amenity)
        : [...current, amenity]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        facilityType: form.facilityType as FacilityType,
        location: form.location.trim(),
        capacity: Number(form.capacity),
        status: form.status as FacilityStatus,
        imageUrl: form.imageUrl.trim(),
        amenities: [
          ...selectedAmenities,
          ...splitAmenities(form.otherAmenities),
        ].join(', '),
        availableFrom: normalizeFacilityTime(form.availableFrom),
        availableTo: normalizeFacilityTime(form.availableTo),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save facility';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={updateField}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
            {fieldErrors.name && <p className="mt-2 text-sm text-red-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="facilityType" className="mb-2 block text-sm font-medium text-slate-700">
              Type
            </label>
            <select
              id="facilityType"
              name="facilityType"
              value={form.facilityType}
              onChange={updateField}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="">Select facility type</option>
              {facilityTypes.map((option) => (
                <option key={option} value={option}>
                  {facilityTypeLabel(option)}
                </option>
              ))}
            </select>
            {fieldErrors.facilityType && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.facilityType}</p>
            )}
          </div>

          <div>
            <label htmlFor="location" className="mb-2 block text-sm font-medium text-slate-700">
              Location
            </label>
            <input
              id="location"
              name="location"
              value={form.location}
              onChange={updateField}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
            {fieldErrors.location && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.location}</p>
            )}
          </div>

          <div>
            <label htmlFor="capacity" className="mb-2 block text-sm font-medium text-slate-700">
              Capacity
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              value={form.capacity}
              onChange={updateField}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
            {fieldErrors.capacity && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.capacity}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={updateField}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="">Select status</option>
              {facilityStatuses.map((option) => (
                <option key={option} value={option}>
                  {facilityStatusLabel(option)}
                </option>
              ))}
            </select>
            {fieldErrors.status && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.status}</p>
            )}
          </div>

          <div>
            <label htmlFor="imageUrl" className="mb-2 block text-sm font-medium text-slate-700">
              Image URL
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              value={form.imageUrl}
              onChange={updateField}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div>
            <label htmlFor="availableFrom" className="mb-2 block text-sm font-medium text-slate-700">
              Available From
            </label>
            <input
              id="availableFrom"
              name="availableFrom"
              type="time"
              value={form.availableFrom}
              onChange={updateField}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
            {fieldErrors.availableFrom && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.availableFrom}</p>
            )}
          </div>

          <div>
            <label htmlFor="availableTo" className="mb-2 block text-sm font-medium text-slate-700">
              Available To
            </label>
            <input
              id="availableTo"
              name="availableTo"
              type="time"
              value={form.availableTo}
              onChange={updateField}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
            {fieldErrors.availableTo && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.availableTo}</p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Amenities
          </label>
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 md:grid-cols-2">
            {amenityOptions.map((amenity) => (
              <label key={amenity} className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="size-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-200"
                />
                <span>{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="otherAmenities" className="mb-2 block text-sm font-medium text-slate-700">
            Other Amenities
          </label>
          <textarea
            id="otherAmenities"
            name="otherAmenities"
            rows={3}
            value={form.otherAmenities}
            onChange={updateField}
            placeholder="Enter any other amenities, separated by commas"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        <div className="mt-5">
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={form.description}
            onChange={updateField}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          />
        </div>

        {submitError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
};
