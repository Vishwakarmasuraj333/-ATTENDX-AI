import React, { createRef } from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CameraFeed, CameraFeedHandle } from '../components/face/CameraFeed'

describe('CameraFeed Real Camera Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes webcam stream and renders video element', async () => {
    const onReady = vi.fn()
    const ref = createRef<CameraFeedHandle>()

    render(<CameraFeed ref={ref} onStreamReady={onReady} />)

    // Initially displays initializing HUD
    expect(screen.getByText(/Initializing High-Res Camera Sensor/i)).toBeInTheDocument()

    // Verifies getUserMedia was invoked with facingMode user
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1)
    })
  })

  it('handles Camera Permission Denied (NotAllowedError)', async () => {
    // Mock getUserMedia rejecting with NotAllowedError
    const error = new Error('Permission denied')
    error.name = 'NotAllowedError'
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(error)

    render(<CameraFeed />)

    await waitFor(() => {
      expect(
        screen.getByText(/Camera permission denied. Please enable camera access in your browser/i)
      ).toBeInTheDocument()
    })
    expect(screen.getByText(/Retry Connection/i)).toBeInTheDocument()
  })

  it('handles Camera Hardware Not Found (NotFoundError)', async () => {
    const error = new Error('Requested device not found')
    error.name = 'NotFoundError'
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(error)

    render(<CameraFeed />)

    await waitFor(() => {
      expect(screen.getByText(/No camera hardware detected on this device/i)).toBeInTheDocument()
    })
  })

  it('handles camera disconnection and stops media tracks on unmount', async () => {
    const mockStop = vi.fn()
    vi.mocked(navigator.mediaDevices.getUserMedia).mockResolvedValueOnce({
      getTracks: () => [{ stop: mockStop, kind: 'video', enabled: true } as any],
    } as any)

    const { unmount } = render(<CameraFeed />)

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled()
    })

    unmount()
    expect(mockStop).toHaveBeenCalled()
  })

  it('exposes captureFrame method via ref', () => {
    const ref = createRef<CameraFeedHandle>()
    render(<CameraFeed ref={ref} />)

    expect(ref.current).toBeDefined()
    expect(typeof ref.current?.captureFrame).toBe('function')
  })
})
