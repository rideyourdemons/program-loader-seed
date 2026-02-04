export const registry = new Map();

export function registerProgram(name, program, metadata = {}) {
  registry.set(name, {
    program,
    metadata: {
      ...metadata,
      registeredAt: Date.now()
    }
  });
}

export function getProgram(name) {
  const entry = registry.get(name);
  return entry ? entry.program : null;
}

export function getProgramMetadata(name) {
  const entry = registry.get(name);
  return entry ? entry.metadata : null;
}

export function getAllPrograms() {
  return Array.from(registry.keys());
}

export function hasProgram(name) {
  return registry.has(name);
}

