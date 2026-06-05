export type CostRecord = { projectId: string; holeId?: string; category: 'labor' | 'fuel' | 'bits' | 'mud' | 'travel' | 'repairs' | 'helicopter' | 'other'; amount: number; currency: 'CAD' | 'USD'; notes?: string; };

