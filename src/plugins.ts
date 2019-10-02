type BuilderFacade = {
  // addType: (def: any) => void;
  hasType: (typeName: string) => boolean;
};

type Plugin = (hooks: Hooks) => void;

type Hooks = {
  onInstall: OnInstallHook;
};

type OnInstallHook = (
  onInstallHandler: (builder: BuilderFacade) => { types: any[] }
) => void;

// QUESTION Hey team, how do you feel about batch export at end of file?
// Me likes the symmetry with batch import at beginning of file.
// Also less clutter. Colocating the answer to "is this exported" is lost
// though. Arguably IDE outline view etc. can support but not enough I
// guess.
export { OnInstallHook, Plugin, Hooks };
