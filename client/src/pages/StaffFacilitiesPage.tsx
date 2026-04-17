import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AdminFacilitiesLayout } from '../components/facilities/AdminFacilitiesLayout';
import {
  facilityStatusLabel,
  facilityTypeLabel,
  getFacilities,
  toTimeInputValue,
  type FacilityFilters,
} from '../lib/facilityService';
import { useAuth } from '../contexts/AuthContext';
import type { Facility, FacilityStatus, FacilityType } from '../types';

type FilterState = {
  name: string;
  location: string;
  facilityType: FacilityType | '';
  status: FacilityStatus | '';
  minCapacity: string;
};

const initialFilters: FilterState = {
  name: '',
  location: '',
  facilityType: '',
  status: '',
  minCapacity: '',
};

const toFacilityFilters = (filters: FilterState): FacilityFilters => ({
  name: filters.name.trim(),
  location: filters.location.trim(),
  facilityType: filters.facilityType,
  status: filters.status,
  minCapacity: filters.minCapacity ? Number(filters.minCapacity) : '',
});

export const StaffFacilitiesPage = () => {
  const { token } = useAuth();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFacilities = async (nextFilters: FilterState) => {
    if (!token) {
      setFacilities([]);
      setError('You must be signed in to view facilities.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getFacilities(token, toFacilityFilters(nextFilters));
      setFacilities(data);
    } catch (loadError) {
      setFacilities([]);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFacilities(initialFilters);
  }, [token]);

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadFacilities(filters);
  };

  const handleClearFilters = async () => {
    setFilters(initialFilters);
    await loadFacilities(initialFilters);
  };

  return (
    <AdminFacilitiesLayout
      title="Facilities & Assets"
      subtitle="Browse campus facilities, narrow the list with filters, and start a booking request when you are ready."
    >
      <section className="section">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <form onSubmit={handleSubmit} className="mb-5 flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <label className="relative block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
                <Search className="pointer-events-none absolute left-3 top-[46px] size-4 text-slate-400" />
                <input
                  value={filters.name}
                  onChange={(event) => handleFilterChange('name', event.target.value)}
                  placeholder="Search by name"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Location</span>
                <input
                  value={filters.location}
                  onChange={(event) => handleFilterChange('location', event.target.value)}
                  placeholder="Filter by location"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Type</span>
                <select
                  value={filters.facilityType}
                  onChange={(event) => handleFilterChange('facilityType', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">All types</option>
                  <option value="CONFERENCE_ROOM">CONFERENCE ROOM</option>
                  <option value="LABORATORY">LABORATORY</option>
                  <option value="SPORTS_HALL">SPORTS HALL</option>
                  <option value="AUDITORIUM">AUDITORIUM</option>
                  <option value="STUDY_ROOM">STUDY ROOM</option>
                  <option value="COMPUTER_LAB">COMPUTER LAB</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
                <select
                  value={filters.status}
                  onChange={(event) => handleFilterChange('status', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">All statuses</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Min Capacity</span>
                <input
                  type="number"
                  min="0"
                  value={filters.minCapacity}
                  onChange={(event) => handleFilterChange('minCapacity', event.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                />
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Clear Filters
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
              >
                <Search size={18} />
                Search
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
              Loading facilities...
            </div>
          ) : facilities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-slate-900">No facilities found</h2>
              <p className="mt-2 text-sm text-slate-500">
                Try updating the filters to find a different facility.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Location</th>
                    <th className="px-4 py-2">Capacity</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Available Hours</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities.map((facility) => (
                    <tr key={facility.id} className="bg-slate-50 text-sm text-slate-700">
                      <td className="rounded-l-2xl px-4 py-4 font-semibold text-slate-900">
                        <div>{facility.name}</div>
                        {facility.description && (
                          <p className="mt-1 text-xs font-normal text-slate-500">{facility.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">{facilityTypeLabel(facility.facilityType)}</td>
                      <td className="px-4 py-4">{facility.location}</td>
                      <td className="px-4 py-4">{facility.capacity}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                          {facilityStatusLabel(facility.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {facility.availableFrom && facility.availableTo
                          ? `${toTimeInputValue(facility.availableFrom)} - ${toTimeInputValue(facility.availableTo)}`
                          : 'Not provided'}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <Link
                          to={`/dashboard/staff/bookings/new?facilityId=${facility.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-cyan-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cyan-800"
                        >
                          Book
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </AdminFacilitiesLayout>
  );
};
