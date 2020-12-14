import { idArg, list, nonNull, nullable, objectType, stringArg } from 'nexus'

export const Mutation = objectType({
  name: 'Mutation',
  definition(t) {
    t.field('bookTrips', {
      type: 'TripUpdateResponse',
      args: { launchIds: nonNull(list(nonNull(idArg()))) },
      async resolve(_, { launchIds }, { dataSources }) {
        const results = await dataSources.userAPI.bookTrips({ launchIds })
        const launches = await dataSources.launchAPI.getLaunchesByIds({
          launchIds,
        })
        return {
          success: results && results.length === launchIds.length,
          message:
            results.length === launchIds.length
              ? 'trips booked successfully'
              : `the following launches couldn't be booked: ${launchIds.filter(
                  // @ts-ignore
                  (id) => !results.includes(id)
                )}`,
          launches,
        }
      },
    })
    t.field('cancelTrip', {
      type: 'TripUpdateResponse',
      args: { launchId: nonNull(idArg()) },
      async resolve(_, { launchId }, { dataSources }) {
        const result = dataSources.userAPI.cancelTrip({ launchId })

        if (!result) {
          return {
            success: false,
            message: 'failed to cancel trip',
          }
        }
        const launch = await dataSources.launchAPI.getLaunchById({ launchId })
        return {
          success: true,
          message: 'trip cancelled',
          launches: [launch],
        }
      },
    })
    t.string('login', {
      args: { email: stringArg() },
      async resolve(_, { email }, { dataSources }) {
        const user = await dataSources.userAPI.findOrCreateUser({ email })
        if (user && email) {
          return Buffer.from(email).toString('base64')
        }
        return null
      },
    })
  },
})

export const TripUpdateResponse = objectType({
  name: 'TripUpdateResponse',
  definition(t) {
    t.boolean('success')
    t.string('message')
    t.field('launches', { type: list('Launch') })
  },
})
