import * as Types from "./typegenTypeHelpers";
import { SchemaBuilder, isNamedTypeDef } from "./builder";
import { Metadata } from "./metadata";

export { SDLConverter } from "./sdlConverter";

// Export the ts definitions so they can be used by library authors under `core.Types`
export { Types };

// Same as above, export all core things under the "core" namespace
export { SchemaBuilder, isNamedTypeDef, Metadata };

// Keeping this in core since it shouldn't be needed directly
export { typegenAutoConfig } from "./typegenAutoConfig";
