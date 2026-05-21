const ExpoKeepAwakeTag = "ExpoKeepAwakeDefaultTag";
const KeepAwakeEventState = {
  RELEASE: "release",
};

function useKeepAwake() {}

async function activateKeepAwakeAsync() {}

function activateKeepAwake() {
  return activateKeepAwakeAsync();
}

async function deactivateKeepAwake() {}

async function isAvailableAsync() {
  return false;
}

function addListener() {
  return {
    remove() {},
  };
}

module.exports = {
  ExpoKeepAwakeTag,
  KeepAwakeEventState,
  activateKeepAwake,
  activateKeepAwakeAsync,
  addListener,
  deactivateKeepAwake,
  isAvailableAsync,
  useKeepAwake,
};
