import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Wallet } from 'lucide-react';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('No user data returned');

      // Create profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary dark:bg-bg-primary-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Wallet className="h-12 w-12 text-secondary dark:text-secondary-dark" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary dark:text-text-primary-dark">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
          Or{' '}
          <Link to="/login" className="font-medium text-secondary dark:text-secondary-dark hover:text-secondary/80 dark:hover:text-secondary-dark/80">
            sign in to your account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card dark:bg-card-dark shadow-card dark:shadow-card-dark py-8 px-4 sm:rounded-lg sm:px-10">
          {success ? (
            <div className="space-y-4">
              <div className="bg-success/10 dark:bg-success-dark/10 border border-success/20 dark:border-success-dark/20 text-success dark:text-success-dark px-4 py-3 rounded-md text-sm">
                <p>Registration successful! Please check your email to confirm your account.</p>
                <p className="mt-2">After confirming your email, you can sign in to your account.</p>
              </div>
              <div className="text-center">
                <Link
                  to="/login"
                  className="font-medium text-secondary dark:text-secondary-dark hover:text-secondary/80 dark:hover:text-secondary-dark/80"
                >
                  Go to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleRegister}>
              {error && (
                <div className="bg-error/10 dark:bg-error-dark/10 border border-error/20 dark:border-error-dark/20 text-error dark:text-error-dark px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-input-border dark:border-input-border-dark shadow-sm focus:border-secondary dark:focus:border-secondary-dark focus:ring-secondary dark:focus:ring-secondary-dark sm:text-sm bg-input dark:bg-input-dark text-text-primary dark:text-text-primary-dark"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-secondary dark:bg-secondary-dark hover:bg-secondary/90 dark:hover:bg-secondary-dark/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary dark:focus:ring-secondary-dark disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}