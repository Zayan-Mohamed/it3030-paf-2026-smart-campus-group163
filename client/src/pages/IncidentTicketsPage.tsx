import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Clock3, MessageSquareText, Plus, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Incident, IncidentPriority, IncidentStatus } from '../types';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { IncidentComments } from '../components/incidents/IncidentComments';

const API_BASE_URL = 'http://localhost:8080';

const priorityBadgeVariant: Record<IncidentPriority, 'low' | 'medium' | 'high' | 'critical'> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const statusTheme: Record<IncidentStatus, { label: string; pill: string; card: string; rail: string }> = {
  OPEN: {
    label: 'Open',
    pill: 'bg-red-100 text-red-700 border border-red-200',
    card: 'from-red-50 to-white',
    rail: 'bg-red-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    pill: 'bg-blue-100 text-blue-700 border border-blue-200',
    card: 'from-blue-50 to-white',
    rail: 'bg-blue-500',
  },
  RESOLVED: {
    label: 'Resolved',
    pill: 'bg-green-100 text-green-700 border border-green-200',
    card: 'from-green-50 to-white',
    rail: 'bg-green-500',
  },
  CLOSED: {
    label: 'Closed',
    pill: 'bg-slate-100 text-slate-700 border border-slate-200',
    card: 'from-slate-50 to-white',
    rail: 'bg-slate-500',
  },
  CANCELLED: {
    label: 'Rejected',
    pill: 'bg-rose-100 text-rose-700 border border-rose-200',
    card: 'from-rose-50 to-white',
    rail: 'bg-rose-500',
  },
};

const formatCategory = (value: string) => value.replace(/_/g, ' ');

type IncidentFilter = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
type PriorityFilter = 'ALL' | IncidentPriority;

const filterTabs: Array<{ key: IncidentFilter; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'REJECTED', label: 'Rejected' },
];

const priorityTabs: Array<{ key: PriorityFilter; label: string }> = [
  { key: 'ALL', label: 'All Priorities' },
  { key: 'LOW', label: 'Low' },
  { key: 'MEDIUM', label: 'Medium' },
  { key: 'HIGH', label: 'High' },
  { key: 'CRITICAL', label: 'Critical' },
];

export const IncidentTicketsPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeFilter, setActiveFilter] = useState<IncidentFilter>('ALL');
  const [activePriorityFilter, setActivePriorityFilter] = useState<PriorityFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async (showLoader = true) => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/v1/incidents/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Failed to fetch your tickets');
      }

      const payload = (await response.json()) as Incident[];
      setIncidents(payload);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch your tickets');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    fetchIncidents(true);
  }, [fetchIncidents]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const intervalId = window.setInterval(() => {
      fetchIncidents(false);
    }, 5000);

    const handleWindowFocus = () => {
      fetchIncidents(false);
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchIncidents, token]);

  const counters = useMemo(() => {
    return {
      total: incidents.length,
      open: incidents.filter((item) => item.status === 'OPEN' || item.status === 'IN_PROGRESS').length,
      resolved: incidents.filter((item) => item.status === 'RESOLVED' || item.status === 'CLOSED').length,
      rejected: incidents.filter((item) => item.status === 'CANCELLED').length,
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    const statusFiltered = (() => {
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
    })();

    if (activePriorityFilter === 'ALL') {
      return statusFiltered;
    }

    return statusFiltered.filter((item) => item.priority === activePriorityFilter);
  }, [activeFilter, activePriorityFilter, incidents]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-slate-200/70 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-2xl">My Incident Tickets</CardTitle>
            <Button onClick={() => navigate('/incidents/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Incident
            </Button>
          </div>
          <CardDescription>
            View only your raised tickets. Staff and admin updates are reflected live with color-coded status cards.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-2xl font-semibold text-slate-900">{counters.total}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-700">Open / In Progress</p>
            <p className="text-2xl font-semibold text-blue-700">{counters.open}</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-xs uppercase tracking-wide text-green-700">Resolved / Closed</p>
            <p className="text-2xl font-semibold text-green-700">{counters.resolved}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs uppercase tracking-wide text-rose-700">Rejected</p>
            <p className="text-2xl font-semibold text-rose-700">{counters.rejected}</p>
          </div>
        </CardContent>
      </Card>

      {loading ? <p className="text-sm text-slate-500">Loading incidents...</p> : null}
      {error ? (
        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      ) : null}
      {!loading && !error && incidents.length > 0 ? (
        <div className="space-y-2">
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
          <div className="flex flex-wrap gap-2">
            {priorityTabs.map((tab) => (
              <Button
                key={tab.key}
                size="sm"
                variant={activePriorityFilter === tab.key ? 'default' : 'outline'}
                onClick={() => setActivePriorityFilter(tab.key)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && !error && filteredIncidents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-600">No tickets found for the selected filter.</CardContent>
        </Card>
      ) : null}

      {!loading && !error && filteredIncidents.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredIncidents.map((incident) => {
            const theme = statusTheme[incident.status];
            return (
              <div
                key={incident.id}
                className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${theme.card} p-5 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className={`absolute left-0 top-0 h-full w-1.5 ${theme.rail}`} />
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{incident.resourceLocation}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${theme.pill}`}>{theme.label}</span>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant={priorityBadgeVariant[incident.priority]}>{incident.priority}</Badge>
                  <Badge variant="default">{formatCategory(incident.category)}</Badge>
                </div>

                <p className="mb-4 text-sm text-slate-700">{incident.description}</p>

                <div className="space-y-2 text-xs text-slate-600">
                  <p className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    Raised: {new Date(incident.createdAt).toLocaleString()}
                  </p>
                  {incident.assignedToName ? <p>Assigned Staff: {incident.assignedToName}</p> : null}
                  {incident.resolutionNotes ? (
                    <p className="inline-flex items-center gap-1 text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Resolution: {incident.resolutionNotes}
                    </p>
                  ) : null}
                  {incident.rejectionReason ? (
                    <p className="inline-flex items-center gap-1 text-rose-700">
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Rejection Reason: {incident.rejectionReason}
                    </p>
                  ) : null}
                </div>

                {incident.imageUrls.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {incident.imageUrls.slice(0, 3).map((url) => (
                      <img key={url} src={url} alt="Incident" className="h-20 w-full rounded-md object-cover" />
                    ))}
                  </div>
                ) : null}

                <IncidentComments incidentId={incident.id} />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
