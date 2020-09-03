/**
 * Subscribe to mailchimp
 *
 * TODO: better align with mailchimp, this is using an undocumented API
 * https://stackoverflow.com/questions/5188418/jquery-ajax-post-not-working-with-mailchimp/16369887#16369887
 */

export default async function subscribe(email: string): Promise<void> {
  await fetch(
    `https://coo.us14.list-manage.com/subscribe/post-json?u=dbacf466dc6e90901d8936391&amp;id=83e066a034&EMAIL=${encodeURIComponent(
      email
    )}&c=?`,
    {
      method: 'GET',
      mode: 'no-cors',
    }
  )
  // no-cors doesn't give us any information, so this is just a fire & pray
  return
}
