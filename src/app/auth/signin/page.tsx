'use client';

import { signIn, getSession } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      if (result?.ok) {
        // Get updated session to check role
        const session = await getSession();
        
        // Redirect based on role
        if (session?.user?.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (session?.user?.role === 'KITCHEN_STAFF') {
          router.push('/kitchen');
        } else if (session?.user?.role === 'DELIVERY_DRIVER') {
          router.push('/driver');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Neispravni podaci za prijavu');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Greška pri prijavljivanju');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🍕 Spago Pizza Login</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          
          <button 
            type="submit" 
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            disabled={loading}
          >
            {loading ? 'Prijavljivanje...' : 'Prijavite se'}
          </button>
        </form>
        
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-center text-gray-700">Demo nalozi:</h4>
          <div className="space-y-2">
            <button
              onClick={() => demoLogin('admin@spago.com')}
              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm border"
            >
              <strong>👨‍💼 Administrator:</strong> admin@spago.com
            </button>
            <button
              onClick={() => demoLogin('kitchen@spago.com')}
              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm border"
            >
              <strong>👨‍🍳 Kuhinja:</strong> kitchen@spago.com
            </button>
            <button
              onClick={() => demoLogin('driver@spago.com')}
              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm border"
            >
              <strong>🚗 Dostavljač:</strong> driver@spago.com
            </button>
          </div>
          <div className="text-xs text-center text-gray-500">
            Svi demo nalozi koriste lozinku: <strong>password123</strong>
          </div>
        </div>
      </div>
    </div>
  );
} 