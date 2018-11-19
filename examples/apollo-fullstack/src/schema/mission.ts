import { objectType, enumType } from "gqliteral";

export const Mission = objectType("Mission", (t) => {
  t.string("name", { nullable: true });
  t.string("missionPatch", {
    args: {
      size: t.fieldArg("PatchSize"),
    },
    resolve(mission, { size }) {
      return size === "SMALL"
        ? mission.missionPatchSmall
        : mission.missionPatchLarge;
    },
  });
});

export const PatchSize = enumType("PatchSize", ["SMALL", "LARGE"]);
