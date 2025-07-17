'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">🍕 Spago Pizza</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <h2 className="text-xl font-bold mb-4 text-red-600">Greška pri prijavljivanju</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-700">
                {error === 'CredentialsSignin' && 'Neispravni podaci za prijavu'}
                {error === 'AccessDenied' && 'Pristup odbijen'}
                {error === 'Configuration' && 'Greška u konfiguraciji'}
                {error !== 'CredentialsSignin' && error !== 'AccessDenied' && error !== 'Configuration' && `Greška: ${error}`}
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-600 mb-6">
            Molimo pokušajte ponovo sa ispravnim podacima.
          </p>
          
          <Link href="/auth/signin">
            <Button className="w-full bg-red-600 hover:bg-red-700">
              Nazad na prijavu
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
} 