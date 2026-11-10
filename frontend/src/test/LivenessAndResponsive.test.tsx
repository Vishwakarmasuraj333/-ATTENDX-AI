import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LivenessIndicator } from '../components/face/LivenessIndicator'
import { MetricCard } from '../components/ui/MetricCard'
import { Users } from 'lucide-react'

describe('LivenessIndicator & Responsive HUD Tests', () => {
  it('renders passive liveness status and percentage indicators', () => {
    render(<LivenessIndicator isScanning={true} livenessScore={0.85} qualityScore={0.92} />)

    expect(screen.getByText(/Passive Liveness Active/i)).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText(/Image Quality:/i)).toBeInTheDocument()
    expect(screen.getByText('92%')).toBeInTheDocument()
    expect(screen.getByText(/Align face inside reticle/i)).toBeInTheDocument()
  })

  it('renders UI MetricCard component with responsive typography and icons', () => {
    render(
      <MetricCard
        title="Total Enrolled"
        value={120}
        subtitle="+12 this semester"
        icon={Users}
      />
    )

    expect(screen.getByText('Total Enrolled')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('+12 this semester')).toBeInTheDocument()
  })
})
