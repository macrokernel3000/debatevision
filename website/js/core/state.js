(() => {
  function createDomainState(initialState = {}) {
    if (!initialState || typeof initialState !== "object" || Array.isArray(initialState)) {
      throw new TypeError("Domain state must be created from an object.");
    }
    return Object.seal({ ...initialState });
  }

  window.DEBATE_STATE = Object.freeze({ create: createDomainState });
})();
