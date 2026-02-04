export const state = {
  startedAt: Date.now(),
  programsLoaded: [],
  programsRunning: new Map(),
  errors: []
};

export function addProgramLoaded(name) {
  state.programsLoaded.push({
    name,
    loadedAt: Date.now()
  });
}

export function setProgramRunning(name, status) {
  state.programsRunning.set(name, {
    status,
    updatedAt: Date.now()
  });
}

export function addError(error) {
  state.errors.push({
    error: error.message,
    stack: error.stack,
    timestamp: Date.now()
  });
}

export function getState() {
  return {
    ...state,
    uptime: Date.now() - state.startedAt,
    programsRunning: Object.fromEntries(state.programsRunning)
  };
}

