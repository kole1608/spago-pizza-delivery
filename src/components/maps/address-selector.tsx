'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { MapPin, Search, Navigation, AlertCircle, CheckCircle } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'

interface AddressInfo {
  formattedAddress: string
  streetNumber?: string
  streetName?: string
  city?: string
  postalCode?: string
  country?: string
  coordinates: {
    lat: number
    lng: number
  }
  placeId: string
}

interface AddressSelectorProps {
  onAddressSelect?: (address: AddressInfo) => void
  placeholder?: string
  label?: string
  defaultValue?: string
  className?: string
  required?: boolean
  disabled?: boolean
  showMap?: boolean
  restrictToCountry?: string
  deliveryZone?: {
    center: { lat: number; lng: number }
    radius: number // in kilometers
  }
}

interface DeliveryZoneInfo {
  isInZone: boolean
  distance?: number
  deliveryFee?: number
  estimatedTime?: string
}

export function AddressSelector({
  onAddressSelect,
  placeholder = "Enter your delivery address...",
  label = "Delivery Address",
  defaultValue = "",
  className,
  required = false,
  disabled = false,
  showMap = false,
  restrictToCountry = "RS", // Serbia by default
  deliveryZone
}: AddressSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<AddressInfo | null>(null)
  const [zoneInfo, setZoneInfo] = useState<DeliveryZoneInfo | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)

  // Google Maps loader
  const loader = new Loader({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key',
    version: 'weekly',
    libraries: ['places', 'geometry']
  })

  // Initialize Google Places Autocomplete
  const initializeAutocomplete = useCallback(async () => {
    try {
      if (!inputRef.current) return

      await loader.load()

      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: restrictToCountry ? { country: restrictToCountry } : undefined,
        fields: [
          'formatted_address',
          'address_components', 
          'geometry',
          'place_id',
          'name'
        ],
        types: ['address']
      })

      autocompleteRef.current = autocomplete

      // Handle place selection
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        
        if (place.geometry?.location && place.formatted_address) {
          const addressInfo = parseAddressComponents(place)
          setSelectedAddress(addressInfo)
          
          // Check delivery zone
          if (deliveryZone) {
            checkDeliveryZone(addressInfo.coordinates)
          }

          // Update map if enabled
          if (showMap && map) {
            updateMapLocation(addressInfo.coordinates)
          }

          // Callback
          if (onAddressSelect) {
            onAddressSelect(addressInfo)
          }
        }
      })

      setIsLoaded(true)

      // Initialize map if needed
      if (showMap && mapRef.current) {
        initializeMap()
      }

    } catch (error) {
      console.error('Error initializing Google Places:', error)
      setIsError(true)
    }
  }, [restrictToCountry, deliveryZone, showMap, onAddressSelect])

  // Parse address components from Google Places result
  const parseAddressComponents = (place: google.maps.places.PlaceResult): AddressInfo => {
    const components = place.address_components || []
    
    const getComponent = (type: string) => {
      return components.find(component => 
        component.types.includes(type as any)
      )?.long_name
    }

    const coordinates = {
      lat: place.geometry!.location!.lat(),
      lng: place.geometry!.location!.lng()
    }

    return {
      formattedAddress: place.formatted_address || '',
      streetNumber: getComponent('street_number'),
      streetName: getComponent('route'),
      city: getComponent('locality') || getComponent('administrative_area_level_1'),
      postalCode: getComponent('postal_code'),
      country: getComponent('country'),
      coordinates,
      placeId: place.place_id || ''
    }
  }

  // Check if address is within delivery zone
  const checkDeliveryZone = (coordinates: { lat: number; lng: number }) => {
    if (!deliveryZone) return

    const center = new google.maps.LatLng(deliveryZone.center.lat, deliveryZone.center.lng)
    const destination = new google.maps.LatLng(coordinates.lat, coordinates.lng)
    
    const distance = google.maps.geometry.spherical.computeDistanceBetween(center, destination) / 1000 // km
    const isInZone = distance <= deliveryZone.radius

    // Calculate delivery fee based on distance
    let deliveryFee = 0
    let estimatedTime = "25-35 min"
    
    if (isInZone) {
      if (distance <= 3) {
        deliveryFee = 0 // Free delivery for close addresses
        estimatedTime = "15-25 min"
      } else if (distance <= 5) {
        deliveryFee = 2
        estimatedTime = "20-30 min"
      } else {
        deliveryFee = 3
        estimatedTime = "25-40 min"
      }
    }

    setZoneInfo({
      isInZone,
      distance: Math.round(distance * 10) / 10,
      deliveryFee,
      estimatedTime
    })
  }

  // Initialize map for address preview
  const initializeMap = async () => {
    if (!mapRef.current) return

    try {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 44.7866, lng: 20.4489 }, // Belgrade center
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      })

      setMap(mapInstance)

      // Add delivery zone circle if provided
      if (deliveryZone) {
        new google.maps.Circle({
          strokeColor: '#ea580c',
          strokeOpacity: 0.3,
          strokeWeight: 2,
          fillColor: '#ea580c',
          fillOpacity: 0.1,
          map: mapInstance,
          center: deliveryZone.center,
          radius: deliveryZone.radius * 1000 // Convert km to meters
        })
      }

    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  // Update map location when address is selected
  const updateMapLocation = (coordinates: { lat: number; lng: number }) => {
    if (!map) return

    map.setCenter(coordinates)
    map.setZoom(16)

    // Update or create marker
    if (marker) {
      marker.setPosition(coordinates)
    } else {
      const newMarker = new google.maps.Marker({
        position: coordinates,
        map: map,
        title: 'Delivery Address',
        animation: google.maps.Animation.DROP
      })
      setMarker(newMarker)
    }
  }

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }

        try {
          // Reverse geocode to get address
          const geocoder = new google.maps.Geocoder()
          const result = await geocoder.geocode({ location: coordinates })
          
          if (result.results.length > 0) {
            const place = result.results[0]
            const addressInfo: AddressInfo = {
              formattedAddress: place.formatted_address,
              coordinates,
              placeId: place.place_id
            }

            setSelectedAddress(addressInfo)
            
            if (inputRef.current) {
              inputRef.current.value = place.formatted_address
            }

            if (deliveryZone) {
              checkDeliveryZone(coordinates)
            }

            if (showMap && map) {
              updateMapLocation(coordinates)
            }

            if (onAddressSelect) {
              onAddressSelect(addressInfo)
            }
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error)
        }
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Unable to get your current location. Please enter your address manually.')
      }
    )
  }

  // Initialize on mount
  useEffect(() => {
    initializeAutocomplete()
  }, [initializeAutocomplete])

  // Set default value
  useEffect(() => {
    if (defaultValue && inputRef.current) {
      inputRef.current.value = defaultValue
    }
  }, [defaultValue])

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load address autocomplete. Please enter your address manually.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Address Input */}
        <div className="space-y-2">
          <Label htmlFor="address-input">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            
            <Input
              ref={inputRef}
              id="address-input"
              placeholder={placeholder}
              disabled={disabled || !isLoaded}
              className="pl-10 pr-12"
              required={required}
            />
            
            {!isLoaded && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-b-2 border-orange-600 rounded-full"></div>
              </div>
            )}
          </div>
          
          {/* Current Location Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={!isLoaded}
            className="w-full"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Use Current Location
          </Button>
        </div>

        {/* Delivery Zone Information */}
        {zoneInfo && selectedAddress && (
          <Card className={`border ${zoneInfo.isInZone ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {zoneInfo.isInZone ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-medium ${zoneInfo.isInZone ? 'text-green-900' : 'text-red-900'}`}>
                      {zoneInfo.isInZone ? 'Delivery Available' : 'Outside Delivery Zone'}
                    </span>
                    <Badge variant={zoneInfo.isInZone ? 'default' : 'destructive'}>
                      {zoneInfo.distance}km away
                    </Badge>
                  </div>
                  
                  {zoneInfo.isInZone ? (
                    <div className="space-y-1 text-sm text-green-800">
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span className="font-medium">
                          {zoneInfo.deliveryFee === 0 ? 'FREE' : `€${zoneInfo.deliveryFee}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Time:</span>
                        <span className="font-medium">{zoneInfo.estimatedTime}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-red-800">
                      This address is outside our delivery zone. Please choose a different address or visit our store.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Preview */}
        {showMap && (
          <div className="space-y-2">
            <Label>Address Preview</Label>
            <div 
              ref={mapRef}
              className="w-full h-64 rounded-lg overflow-hidden bg-gray-200 relative"
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
            
            {deliveryZone && (
              <p className="text-xs text-gray-600 text-center">
                Orange area shows our delivery zone
              </p>
            )}
          </div>
        )}

        {/* Selected Address Display */}
        {selectedAddress && (
          <Card className="bg-gray-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedAddress.formattedAddress}</p>
                  {selectedAddress.city && selectedAddress.postalCode && (
                    <p className="text-xs text-gray-600">
                      {selectedAddress.city}, {selectedAddress.postalCode}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 