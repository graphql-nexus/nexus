import { objectType, enumType, arg } from "gqliteral";

export const Mission = objectType("Mission", (t) => {
  t.string("name", { nullable: true });
  t.string("missionPatch", {
    args: {
      size: arg("PatchSize"),
    },
    resolve(mission, { size }) {
      return size === "SMALL"
        ? mission.missionPatchSmall
        : mission.missionPatchLarge;
    },
  });
});

export const PatchSize = enumType("PatchSize", ["SMALL", "LARGE"]);
