import type { SocialLink } from './types'

/**
 * GitHub is confirmed (`gh auth status` reports the account `5a8er`).
 *
 * LinkedIn and X are commented out rather than filled with a guess: a dead
 * profile link on a portfolio costs more than a missing one. Uncomment and set
 * the handle, or delete the entry for good if the account does not exist.
 */
export const SOCIALS: SocialLink[] = [
  {
    label: 'GitHub',
    handle: '@5a8er',
    href: 'https://github.com/5a8er',
  },
  // {
  //   label: 'LinkedIn',
  //   handle: 'saber-azizi',
  //   href: 'https://www.linkedin.com/in/saber-azizi',
  // },
  // {
  //   label: 'X',
  //   handle: '@handle',
  //   href: 'https://x.com/handle',
  // },
]

/**
 * Published in the contact section and in /.well-known/security.txt.
 *
 * Currently the personal address from your git config. Once Resend is verified
 * against 5a8er.ir, consider switching this to an address on the domain —
 * a researcher reporting a vulnerability to a Gmail address gets a slightly
 * worse first impression than one reporting to security@5a8er.ir, and the
 * domain address can forward here anyway.
 */
export const CONTACT_EMAIL = 'saberazizi.b@gmail.com'
