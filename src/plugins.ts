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

export { OnInstallHook, Plugin, Hooks };
