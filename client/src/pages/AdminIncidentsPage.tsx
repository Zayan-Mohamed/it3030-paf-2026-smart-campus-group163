import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Incident, IncidentAssignee, IncidentPriority } from '../types';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';

const API_BASE_URL = 'http://localhost:8080';

const priorityBadgeVariant: Record<IncidentPriority, 'low' | 'medium' | 'high' | 'critical'> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

type IncidentFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

const filterTabs: Array<{ key: IncidentFilter; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'REJECTED', label: 'Rejected' },
];

export const AdminIncidentsPage = () => {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeFilter, setActiveFilter] = useState<IncidentFilter>('ALL');
  const [staffMembers, setStaffMembers] = useState<IncidentAssignee[]>([]);
  const [assignByIncident, setAssignByIncident] = useState<Record<number, string>>({});
  const [rejectByIncident, setRejectByIncident] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [busyIncidentId, setBusyIncidentId] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const filteredIncidents = useMemo(() => {
    switch (activeFilter) {
      case 'OPEN':
        return incidents.filter((item) => item.status === 'OPEN');
      case 'IN_PROGRESS':
        return incidents.filter((item) => item.status === 'IN_PROGRESS');
      case 'RESOLVED':
        return incidents.filter((item) => item.status === 'RESOLVED' || item.status === 'CLOSED');
      case 'REJECTED':
        return incidents.filter((item) => item.status === 'CANCELLED');
      default:
        return incidents;
    }
  }, [activeFilter, incidents]);

  const loadData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [incidentsResponse, staffResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/incidents/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/v1/incidents/staff-members`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!incidentsResponse.ok) {
        const payload = (await incidentsResponse.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Failed to load incidents');
      }

      if (!staffResponse.ok) {
        const payload = (await staffResponse.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Failed to load staff members');
      }

      const incidentsPayload = (await incidentsResponse.json()) as Incident[];
      const staffPayload = (await staffResponse.json()) as IncidentAssignee[];

      setIncidents(incidentsPayload);
      setStaffMembers(staffPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load admin incident view');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const assignIncident = async (incidentId: number) => {
    if (!token) {
      return;
    }

    const selected = assignByIncident[incidentId];
    if (!selected) {
      setError('Select a staff member before assigning the ticket.');
      return;
    }

    try {
      setBusyIncidentId(incidentId);
      setError(null);

      const selectedStaff = staffMembers.find((staff) => staff.id === Number(selected));

      setIncidents((current) =>
        current.map((item) =>
          item.id === incidentId
            ? {
                ...item,
                assignedToId: selectedStaff?.id ?? item.assignedToId,
                assignedToName: selectedStaff?.name ?? item.assignedToName,
              }
            : item
        )
      );

      const response = await fetch(`${API_BASE_URL}/api/v1/incidents/${incidentId}/assign`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ staffUserId: Number(selected) }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Failed to assign incident');
      }

      setToast({ type: 'success', message: `Incident #${incidentId} assigned successfully.` });
    } catch (assignError) {
      void loadData();
      setError(assignError instanceof Error ? assignError.message : 'Failed to assign incident');
      setToast({ type: 'error', message: 'Assign failed. Data refreshed.' });
    } finally {
      setBusyIncidentId(null);
    }
  };

  const rejectIncident = async (incidentId: number) => {
    if (!token) {
      return;
    }

    const reason = rejectByIncident[incidentId]?.trim() ?? '';
    if (!reason) {
      setError('Rejection reason is required.');
      return;
    }

    try {
      setBusyIncidentId(incidentId);
      setError(null);

      setIncidents((current) =>
        current.map((item) =>
          item.id === incidentId
            ? {
                ...item,
                status: 'CANCELLED',
                rejectionReason: reason,
              }
            : item
        )
      );

      const response = await fetch(`${API_BASE_URL}/api/v1/incidents/${incidentId}/reject`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Failed to reject incident');
      }

      setToast({ type: 'success', message: `Incident #${incidentId} rejected.` });
    } catch (rejectError) {
      void loadData();
      setError(rejectError instanceof Error ? rejectError.message : 'Failed to reject incident');
      setToast({ type: 'error', message: 'Reject failed. Data refreshed.' });
    } finally {
      setBusyIncidentId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-slate-200/70 bg-white/90">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Incident Management</CardTitle>
          <CardDescription>
            Assign tickets to staff and reject invalid tickets with a mandatory reason.
          </CardDescription>
        </CardHeader>
      </Card>

      {loading ? <p className="text-sm text-slate-500">Loading incidents...</p> : null}
      {error ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      {toast ? (
        <div
          className={`fixed right-4 top-20 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {toast.message}
        </div>
      ) : null}

      {!loading && incidents.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              variant={activeFilter === tab.key ? 'default' : 'outline'}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      ) : null}

      {!loading && incidents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-600">No incidents available.</CardContent>
        </Card>
      ) : null}

      {!loading && filteredIncidents.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredIncidents.map((incident) => (
            <Card key={incident.id} className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg">{incident.resourceLocation}</CardTitle>
                  <Badge variant={priorityBadgeVariant[incident.priority]}>{incident.priority}</Badge>
                </div>
                <CardDescription>
                  Raised by {incident.reporterName ?? 'Unknown'} | Current: {incident.status}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-700">{incident.description}</p>
                <p className="text-xs text-slate-600">Assigned: {incident.assignedToName ?? 'Unassigned'}</p>

                <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Assign Staff</p>
                  <Select
                    value={assignByIncident[incident.id] ?? ''}
                    onChange={(event) =>
                      setAssignByIncident((prev) => ({
                        ...prev,
                        [incident.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select staff member</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} ({staff.email})
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => assignIncident(incident.id)}
                    disabled={busyIncidentId === incident.id}
                    className="w-full"
                  >
                    {busyIncidentId === incident.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Assign
                  </Button>
                </div>

                {incident.status !== 'CANCELLED' && incident.status !== 'CLOSED' ? (
                  <div className="space-y-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Reject Ticket</p>
                    <Textarea
                      placeholder="Write rejection reason"
                      value={rejectByIncident[incident.id] ?? ''}
                      onChange={(event) =>
                        setRejectByIncident((prev) => ({
                          ...prev,
                          [incident.id]: event.target.value,
                        }))
                      }
                      className="min-h-20"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => rejectIncident(incident.id)}
                      disabled={busyIncidentId === incident.id}
                      className="w-full"
                    >
                      {busyIncidentId === incident.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                      Reject with Reason
                    </Button>
                  </div>
                ) : null}

                {incident.rejectionReason ? (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    Rejection Reason: {incident.rejectionReason}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && incidents.length > 0 && filteredIncidents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-600">No incidents found for the selected filter.</CardContent>
        </Card>
      ) : null}
    </div>
  );
};
