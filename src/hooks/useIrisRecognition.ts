'use client'

import { useAnalytics } from '@/hooks/useAnalytics'
import { useBiometric } from '@/services/biometric/BiometricProvider'
import { useMediaPipe } from '@/services/mediapipe/MediaPipeProvider'
import { useCallback, useEffect, useState } from 'react'

export interface IrisData {
  leftIris: {
    center: { x: number; y: number }
    landmarks: Array<{ x: number; y: number }>
    confidence: number
  }
  rightIris: {
    center: { x: number; y: number }
    landmarks: Array<{ x: number; y: number }>
    confidence: number
  }
  timestamp: number
}

export interface IrisRecognitionState {
  isScanning: boolean
  isProcessing: boolean
  currentIrisData: IrisData | null
  recognitionResult: {
    isMatch: boolean
    confidence: number
    userId?: string
  } | null
  error: string | null
}

export const useIrisRecognition = () => {
  const [state, setState] = useState<IrisRecognitionState>({
    isScanning: false,
    isProcessing: false,
    currentIrisData: null,
    recognitionResult: null,
    error: null,
  })

  const { mediaPipeService } = useMediaPipe()
  const { biometricService } = useBiometric()
  const { trackEvent } = useAnalytics()

  const startScanning = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isScanning: true,
        error: null,
      }))

      await mediaPipeService.startFaceDetection()
      trackEvent('iris_scan_started')
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start iris scanning',
        isScanning: false,
      }))
    }
  }, [mediaPipeService, trackEvent])

  const stopScanning = useCallback(async () => {
    try {
      await mediaPipeService.stopFaceDetection()
      setState((prev) => ({
        ...prev,
        isScanning: false,
      }))
      trackEvent('iris_scan_stopped')
    } catch (error) {
      console.error('Error stopping iris scanning:', error)
    }
  }, [mediaPipeService, trackEvent])

  const processIrisData = useCallback(
    async (frameData: any) => {
      if (!state.isScanning || state.isProcessing) return

      setState((prev) => ({ ...prev, isProcessing: true }))

      try {
        // Extract iris data from MediaPipe results
        const irisData = await extractIrisData(frameData)

        if (irisData) {
          setState((prev) => ({
            ...prev,
            currentIrisData: irisData,
          }))

          // Perform iris recognition
          const recognitionResult = await biometricService.recognizeIris(irisData)

          setState((prev) => ({
            ...prev,
            recognitionResult,
          }))

          trackEvent('iris_recognition_completed', {
            success: recognitionResult.isMatch,
            confidence: recognitionResult.confidence,
          })
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to process iris data',
        }))
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }))
      }
    },
    [state.isScanning, state.isProcessing, biometricService, trackEvent],
  )

  const enrollIris = useCallback(
    async (userId: string) => {
      if (!state.currentIrisData) {
        throw new Error('No iris data available for enrollment')
      }

      try {
        setState((prev) => ({ ...prev, isProcessing: true }))

        await biometricService.enrollIris(userId, state.currentIrisData)

        trackEvent('iris_enrollment_completed', { userId })

        return true
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to enroll iris',
        }))
        return false
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }))
      }
    },
    [state.currentIrisData, biometricService, trackEvent],
  )

  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentIrisData: null,
      recognitionResult: null,
      error: null,
    }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isScanning) {
        stopScanning()
      }
    }
  }, [state.isScanning, stopScanning])

  return {
    ...state,
    startScanning,
    stopScanning,
    processIrisData,
    enrollIris,
    clearResults,
  }
}

// Helper function to extract iris data from MediaPipe results
const extractIrisData = async (frameData: any): Promise<IrisData | null> => {
  try {
    // This would be implemented based on MediaPipe's face mesh results
    // For now, returning mock data structure
    if (!frameData?.faceLandmarks) return null

    const landmarks = frameData.faceLandmarks[0]
    if (!landmarks) return null

    // Extract iris landmarks (indices based on MediaPipe face mesh)
    const leftIrisIndices = [468, 469, 470, 471, 472] // Left iris landmarks
    const rightIrisIndices = [473, 474, 475, 476, 477] // Right iris landmarks

    const leftIrisLandmarks = leftIrisIndices.map((index) => ({
      x: landmarks[index]?.x || 0,
      y: landmarks[index]?.y || 0,
    }))

    const rightIrisLandmarks = rightIrisIndices.map((index) => ({
      x: landmarks[index]?.x || 0,
      y: landmarks[index]?.y || 0,
    }))

    // Calculate iris centers
    const leftCenter = calculateCenter(leftIrisLandmarks)
    const rightCenter = calculateCenter(rightIrisLandmarks)

    return {
      leftIris: {
        center: leftCenter,
        landmarks: leftIrisLandmarks,
        confidence: frameData.confidence || 0.8,
      },
      rightIris: {
        center: rightCenter,
        landmarks: rightIrisLandmarks,
        confidence: frameData.confidence || 0.8,
      },
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error('Error extracting iris data:', error)
    return null
  }
}

const calculateCenter = (landmarks: Array<{ x: number; y: number }>) => {
  const sum = landmarks.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 },
  )

  return {
    x: sum.x / landmarks.length,
    y: sum.y / landmarks.length,
  }
}
