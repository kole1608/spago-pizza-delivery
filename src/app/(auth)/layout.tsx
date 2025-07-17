import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/loading-skeleton'

export const metadata: Metadata = {
  title: 'Authentication | Spago Pizza Delivery',
  description: 'Sign in or create an account to order delicious pizza',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="lg:w-1/2 bg-gradient-to-br from-orange-500 to-red-600 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md text-center">
          <Link href="/" className="inline-block mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">🍕</span>
              </div>
              <span className="text-3xl font-bold">Spago Pizza</span>
            </div>
          </Link>
          
          <h1 className="text-4xl font-bold mb-4">
            Welcome to Spago Pizza
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Authentic Italian cuisine delivered fresh to your door
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <span className="text-2xl mb-2 block">🚚</span>
              <h3 className="font-semibold">Fast Delivery</h3>
              <p className="opacity-80">30 min or less</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <span className="text-2xl mb-2 block">🏆</span>
              <h3 className="font-semibold">Premium Quality</h3>
              <p className="opacity-80">Fresh ingredients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            {children}
          </Suspense>
        </div>
      </div>
    </div>
  )
} 
