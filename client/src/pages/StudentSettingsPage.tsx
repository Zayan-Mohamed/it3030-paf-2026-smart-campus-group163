import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserService } from '../services/UserService';
import { Button } from '../components/ui/button';
import { uploadAvatar, deleteAvatar } from '../lib/supabase';

export const StudentSettingsPage = () => {
  const { user, setUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    pictureUrl: '',
    studentRegistrationNumber: '',
    faculty: '',
    major: '',
    employeeId: '',
    department: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStudent = user?.roles.includes('STUDENT');
  const isStaffOrAdmin = user?.roles.includes('STAFF') || user?.roles.includes('ADMIN');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        pictureUrl: user.pictureUrl || '',
        studentRegistrationNumber: user.studentRegistrationNumber || '',
        faculty: user.faculty || '',
        major: user.major || '',
        employeeId: user.employeeId || '',
        department: user.department || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  const handleRemovePicture = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setMessage({ text: 'Removing avatar...', type: 'info' });

      // Delete from storage if it's a Supabase URL
      if (formData.pictureUrl && formData.pictureUrl.includes('supabase.co')) {
        await deleteAvatar(formData.pictureUrl);
      }

      // Update backend record with empty string
      const updatedUser = await UserService.updateUser(user.id, { ...formData, pictureUrl: '' });
      
      // Update local state & context immediately
      setFormData(prev => ({ ...prev, pictureUrl: '' }));
      setUser(prev => prev ? { ...prev, ...updatedUser } : null);
      
      setMessage({ text: 'Profile picture removed successfully!', type: 'success' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove avatar';
      setMessage({ text: message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);
      setMessage({ text: 'Uploading avatar...', type: 'info' });
      
      const publicUrl = await uploadAvatar(file, user.id.toString());
      setFormData(prev => ({ ...prev, pictureUrl: publicUrl }));
      
      setMessage({ text: 'Avatar uploaded! Make sure to save your changes.', type: 'success' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar';
      setMessage({ text: message, type: 'error' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      const updatedUser = await UserService.updateUser(user.id, formData);
      
      setUser(prev => prev ? { ...prev, ...updatedUser } : null);
      
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { logout } = useAuth();
  
  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      setIsDeleting(true);
      await UserService.deleteUser(user.id);
      logout();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      setMessage({ text: message, type: 'error' });
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
        <p className="text-sm text-slate-500">Update your profile information</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {message.text && (
            <div className={`rounded-md p-4 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
              message.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-4 ring-slate-50 relative group cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}
                 title="Click to change profile picture">
              {formData.pictureUrl ? (
                <img src={formData.pictureUrl} alt="Profile" className="h-full w-full object-cover group-hover:opacity-75 transition-opacity" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-400 group-hover:bg-slate-200 transition-colors">
                  {formData.name?.charAt(0) || user.email?.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                 <span className="text-xs text-white font-medium">Change</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">Profile Picture</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                  Choose File
                </Button>
                {formData.pictureUrl && (
                  <Button type="button" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={handleRemovePicture} disabled={loading}>
                    Remove
                  </Button>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">Max size 5MB. Must be an image file.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">Email cannot be changed.</p>
            </div>
            
            {isStudent && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Student Registration Number</label>
                  <input
                    type="text"
                    value={formData.studentRegistrationNumber}
                    onChange={(e) => setFormData({ ...formData, studentRegistrationNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Faculty</label>
                  <input
                    type="text"
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Major</label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </>
            )}

            {isStaffOrAdmin && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Email Notifications</p>
              <p className="text-sm text-slate-500">Receive booking updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">SMS Notifications</p>
              <p className="text-sm text-slate-500">Receive urgent alerts via SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Dark Mode</p>
              <p className="text-sm text-slate-500">Toggle dark mode theme</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-2 text-red-700">Danger Zone</h2>
        <p className="text-sm text-red-600 mb-4">
          Once you delete your account, there is no going back. All of your personal data, bookings, and incidents will be permanently deleted. Please be certain.
        </p>
        <Button 
          variant="destructive" 
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Account
        </Button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-xl font-bold text-slate-900">Are you absolutely sure?</h2>
            <p className="mb-6 text-slate-600">
              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
