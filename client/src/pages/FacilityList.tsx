import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AdminFacilitiesLayout } from '../components/facilities/AdminFacilitiesLayout';
import {
  deleteFacility,
  facilityStatusLabel,
  facilityTypeLabel,
  getFacilities,
  toTimeInputValue,
} from '../lib/facilityService';
import { useAuth } from '../contexts/AuthContext';
import type { Facility } from '../types';

export const FacilityList = () => {
  const { token } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    const loadFacilities = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getFacilities(token);
        if (active) {
          setFacilities(data);
        }
      } catch (loadError) {
        if (active) {
          const message = loadError instanceof Error ? loadError.message : 'Failed to load facilities';
          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadFacilities();

    return () => {
      active = false;
    };
  }, [token]);

  const filteredFacilities = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();

    return facilities.filter((facility) => {
      const matchesSearch =
        searchValue.length === 0 ||
        facility.name.toLowerCase().includes(searchValue) ||
        facility.location.toLowerCase().includes(searchValue) ||
        facility.facilityType.toLowerCase().includes(searchValue) ||
        facility.status.toLowerCase().includes(searchValue);

      const matchesStatus = !statusFilter || facility.status === statusFilter;
      const matchesType = !typeFilter || facility.facilityType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [facilities, searchTerm, statusFilter, typeFilter]);

  const handleDelete = async (facility: Facility) => {
    if (!token) {
      setError('You must be signed in to delete a facility.');
      return;
    }

    const confirmed = window.confirm(`Delete facility "${facility.name}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(facility.id);
    setError(null);

    try {
      await deleteFacility(token, facility.id);
      setFacilities((current) => current.filter((item) => item.id !== facility.id));
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete facility';
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminFacilitiesLayout
      title="Facilities & Assets"
      subtitle="Manage facility records, availability, and operational status within the admin workspace."
    >
      <section className="section">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="grid flex-1 gap-4 md:grid-cols-3">
              <label className="relative block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Search</span>
                <Search className="pointer-events-none absolute left-3 top-[46px] size-4 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search name, type, location, status"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">All statuses</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="UNDER_MAINTENANCE">UNDER MAINTENANCE</option>
                  <option value="UNAVAILABLE">UNAVAILABLE</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Type</span>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
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
            </div>

            <Link
              to="/admin/facilities/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
            >
              <Plus size={18} />
              Add New Facility
            </Link>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-500">
              Loading facilities...
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-slate-900">No facilities found</h2>
              <p className="mt-2 text-sm text-slate-500">
                Adjust the filters or add a new facility to get started.
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
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((facility) => (
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
                        {toTimeInputValue(facility.availableFrom)} - {toTimeInputValue(facility.availableTo)}
                      </td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/dashboard/admin/facilities/${facility.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
                          >
                            <Pencil size={14} />
                            Edit
                          </Link>
                          <button
                            type="button"
                            disabled={deletingId === facility.id}
                            onClick={() => handleDelete(facility)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 size={14} />
                            {deletingId === facility.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
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
