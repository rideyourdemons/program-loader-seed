export type LessonLearned = { id: string; projectId?: string; holeId?: string; topic: string; lesson: string; source: 'crew-log' | 'supervisor' | 'public-record' | 'operator-review'; requiresApproval: boolean; };

