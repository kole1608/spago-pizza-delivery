'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Pizza, ShoppingCart, Menu, X, User, LogOut, Settings, Package, UserCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCartStore } from '@/stores/cart-store'
import { cn } from '@/lib/utils'

const mainNavigation = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'Menu' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { items } = useCartStore()

  const itemCount = items.reduce((total, item) => total + item.quantity, 0)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  const getDashboardLink = () => {
    if (!session?.user?.role) return '/dashboard'
    
    switch (session.user.role) {
      case 'ADMIN':
        return '/admin/dashboard'
      case 'KITCHEN_STAFF':
        return '/kitchen/dashboard'
      case 'DELIVERY_DRIVER':
        return '/driver/dashboard'
      default:
        return '/dashboard'
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-orange-600 p-2 rounded-lg">
              <Pizza className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Spago Pizza</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-orange-600',
                  pathname === item.href ? 'text-orange-600' : 'text-gray-700'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Cart, User menu */}
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              asChild
            >
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-orange-600 hover:bg-orange-700"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* User Menu */}
            {status === 'loading' ? (
              <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <UserCircle className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {session.user?.name && (
                        <p className="font-medium">{session.user.name}</p>
                      )}
                      {session.user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardLink()}>
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
                <Button asChild className="bg-orange-600 hover:bg-orange-700">
                  <Link href="/auth/signup">Sign up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="bg-orange-600 p-2 rounded-lg">
                      <Pizza className="h-5 w-5 text-white" />
                    </div>
                    <span>Spago Pizza</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* Mobile Navigation Links */}
                  <nav className="space-y-3">
                    {mainNavigation.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'block px-3 py-2 text-base font-medium rounded-md transition-colors',
                          pathname === item.href
                            ? 'bg-orange-100 text-orange-600'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile User Section */}
                  {session ? (
                    <div className="pt-4 space-y-3 border-t">
                      <div className="px-3 py-2">
                        <p className="font-medium">{session.user?.name}</p>
                        <p className="text-sm text-gray-600">{session.user?.email}</p>
                      </div>
                      <Link
                        href={getDashboardLink()}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        <User className="mr-3 h-5 w-5" />
                        Dashboard
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        <Package className="mr-3 h-5 w-5" />
                        My Orders
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut()
                          setIsMobileMenuOpen(false)
                        }}
                        className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="pt-4 space-y-3 border-t">
                      <Button
                        variant="outline"
                        className="w-full"
                        asChild
                      >
                        <Link
                          href="/auth/signin"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Sign in
                        </Link>
                      </Button>
                      <Button
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        asChild
                      >
                        <Link
                          href="/auth/signup"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Sign up
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
} 