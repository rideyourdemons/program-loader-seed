
class MINDSecurityGateSimulator {
  verifyLevelAccess(session, requiredLevel) {
    if (!session.authToken || !session.authToken.startsWith("MIND-SEC-")) {
      return { authorized: false, code: "ERR_MALFORMED_TOKEN" };
    }
    if (requiredLevel === 1) return { authorized: true, code: "AUTH_LEVEL_1_OK" };
    if (requiredLevel === 2) {
      if (session.assignedRole === "GEOLOGIST" || session.assignedRole === "EXPLORATION_MANAGER") return { authorized: true, code: "AUTH_LEVEL_2_OK" };
      return { authorized: false, code: "ERR_UNAUTHORIZED_ROLE_TIER_2" };
    }
    if (requiredLevel === 3) {
      if (session.assignedRole === "EXPLORATION_MANAGER") return { authorized: true, code: "AUTH_LEVEL_3_OK" };
      return { authorized: false, code: "ERR_UNAUTHORIZED_ROLE_TIER_3" };
    }
    return { authorized: false, code: "ERR_UNKNOWN" };
  }
}

const gate = new MINDSecurityGateSimulator();

const badSession = { username: "Bobby Crew-Hand", assignedRole: "DRILL_CREW", authToken: "MIND-SEC-CREW-101" };
const goodSession = { username: "Jill Investor-Admin", assignedRole: "EXPLORATION_MANAGER", authToken: "MIND-SEC-EXEC-999" };

console.log("================================================================================");
console.log("??? SECURITY GATE ACCESS RECONCILIATION EVALUATION");
console.log("================================================================================");

const attempt1 = gate.verifyLevelAccess(badSession, 3);
console.log(`? User [${badSession.username}] attempted access to LEVEL 3 (EXECUTIVE BRAIN):`);
console.log(`   -> Authorized: ${attempt1.authorized} | Audit Code: ${attempt1.code}`);

console.log("--------------------------------------------------------------------------------");

const attempt2 = gate.verifyLevelAccess(goodSession, 3);
console.log(`? User [${goodSession.username}] attempted access to LEVEL 3 (EXECUTIVE BRAIN):`);
console.log(`   -> Authorized: ${attempt2.authorized} | Audit Code: ${attempt2.code}`);
console.log("================================================================================");

