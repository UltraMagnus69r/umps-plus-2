import { usePersistedUiState } from './usePersistedUiState'

export type InspectorSegment = 'content' | 'look' | 'details'

function isInspectorSegment(v: string): v is InspectorSegment {
  return v === 'content' || v === 'look' || v === 'details'
}

/** Content | Look | Details — replaces Simple/Advanced as the primary disclosure model. */
export function useInspectorSegment(): [InspectorSegment, (next: InspectorSegment) => void] {
  return usePersistedUiState<InspectorSegment>(
    'umps-inspector-segment',
    'content',
    isInspectorSegment,
  )
}
