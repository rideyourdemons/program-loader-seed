
export type UserRole = "DRILL_CREW" | "GEOLOGIST" | "EXPLORATION_MANAGER";

export interface UserSession {
  username: string;
  assignedRole: UserRole;
  authToken: string;
}

export class MINDSecurityGate {
  /**
   * Evaluates if a given user session is authorized to view or edit a target platform brain level
   */
  public verifyLevelAccess(session: UserSession, requiredLevel: number): { authorized: boolean; internalCode: string } {
    // Basic structural integrity check
    if (!session.authToken || !session.authToken.startsWith("MIND-SEC-")) {
      return { authorized: false, internalCode: "ERR_MALFORMED_TOKEN" };
    }

    switch (requiredLevel) {
      case 1:
        // Level 1: Training & Crew App - accessible by all active personnel
        return { authorized: true, internalCode: "AUTH_LEVEL_1_OK" };
        
      case 2:
        // Level 2: Operations Cockpit - locked to Geologists and Managers
        if (session.assignedRole === "GEOLOGIST" || session.assignedRole === "EXPLORATION_MANAGER") {
          return { authorized: true, internalCode: "AUTH_LEVEL_2_OK" };
        }
        return { authorized: false, internalCode: "ERR_UNAUTHORIZED_ROLE_TIER_2" };
        
      case 3:
        // Level 3: Executive Capital Portal - strictly locked to Exploration Managers
        if (session.assignedRole === "EXPLORATION_MANAGER") {
          return { authorized: true, internalCode: "AUTH_LEVEL_3_OK" };
        }
        return { authorized: false, internalCode: "ERR_UNAUTHORIZED_ROLE_TIER_3" };
        
      default:
        return { authorized: false, internalCode: "ERR_INVALID_BRAIN_LEVEL_TARGET" };
    }
  }
}

