import { LaunchApi, UserApi } from './typeDefs'

export interface Context {
  dataSources: {
    userAPI: UserApi
    launchAPI: LaunchApi
  }
}
