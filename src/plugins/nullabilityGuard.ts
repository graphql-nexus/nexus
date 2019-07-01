import { plugin } from "../plugin";

export const nullabilityGuard = plugin({
  name: "NullabilityGuard",
  description:
    "If we have a nullable field, we dont want this to an issue in production.",
  definition(config) {
    //
  },
});
