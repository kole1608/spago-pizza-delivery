'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { MapPin, Navigation, Clock, Phone, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWebSocketStore } from '@/stores/websocket-store'

interface DeliveryMapProps {
  orderId: string
  customerAddress: string
  storeAddress: string
  driverId?: string
  className?: string
  height?: string
}

interface RouteInfo {
  distance: string
  duration: string
  steps: google.maps.DirectionsStep[]
}

interface DriverInfo {
  id: string
  name: string
  phone: string
  rating: number
  vehicleType: 'car' | 'bike' | 'scooter'
  currentLocation: {
    lat: number
    lng: number
  }
  lastUpdate: Date
}

// Mock driver data
const mockDriver: DriverInfo = {
  id: 'driver-123',
  name: 'Marko Petrović',
  phone: '+381 64 123 4567',
  rating: 4.8,
  vehicleType: 'car',
  currentLocation: {
    lat: 44.7866, // Belgrade coordinates
    lng: 20.4489
  },
  lastUpdate: new Date()
}

export function DeliveryMap({ 
  orderId, 
  customerAddress, 
  storeAddress,
  driverId,
  className,
  height = '400px'
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [driverMarker, setDriverMarker] = useState<google.maps.Marker | null>(null)
  const [routeRenderer, setRouteRenderer] = useState<google.maps.DirectionsRenderer | null>(null)
  
  const { driverLocations, getOrderStatus } = useWebSocketStore()
  
  const orderStatus = getOrderStatus(orderId)
  const driverData = driverId ? driverLocations[driverId] : null

  // Google Maps loader configuration
  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key',
    version: 'weekly',
    libraries: ['places', 'directions']
  })

  // Initialize Google Maps
  const initializeMap = useCallback(async () => {
    try {
      if (!mapRef.current) return

      await loader.load()
      
      // Default to Belgrade if geocoding fails
      const defaultCenter = { lat: 44.7866, lng: 20.4489 }
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      setMap(mapInstance)
      setIsLoaded(true)

      // Initialize route renderer
      const renderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#ea580c',
          strokeOpacity: 0.8,
          strokeWeight: 5
        }
      })
      renderer.setMap(mapInstance)
      setRouteRenderer(renderer)

      // Set up places if addresses are provided
      if (customerAddress && storeAddress) {
        await setupRoute(mapInstance, renderer)
      }

    } catch (error) {
      console.error('Error initializing Google Maps:', error)
      setIsError(true)
    }
  }, [customerAddress, storeAddress])

  // Setup route between store and customer
  const setupRoute = async (
    mapInstance: google.maps.Map, 
    renderer: google.maps.DirectionsRenderer
  ) => {
    try {
      const directionsService = new google.maps.DirectionsService()
      
      const request: google.maps.DirectionsRequest = {
        origin: storeAddress,
        destination: customerAddress,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }

      const result = await directionsService.route(request)
      
      if (result.routes.length > 0) {
        renderer.setDirections(result)
        
        const route = result.routes[0]
        const leg = route.legs[0]
        
        setRouteInfo({
          distance: leg.distance?.text || 'Unknown',
          duration: leg.duration?.text || 'Unknown',
          steps: leg.steps || []
        })

        // Add custom markers for store and customer
        addCustomMarkers(mapInstance, result)
      }

    } catch (error) {
      console.error('Error setting up route:', error)
    }
  }

  // Add custom markers for store and customer locations
  const addCustomMarkers = (mapInstance: google.maps.Map, result: google.maps.DirectionsResult) => {
    const route = result.routes[0]
    const leg = route.legs[0]

    // Store marker
    new google.maps.Marker({
      position: leg.start_location,
      map: mapInstance,
      title: 'Spago Pizza - Store',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" fill="#ea580c" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">🏪</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32)
      }
    })

    // Customer marker  
    new google.maps.Marker({
      position: leg.end_location,
      map: mapInstance,
      title: 'Delivery Address',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" fill="#10b981" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">🏠</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32)
      }
    })
  }

  // Update driver location on map
  const updateDriverLocation = useCallback((location: { lat: number; lng: number }) => {
    if (!map) return

    if (driverMarker) {
      driverMarker.setPosition(location)
    } else {
      const marker = new google.maps.Marker({
        position: location,
        map: map,
        title: 'Delivery Driver',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" fill="#3b82f6" stroke="white" stroke-width="2"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">🚗</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32)
        },
        animation: google.maps.Animation.BOUNCE
      })
      setDriverMarker(marker)
      
      // Stop bouncing after 2 seconds
      setTimeout(() => {
        marker.setAnimation(null)
      }, 2000)
    }

    // Center map on driver if out for delivery
    if (orderStatus?.status === 'out_for_delivery') {
      map.panTo(location)
    }
  }, [map, driverMarker, orderStatus?.status])

  // Initialize map on component mount
  useEffect(() => {
    initializeMap()
  }, [initializeMap])

  // Update driver location when data changes
  useEffect(() => {
    if (driverData?.location) {
      updateDriverLocation(driverData.location)
    } else {
      // Use mock data for demo
      updateDriverLocation(mockDriver.currentLocation)
    }
  }, [driverData?.location, updateDriverLocation])

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'bike': return '🚴'
      case 'scooter': return '🛵'
      default: return '🚗'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'out_for_delivery': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load map. Please check your internet connection or contact support.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Delivery Tracking
          </span>
          {orderStatus?.status && (
            <Badge className={getStatusColor(orderStatus.status)}>
              {orderStatus.status.replace('_', ' ')}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Map Container */}
        <div 
          ref={mapRef} 
          style={{ height }}
          className="w-full rounded-lg overflow-hidden bg-gray-200 relative"
        >
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-orange-600 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Route Information */}
        {routeInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Distance</span>
              </div>
              <p className="text-lg font-bold text-blue-800">{routeInfo.distance}</p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Estimated Time</span>
              </div>
              <p className="text-lg font-bold text-green-800">{routeInfo.duration}</p>
            </div>
          </div>
        )}

        {/* Driver Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <span className="text-lg">{getVehicleIcon(mockDriver.vehicleType)}</span>
            Your Driver
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-900">{mockDriver.name}</p>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <span>⭐ {mockDriver.rating}</span>
                <span>•</span>
                <span className="capitalize">{mockDriver.vehicleType}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                <Phone className="h-3 w-3 mr-1" />
                Call Driver
              </Button>
            </div>
          </div>
          
          {orderStatus?.estimatedDelivery && (
            <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
              <span className="font-medium text-blue-900">ETA:</span>
              <span className="text-blue-800 ml-1">
                {new Date(orderStatus.estimatedDelivery).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        {/* Delivery Instructions */}
        <div className="text-sm text-gray-600">
          <h5 className="font-medium mb-2">Delivery Instructions:</h5>
          <ul className="space-y-1">
            <li>• Driver will call upon arrival</li>
            <li>• Please have your order number ready: #{orderId.slice(-6)}</li>
            <li>• Contact support if you have any issues</li>
          </ul>
        </div>

        {/* Map Legend */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600 border-t pt-3">
          <div className="flex items-center gap-1">
            <span className="text-base">🏪</span>
            <span>Store</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-base">🚗</span>
            <span>Driver</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-base">🏠</span>
            <span>Delivery</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 