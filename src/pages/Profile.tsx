import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('User data:', user);
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }
      if (!user) {
        console.error('No user found');
        throw new Error('No user found');
      }

      console.log('Attempting to fetch profile data...');
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      console.log('Profile data:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setError('Failed to load profile. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          phone: profile?.phone,
          address: profile?.address,
        })
        .eq('id', profile?.id);

      if (error) throw error;
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      if (passwords.new !== passwords.confirm) {
        throw new Error('New passwords do not match');
      }

      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      setPasswords({ current: '', new: '', confirm: '' });
      setSuccess('Password updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-text-primary dark:text-text-primary-dark mb-8">Profile Settings</h1>

      <div className="grid grid-cols-1 gap-8">
        {/* Personal Information */}
        <div className="bg-card dark:bg-card-dark shadow-card dark:shadow-card-dark rounded-lg p-6">
          <h2 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-6">Personal Information</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {error && (
              <div className="bg-error/10 dark:bg-error-dark/10 border border-error/20 dark:border-error-dark/20 text-error dark:text-error-dark px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-success/10 dark:bg-success-dark/10 border border-success/20 dark:border-success-dark/20 text-success dark:text-success-dark px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={profile?.first_name || ''}
                  onChange={(e) => setProfile(profile ? { ...profile, first_name: e.target.value } : null)}
                  className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={profile?.last_name || ''}
                  onChange={(e) => setProfile(profile ? { ...profile, last_name: e.target.value } : null)}
                  className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={profile?.email || ''}
                disabled
                className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input/50 dark:bg-input-dark/50 text-text-primary dark:text-text-primary-dark"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={profile?.phone || ''}
                onChange={(e) => setProfile(profile ? { ...profile, phone: e.target.value } : null)}
                className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Address
              </label>
              <textarea
                id="address"
                rows={3}
                value={profile?.address || ''}
                onChange={(e) => setProfile(profile ? { ...profile, address: e.target.value } : null)}
                className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={updating}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary dark:bg-secondary-dark hover:bg-secondary/90 dark:hover:bg-secondary-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-secondary-dark disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-card dark:bg-card-dark shadow-card dark:shadow-card-dark rounded-lg p-6">
          <h2 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-6">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark"
                required
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={updating}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary dark:bg-secondary-dark hover:bg-secondary/90 dark:hover:bg-secondary-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-secondary-dark disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}