import { NexusObjectTypeConfig, objectType } from './objectType'

export function mutationType(config: Omit<NexusObjectTypeConfig<'Mutation'>, 'name'>) {
  return objectType({ ...config, name: 'Mutation' })
}
