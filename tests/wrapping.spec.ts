import { isNexusTypeDef } from '../src/definitions/wrapping'

describe('wrapping', () => {
  test('isNexusTypeDef should warn about being deprecated', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementationOnce(() => {})
    isNexusTypeDef({})
    expect(spy).toHaveBeenCalledWith('isNexusTypeDef is deprecated, use isNexusStruct')
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
