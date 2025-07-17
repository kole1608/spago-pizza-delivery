import Link from 'next/link'
import { ArrowRight, Clock, Truck, Star, Pizza as PizzaIcon } from 'lucide-react'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  const features = [
    {
      icon: Clock,
      title: 'Fast Delivery',
      description: 'Fresh pizza delivered to your door in 30 minutes or less',
    },
    {
      icon: PizzaIcon,
      title: 'Authentic Italian',
      description: 'Traditional recipes made with the finest imported ingredients',
    },
    {
      icon: Truck,
      title: 'Free Delivery',
      description: 'Free delivery on orders over €25 within our delivery zone',
    },
    {
      icon: Star,
      title: 'Quality Guaranteed',
      description: 'Satisfaction guaranteed or your money back',
    },
  ]

  const featuredPizzas = [
    {
      id: 1,
      name: 'Margherita',
      description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
      price: 12.00,
      image: '/images/pizzas/margherita.jpg',
      popular: true,
    },
    {
      id: 2,
      name: 'Pepperoni',
      description: 'Classic pepperoni pizza with mozzarella and tomato sauce',
      price: 15.00,
      image: '/images/pizzas/pepperoni.jpg',
      popular: true,
    },
    {
      id: 3,
      name: 'Quattro Stagioni',
      description: 'Four seasons pizza with mushrooms, ham, artichokes, and olives',
      price: 18.00,
      image: '/images/pizzas/quattro-stagioni.jpg',
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-orange-600 to-red-600 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative container mx-auto px-4 py-24 lg:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Authentic Italian Pizza
                <br />
                <span className="text-orange-200">Delivered Fresh</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-orange-100">
                Experience the taste of Italy with our handcrafted pizzas made from traditional recipes and premium ingredients.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-white text-orange-600 hover:bg-orange-50">
                  <Link href="/menu">
                    Order Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white hover:text-orange-600">
                  <Link href="/about">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Spago Pizza?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We're committed to delivering the best pizza experience with quality ingredients, fast service, and authentic flavors.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Pizzas Section */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Popular Pizzas
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Try our most loved pizzas, made with fresh ingredients and traditional Italian techniques.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPizzas.map((pizza) => (
                <Card key={pizza.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="relative">
                    <div className="h-48 bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                      <PizzaIcon className="h-16 w-16 text-orange-600" />
                    </div>
                    {pizza.popular && (
                      <Badge className="absolute top-4 left-4 bg-red-500">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {pizza.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {pizza.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-orange-600">
                        €{pizza.price.toFixed(2)}
                      </span>
                      <Button asChild>
                        <Link href={`/menu?product=${pizza.name.toLowerCase()}`}>
                          Order Now
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button size="lg" asChild variant="outline">
                <Link href="/menu">
                  View Full Menu
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Order?
            </h2>
            <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">
              Join thousands of satisfied customers who choose Spago Pizza for their authentic Italian experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-white text-orange-600 hover:bg-orange-50">
                <Link href="/menu">
                  Start Ordering
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" asChild variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600">
                <Link href="/auth/signup">
                  Create Account
                </Link>
              </Button>
            </div>
        </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
