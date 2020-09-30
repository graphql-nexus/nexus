/**
 * Test for an invalid email
 */

export function email(email: string): string | Error {
  email = email.toLowerCase()
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  if (!re.test(email)) {
    return new Error(`invalid email: ${email}`)
  }
  return email
}
