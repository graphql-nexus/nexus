import { objectType, enumType, arg, nullable } from 'nexus'

export const Mission = objectType({
  name: 'Mission',
  definition(t) {
    t.string('name')
    t.string('missionPatch', {
      args: {
        size: arg({ type: 'PatchSize' }),
      },
      resolve(mission, { size }) {
        return size === 'SMALL' ? mission.missionPatchSmall : mission.missionPatchLarge
      },
    })
  },
})

export const PatchSize = enumType({
  name: 'PatchSize',
  members: ['SMALL', 'LARGE'],
})
