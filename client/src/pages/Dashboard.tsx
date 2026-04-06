import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock3, Plus, Sparkles, UserCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Incident } from '../types';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const API_BASE_URL = 'http://localhost:8080';

const priorityVariantMap: Record<Incident['priority'], 'low' | 'medium' | 'high' | 'critical'> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const Dashboard = () => {
  const { user, token } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      if (!token) {
        setLoadingIncidents(false);
        return;
      }

      try {
        setLoadingIncidents(true);
        const response = await fetch(`${API_BASE_URL}/api/v1/incidents/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null) as { message?: string } | null;
          throw new Error(data?.message ?? 'Failed to load incidents');
        }

        const data = await response.json() as Incident[];
        setIncidents(data);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load incidents');
      } finally {
        setLoadingIncidents(false);
      }
    };

    fetchIncidents();
  }, [token]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-slate-200/70 bg-white/85 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(118deg,rgba(14,116,144,0.16),transparent_45%,rgba(37,99,235,0.15))]" />
        <CardHeader>
          <CardTitle className="text-3xl tracking-tight">Welcome back, {user.name}</CardTitle>
          <CardDescription className="max-w-2xl text-sm sm:text-base">
            Track your maintenance incidents, attach evidence, and monitor resolution updates from one clean dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Link to="/incidents/new">
            <Button className="shadow-lg shadow-slate-900/20">
              <Plus className="mr-2 h-4 w-4" />
              Create Incident Ticket
            </Button>
          </Link>
          <Badge variant="open">OPEN is default on creation</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
            <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
            Auto-synced with your account
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200/70 bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCircle2 className="h-5 w-5 text-cyan-700" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-slate-600">
            <p><span className="font-medium text-slate-800">Name:</span> {user.name}</p>
            <p><span className="font-medium text-slate-800">Email:</span> {user.email}</p>
            <p><span className="font-medium text-slate-800">Roles:</span> {user.roles.join(', ') || 'None'}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 bg-white/90">
          <CardHeader>
            <CardTitle className="text-lg">My Incident Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm">
            <div>
              <p className="text-slate-500">Total Tickets</p>
              <p className="text-2xl font-semibold text-slate-900">{incidents.length}</p>
            </div>
            <div>
              <p className="text-slate-500">OPEN Tickets</p>
              <p className="text-2xl font-semibold text-emerald-700">
                {incidents.filter((incident) => incident.status === 'OPEN').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/70 bg-white/90">
        <CardHeader>
          <CardTitle className="text-lg">My Incident Tickets</CardTitle>
          <CardDescription>Newest first. Uploaded images are displayed when available.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingIncidents ? (
            <p className="text-sm text-slate-500">Loading incidents...</p>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : incidents.length === 0 ? (
            <p className="text-sm text-slate-500">No incident tickets yet. Create your first one.</p>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div key={incident.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{incident.resourceLocation}</h3>
                    <div className="flex gap-2">
                      <Badge variant="open">{incident.status}</Badge>
                      <Badge variant={priorityVariantMap[incident.priority]}>{incident.priority}</Badge>
                    </div>
                  </div>
                  <p className="mb-2 text-sm text-slate-600">{incident.description}</p>
                  <div className="mb-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                    <span>Category: {incident.category.replace('_', ' ')}</span>
                    <span>Preferred contact: {incident.preferredContact}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {new Date(incident.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {incident.imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {incident.imageUrls.map((url) => (
                        <img key={url} src={url} alt="Incident evidence" className="h-20 w-full rounded-md object-cover" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
