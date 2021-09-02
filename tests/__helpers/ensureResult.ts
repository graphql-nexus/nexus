import type { AsyncExecutionResult, ExecutionResult } from 'graphql'
import { isAsyncIterable } from 'iterall'

export function ensureResult<V extends ExecutionResult | AsyncIterable<AsyncExecutionResult>>(
  v: V
): ExecutionResult<any> {
  if (isAsyncIterable(v)) {
    throw new Error('Expected execution result')
  }
  return v as ExecutionResult<any>
}
