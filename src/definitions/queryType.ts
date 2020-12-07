import { NexusObjectTypeConfig, objectType } from './objectType'

export function queryType(config: Omit<NexusObjectTypeConfig<'Query'>, 'name'>) {
  return objectType({ ...config, name: 'Query' })
}
