import { useState, useEffect, useCallback, useRef } from 'react'

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watch?: boolean
}

interface GeolocationState {
  location: GeolocationPosition | null
  error: GeolocationPositionError | null
  isLoading: boolean
}

interface UseGeolocationReturn extends GeolocationState {
  getCurrentLocation: () => Promise<GeolocationPosition>
  startTracking: () => void
  stopTracking: () => void
  clearError: () => void
}

export function useGeolocation(options: GeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = false,
    timeout = 5000,
    maximumAge = 0,
    watch = false
  } = options

  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    isLoading: false
  })

  const watchIdRef = useRef<number | null>(null)
  const isWatchingRef = useRef(false)

  const geolocationOptions: PositionOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge
  }

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState(prev => ({
      ...prev,
      location: position,
      error: null,
      isLoading: false
    }))
  }, [])

  const handleError = useCallback((error: GeolocationPositionError) => {
    setState(prev => ({
      ...prev,
      error,
      isLoading: false
    }))
  }, [])

  const getCurrentLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by this browser') as any
        error.code = 0
        reject(error)
        return
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }))

      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleSuccess(position)
          resolve(position)
        },
        (error) => {
          handleError(error)
          reject(error)
        },
        geolocationOptions
      )
    })
  }, [geolocationOptions, handleSuccess, handleError])

  const startTracking = useCallback(() => {
    if (!navigator.geolocation || isWatchingRef.current) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    )

    isWatchingRef.current = true
  }, [geolocationOptions, handleSuccess, handleError])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      isWatchingRef.current = false
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Auto-start tracking if watch is enabled
  useEffect(() => {
    if (watch) {
      startTracking()
    }

    return () => {
      stopTracking()
    }
  }, [watch, startTracking, stopTracking])

  // Get initial location if not watching
  useEffect(() => {
    if (!watch && navigator.geolocation) {
      getCurrentLocation().catch(() => {
        // Ignore errors for initial load
      })
    }
  }, [watch, getCurrentLocation])

  return {
    ...state,
    getCurrentLocation,
    startTracking,
    stopTracking,
    clearError
  }
}