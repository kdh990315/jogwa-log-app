export const fishSpeciesKeys = {
  all: ["fish-species"] as const,
  lists: () => [...fishSpeciesKeys.all, "list"] as const,
  list: () => [...fishSpeciesKeys.lists(), "all"] as const,
};

export const speciesRegulationKeys = {
  all: ["species-regulations"] as const,
  currentBySpecies: (speciesId: number | null) =>
    [...speciesRegulationKeys.all, "current", speciesId] as const,
};

export const profileKeys = {
  all: ["profiles"] as const,
  me: () => [...profileKeys.all, "me"] as const,
};

export const catchLogKeys = {
  all: ["catch-logs"] as const,
  details: () => [...catchLogKeys.all, "detail"] as const,
  detail: (catchLogId: number) =>
    [...catchLogKeys.details(), catchLogId] as const,
  edits: () => [...catchLogKeys.all, "edit"] as const,
  edit: (catchLogId: number) => [...catchLogKeys.edits(), catchLogId] as const,
  lists: () => [...catchLogKeys.all, "list"] as const,
  catchLogList: () => [...catchLogKeys.lists(), "catch-log"] as const,
  homeList: () => [...catchLogKeys.lists(), "home"] as const,
  mapList: () => [...catchLogKeys.lists(), "map"] as const,
  speciesDexList: () => [...catchLogKeys.lists(), "species-dex"] as const,
};
