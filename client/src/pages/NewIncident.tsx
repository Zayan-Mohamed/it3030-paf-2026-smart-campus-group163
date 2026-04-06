import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ImagePlus, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { IncidentCategory, IncidentPriority } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';

const API_BASE_URL = 'http://localhost:8080';
const MAX_IMAGES = 3;

const categoryOptions: Array<{ value: IncidentCategory; label: string }> = [
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'AV_EQUIPMENT', label: 'AV Equipment' },
  { value: 'NETWORK', label: 'Network' },
  { value: 'OTHER', label: 'Other' },
];

const priorityOptions: IncidentPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

type FormState = {
  resourceLocation: string;
  category: IncidentCategory | '';
  description: string;
  priority: IncidentPriority | '';
  preferredContact: string;
};

export const NewIncident = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    resourceLocation: '',
    category: '',
    description: '',
    priority: 'MEDIUM',
    preferredContact: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const previews = useMemo(() => {
    return images.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
  }, [images]);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.resourceLocation.trim()) {
      nextErrors.resourceLocation = 'Resource/location is required';
    }
    if (!form.category) {
      nextErrors.category = 'Category is required';
    }
    if (!form.description.trim()) {
      nextErrors.description = 'Description is required';
    }
    if (!form.priority) {
      nextErrors.priority = 'Priority is required';
    }
    if (!form.preferredContact.trim()) {
      nextErrors.preferredContact = 'Preferred contact is required';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const nextImages = selected.slice(0, MAX_IMAGES);

    if (selected.length > MAX_IMAGES) {
      setError('Only up to 3 images can be uploaded.');
    } else {
      setError(null);
    }

    setImages(nextImages);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    if (!token) {
      setError('You must be logged in to submit an incident.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('resourceLocation', form.resourceLocation.trim());
      formData.append('category', form.category);
      formData.append('description', form.description.trim());
      formData.append('priority', form.priority);
      formData.append('preferredContact', form.preferredContact.trim());

      images.forEach((image) => formData.append('attachments', image));

      const response = await fetch(`${API_BASE_URL}/api/v1/incidents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        navigate('/dashboard');
        return;
      }

      const data = await response.json().catch(() => null) as { message?: string } | null;
      setError(data?.message ?? 'Failed to submit incident.');
    } catch {
      setError('Network error while creating incident.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,rgba(14,116,144,0.2),transparent_44%),radial-gradient(circle_at_88%_8%,rgba(59,130,246,0.2),transparent_45%)]" />

      <Card className="border-slate-200/70 bg-white/90 shadow-xl shadow-slate-900/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Create Incident Ticket</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Report a facility issue and attach evidence images. Tickets are created with OPEN status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="rounded-xl border border-slate-200/70 bg-slate-50/65 p-4 md:p-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Incident Details</p>
              <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resourceLocation">Resource/Location</Label>
                <Input
                  id="resourceLocation"
                  value={form.resourceLocation}
                  onChange={(e) => updateField('resourceLocation', e.target.value)}
                  placeholder="Library 2nd Floor - Study Area"
                  required
                />
                {fieldErrors.resourceLocation && <p className="text-xs text-red-600">{fieldErrors.resourceLocation}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredContact">Preferred Contact</Label>
                <Input
                  id="preferredContact"
                  value={form.preferredContact}
                  onChange={(e) => updateField('preferredContact', e.target.value)}
                  placeholder="077XXXXXXX or your email"
                  required
                />
                {fieldErrors.preferredContact && <p className="text-xs text-red-600">{fieldErrors.preferredContact}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select id="category" value={form.category} onChange={(e) => updateField('category', e.target.value)} required>
                  <option value="" disabled>
                    Select a category
                  </option>
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                {fieldErrors.category && <p className="text-xs text-red-600">{fieldErrors.category}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select id="priority" value={form.priority} onChange={(e) => updateField('priority', e.target.value)} required>
                  {priorityOptions.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </Select>
                {fieldErrors.priority && <p className="text-xs text-red-600">{fieldErrors.priority}</p>}
              </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-slate-50/65 p-4 md:p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Issue Description</p>
              <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Explain what happened, where, and any immediate safety concerns."
                className="min-h-32"
                required
              />
              {fieldErrors.description && <p className="text-xs text-red-600">{fieldErrors.description}</p>}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-slate-50/65 p-4 md:p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</p>
              <div className="space-y-3">
              <Label htmlFor="attachments">Evidence Images (max 3)</Label>
              <label
                htmlFor="attachments"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                <ImagePlus className="h-5 w-5" />
                <span>Select PNG/JPG/WEBP images</span>
              </label>
              <input
                id="attachments"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {previews.map((preview) => (
                    <div key={preview.url} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                      <img src={preview.url} alt={preview.name} className="h-24 w-full object-cover" />
                      <p className="truncate px-2 py-1 text-xs text-slate-600">{preview.name}</p>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                <Upload className="mr-2 h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Incident'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
