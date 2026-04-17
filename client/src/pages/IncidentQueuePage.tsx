import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Loader2, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Incident, IncidentPriority, IncidentStatus } from '../types';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';

const API_BASE_URL = 'http://localhost:8080';

type QueueAction = {
  target: IncidentStatus;
  label: string;
};

type IncidentFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

const filterTabs: Array<{ key: IncidentFilter; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'REJECTED', label: 'Rejected' },
];

const priorityBadgeVariant: Record<IncidentPriority, 'low' | 'medium' | 'high' | 'critical'> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const actionByStatus: Partial<Record<IncidentStatus, QueueAction>> = {
  OPEN: { target: 'IN_PROGRESS', label: 'Start Work' },
  IN_PROGRESS: { target: 'RESOLVED', label: 'Mark Resolved' },
  RESOLVED: { target: 'CLOSED', label: 'Close Ticket' },
};

export const IncidentQueuePage = () => {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeFilter, setActiveFilter] = useState<IncidentFilter>('ALL');
  const [resolutionById, setResolutionById] = useState<Record<number, string>>({});
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

  const loadQueue = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/v1/incidents/queue`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Failed to load incident queue');
      }

      const payload = (await response.json()) as Incident[];
      setIncidents(payload);
    } catch (queueError) {
      setError(queueError instanceof Error ? queueError.message : 'Failed to load incident queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submitStatusUpdate = async (incident: Incident, targetStatus: IncidentStatus) => {
    if (!token) {
      return;
    }

    const note = resolutionById[incident.id]?.trim() ?? '';
    if (targetStatus === 'RESOLVED' && !note) {
      setError('Resolution note is required when moving to RESOLVED.');
      return;
    }

    try {
      setBusyIncidentId(incident.id);
      setError(null);

      const previousIncidents = incidents;
      const previousIncident = previousIncidents.find((item) => item.id === incident.id);
      const optimisticResolution = note || previousIncident?.resolutionNotes || null;

      setIncidents((current) =>
        current.map((item) =>
          item.id === incident.id
            ? {
                ...item,
                status: targetStatus,
                resolutionNotes: optimisticResolution,
                resolvedAt:
                  targetStatus === 'RESOLVED' || targetStatus === 'CLOSED'
                    ? new Date().toISOString()
                    : item.resolvedAt,
              }
            : item
        )
      );

      const response = await fetch(`${API_BASE_URL}/api/v1/incidents/${incident.id}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: targetStatus,
          resolutionNotes: note || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Failed to update ticket status');
      }

      setToast({ type: 'success', message: `Ticket #${incident.id} moved to ${targetStatus}.` });
    } catch (updateError) {
      setIncidents((current) =>
        current.map((item) =>
          item.id === incident.id
            ? {
                ...item,
                status: incident.status,
                resolutionNotes: incident.resolutionNotes ?? null,
                resolvedAt: incident.resolvedAt ?? null,
              }
            : item
        )
      );
      setError(updateError instanceof Error ? updateError.message : 'Failed to update ticket status');
      setToast({ type: 'error', message: 'Status update failed. Changes were rolled back.' });
    } finally {
      setBusyIncidentId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-slate-200/70 bg-white/90">
        <CardHeader>
          <CardTitle className="text-2xl">Staff Incident Queue</CardTitle>
          <CardDescription>
            Follow the workflow: OPEN → IN_PROGRESS → RESOLVED → CLOSED. Resolution note is mandatory for RESOLVED.
          </CardDescription>
        </CardHeader>
      </Card>

      {loading ? <p className="text-sm text-slate-500">Loading queue...</p> : null}
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
          <CardContent className="p-8 text-center text-sm text-slate-600">No assigned incidents in your queue.</CardContent>
        </Card>
      ) : null}

      {!loading && filteredIncidents.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredIncidents.map((incident) => {
            const action = actionByStatus[incident.status];
            return (
              <Card key={incident.id} className="border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">{incident.resourceLocation}</CardTitle>
                    <Badge variant={priorityBadgeVariant[incident.priority]}>{incident.priority}</Badge>
                  </div>
                  <CardDescription>
                    Reported by {incident.reporterName ?? 'Unknown'} | {incident.category.replace(/_/g, ' ')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-700">{incident.description}</p>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                    Current Status: <strong>{incident.status}</strong>
                    {incident.status === 'IN_PROGRESS' ? <ArrowRight className="ml-2 inline h-4 w-4" /> : null}
                  </div>

                  {(incident.status === 'IN_PROGRESS' || incident.status === 'RESOLVED' || !!incident.resolutionNotes) ? (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Resolution Notes
                      </label>
                      <Textarea
                        value={resolutionById[incident.id] ?? incident.resolutionNotes ?? ''}
                        onChange={(event) =>
                          setResolutionById((prev) => ({
                            ...prev,
                            [incident.id]: event.target.value,
                          }))
                        }
                        placeholder="Describe fix performed by staff..."
                        className="min-h-24"
                      />
                    </div>
                  ) : null}

                  {action ? (
                    <Button
                      onClick={() => submitStatusUpdate(incident, action.target)}
                      disabled={busyIncidentId === incident.id}
                      className="w-full"
                    >
                      {busyIncidentId === incident.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wrench className="mr-2 h-4 w-4" />}
                      {action.label}
                    </Button>
                  ) : (
                    <p className="text-xs font-semibold text-slate-500">No further action available.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
