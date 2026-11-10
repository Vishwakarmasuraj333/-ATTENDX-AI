import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FaceBoundingBox, BoundingBoxData } from '../components/face/FaceBoundingBox'

describe('FaceBoundingBox Real-time Overlay Tests', () => {
  it('renders verified student face bounding box with name and confidence', () => {
    const mockResults: BoundingBoxData[] = [
      {
        bbox: [100, 80, 140, 160],
        detection_confidence: 0.96,
        liveness_score: 0.88,
        liveness_status: 'Passed',
        match_status: 'Verified',
        confidence_score: 0.942,
        matched_student_name: 'Aarav Mehta',
        matched_enrollment_number: 'EN2026_001',
        attendance_marked: true,
      },
    ]

    render(<FaceBoundingBox results={mockResults} videoWidth={640} videoHeight={480} />)

    expect(screen.getByText(/Verified: Aarav Mehta/i)).toBeInTheDocument()
    expect(screen.getByText('94%')).toBeInTheDocument()
  })

  it('renders spoof detection alert when anti-spoofing flags presentation attack', () => {
    const mockResults: BoundingBoxData[] = [
      {
        bbox: [120, 100, 150, 150],
        detection_confidence: 0.92,
        liveness_score: 0.35,
        liveness_status: 'Failed',
        match_status: 'Spoof Detected',
        confidence_score: 0.0,
        attendance_marked: false,
      },
    ]

    render(<FaceBoundingBox results={mockResults} />)

    expect(screen.getByText(/Spoof Detected \(PAD Alert\)/i)).toBeInTheDocument()
  })

  it('renders inconclusive liveness state with amber warning', () => {
    const mockResults: BoundingBoxData[] = [
      {
        bbox: [120, 100, 150, 150],
        detection_confidence: 0.85,
        liveness_score: 0.62,
        liveness_status: 'Inconclusive',
        match_status: 'Inconclusive',
        confidence_score: 0.0,
        attendance_marked: false,
      },
    ]

    render(<FaceBoundingBox results={mockResults} />)

    expect(screen.getByText(/Liveness Inconclusive/i)).toBeInTheDocument()
  })

  it('renders unknown unregistered individual rejection tag', () => {
    const mockResults: BoundingBoxData[] = [
      {
        bbox: [80, 80, 130, 140],
        detection_confidence: 0.91,
        liveness_score: 0.82,
        liveness_status: 'Passed',
        match_status: 'Unknown',
        confidence_score: 0.41,
        attendance_marked: false,
      },
    ]

    render(<FaceBoundingBox results={mockResults} />)

    expect(screen.getByText(/Unregistered \/ Unknown/i)).toBeInTheDocument()
    expect(screen.getByText('41%')).toBeInTheDocument()
  })
})
