// Example: How to use engines in React components
import toolRotation from './utils/tool-rotation.js';
import complianceMiddleware from './utils/compliance-middleware.js';
import { MatrixEngine } from './utils/matrix-engine.js';
import { AuthorityEngine } from './utils/authority-engine.js';
import aiTourGuide from './utils/ai-tour-guide.js';

// Example usage in a React component
export function useEngines() {
  // Tool Rotation
  const getToolOfDay = (tools) => {
    return toolRotation.getToolOfTheDay(tools);
  };
  
  // Compliance
  const checkCompliance = async (content, region) => {
    return await complianceMiddleware.processContent(content, region);
  };
  
  // Matrix Engine
  const calculateMatrix = (text) => {
    const engine = new MatrixEngine(mockFirebaseBackend);
    return engine.calculateNumerologicalValue(text);
  };
  
  // Authority Engine
  const calculateAuthority = async (painPointId) => {
    const engine = new AuthorityEngine(mockFirebaseBackend);
    return await engine.calculateAuthorityScore(painPointId);
  };
  
  // AI Tour Guide
  const startTour = () => {
    aiTourGuide.start();
  };
  
  return {
    getToolOfDay,
    checkCompliance,
    calculateMatrix,
    calculateAuthority,
    startTour
  };
}
