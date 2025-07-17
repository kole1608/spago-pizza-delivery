import Link from 'next/link'
import { Pizza, Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-orange-600 p-2 rounded-lg">
                <Pizza className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Spago Pizza</span>
            </div>
            <p className="text-sm text-gray-400">
              Authentic Italian pizza delivered fresh to your door. Made with the finest ingredients and traditional recipes.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/menu" className="text-sm hover:text-orange-400 transition-colors">
                  Our Menu
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm hover:text-orange-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-orange-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-sm hover:text-orange-400 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/franchise" className="text-sm hover:text-orange-400 transition-colors">
                  Franchise
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/faq" className="text-sm hover:text-orange-400 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/delivery-info" className="text-sm hover:text-orange-400 transition-colors">
                  Delivery Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm hover:text-orange-400 transition-colors">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm hover:text-orange-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm hover:text-orange-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <span className="text-sm">
                  123 Pizza Street<br />
                  Belgrade, Serbia 11000
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <a href="tel:+381641234567" className="text-sm hover:text-orange-400 transition-colors">
                  +381 64 123 4567
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <a href="mailto:info@spagopizza.com" className="text-sm hover:text-orange-400 transition-colors">
                  info@spagopizza.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <div className="text-sm">
                  <div>Mon-Thu: 11:00 - 23:00</div>
                  <div>Fri-Sat: 11:00 - 24:00</div>
                  <div>Sunday: 12:00 - 22:00</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              Stay Updated!
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Subscribe to get special offers, free giveaways, and updates.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-400"
              />
              <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            © {currentYear} Spago Pizza. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
              Terms
            </Link>
            <Link href="/sitemap" className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 