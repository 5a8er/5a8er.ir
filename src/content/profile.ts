/**
 * About-section copy.
 *
 * Written to the brief's constraint that generic claims are banned. The test
 * applied to every sentence: could this appear verbatim on someone else's
 * portfolio? If yes, it was cut.
 *
 * Words deliberately absent: passionate, driven, ninja, rockstar, guru,
 * cutting-edge, leverage, synergy, "results-oriented".
 */
export const PROFILE = {
  name: 'Saber',
  role: 'Software Engineer & Security Practitioner',
  /** TODO(saber): set or delete. An unfilled location reads worse than none. */
  location: null as string | null,

  /** TODO(saber): drop a real image here; 1:1, at least 640px. */
  headshot: {
    src: '/images/saber.jpg',
    alt: 'Saber',
  },

  bio: [
    'I build backend systems and then try to break them. Most of my work sits where application security meets infrastructure: the API that trusts a header it should not, the deployment that leaks an internal hostname, the authorisation check that lives in the route handler instead of the query.',
    'That perspective came from working both sides. Writing Django services taught me where the shortcuts are; looking for those same shortcuts in other people\'s systems taught me which ones actually get exploited. What survived is a bias toward designs that fail closed, and toward constraints that live in the schema rather than in a code review comment somebody will forget.',
    'Right now I am building two things: a storefront selling hardware wallets to buyers most payment processors decline, and a marketplace where providers across six service markets are ranked on verified reviews. Different products, one question underneath — who is allowed to do what, and what happens the first time somebody lies about it.',
  ],

  /** Rendered as a short labelled list beside the bio. */
  focus: [
    {
      title: 'Web application security',
      detail: 'Access control, authentication flows, and the classes of bug that survive a scanner.',
    },
    {
      title: 'DevSecOps',
      detail: 'Scanning and policy as a gate in CI, not a dashboard nobody opens.',
    },
    {
      title: 'Backend systems',
      detail: 'Django and API design where correctness under concurrency is the actual requirement.',
    },
    {
      title: 'Networking and OSINT',
      detail: 'Mapping what is exposed, and moving traffic where the default path does not work.',
    },
  ],
} as const
