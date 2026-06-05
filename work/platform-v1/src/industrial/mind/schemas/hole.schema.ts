export type DrillHole = { id: string; siteId: string; holeName: string; targetDepthMeters?: number; finalDepthMeters?: number; status: 'planned' | 'active' | 'complete' | 'abandoned'; };

