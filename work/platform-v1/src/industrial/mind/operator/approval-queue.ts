export type ApprovalDecision = 'approve' | 'reject' | 'edit';
export function createApprovalQueueItem() { return { status: 'placeholder', requiresHumanApproval: true }; }

