import type { SkillGroup } from './types'

/**
 * Capability map.
 *
 * Every entry pairs a technology with something it was used to do. No
 * percentages, no five-star ratings, no progress bars — a number invented for
 * a portfolio is unfalsifiable, and a reader who has hired before knows it.
 */
export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: 'backend',
    title: 'Backend Engineering',
    summary: 'Services that stay correct while the data underneath them changes.',
    items: [
      {
        name: 'Python / Django',
        artifact: 'Custom auth backends, permission classes, migrations run against live data',
      },
      {
        name: 'Flask',
        artifact: 'Small single-purpose services where a full framework would be overhead',
      },
      {
        name: 'REST API design',
        artifact: 'Versioned endpoints, cursor pagination, idempotency keys on every write',
      },
      {
        name: 'PostgreSQL',
        artifact: 'Constraints in the schema rather than the application; indexes chosen from query plans',
      },
      {
        name: 'Redis',
        artifact: 'Session storage, cache invalidation, sliding-window rate-limit counters',
      },
      {
        name: 'Background jobs',
        artifact: 'Retry with backoff, dead-letter handling, work that survives a restart',
      },
    ],
  },
  {
    id: 'frontend',
    title: 'Frontend',
    summary: 'Interfaces that stay fast and usable without a keyboard trap or a layout shift.',
    items: [
      {
        name: 'React / Next.js',
        artifact: 'Server components by default; client islands only where state is genuinely local',
      },
      {
        name: 'TypeScript',
        artifact: 'Strict mode, no implicit any, request schemas shared between client and server',
      },
      {
        name: 'Tailwind CSS',
        artifact: 'Token-driven systems — colour decided once in CSS, not per component',
      },
      {
        name: 'Accessibility',
        artifact: 'Keyboard-complete flows and contrast ratios measured rather than assumed',
      },
      {
        name: 'Web performance',
        artifact: 'Budgets on shipped JavaScript; images and fonts self-hosted and sized',
      },
    ],
  },
  {
    id: 'devops',
    title: 'DevOps',
    summary: 'Getting code to production repeatably, and knowing when it breaks.',
    items: [
      {
        name: 'Docker',
        artifact: 'Multi-stage builds, non-root runtime users, base images pinned by digest',
      },
      {
        name: 'Nginx',
        artifact: 'Reverse proxying, TLS termination, per-endpoint connection and rate limits',
      },
      {
        name: 'CI/CD',
        artifact: 'This site: one commit deployed to two independent origins by GitHub Actions',
      },
      {
        name: 'Linux administration',
        artifact: 'Service hardening, systemd units, firewall and SSH policy on public hosts',
      },
      {
        name: 'Observability',
        artifact: 'Structured logs that answer a question, not logs that record an event',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    summary: 'Finding the failure before someone else does, and designing so there is less to find.',
    items: [
      {
        name: 'Web application testing',
        artifact: 'Access-control flaws, authentication bypass, SSRF, injection, insecure deserialisation',
      },
      {
        name: 'Bug bounty workflow',
        artifact: 'Recon through to a reproducible proof of concept and a report someone can act on',
      },
      {
        name: 'Threat modelling',
        artifact: 'Trust boundaries drawn before implementation, not audited after it',
      },
      {
        name: 'DevSecOps',
        artifact: 'Dependency, secret, and SAST scanning wired into CI as a gate rather than a report',
      },
      {
        name: 'Supply chain',
        artifact: 'Lockfiles committed, release-age floors on new versions, install scripts reviewed',
      },
    ],
  },
  {
    id: 'osint',
    title: 'OSINT',
    summary: 'Mapping what an organisation exposes before assuming what it runs.',
    items: [
      {
        name: 'Attack surface discovery',
        artifact: 'Subdomain enumeration and certificate transparency logs to find forgotten hosts',
      },
      {
        name: 'Exposure analysis',
        artifact: 'Credential and secret leakage across public repositories and paste sites',
      },
      {
        name: 'Infrastructure fingerprinting',
        artifact: 'Correlating DNS, ASN, and TLS metadata into an ownership picture',
      },
    ],
  },
  {
    id: 'networking',
    title: 'Networking',
    summary: 'Understanding the path a packet takes, especially where that path is contested.',
    items: [
      {
        name: 'DNS',
        artifact: 'Zone design, split-horizon resolution, and debugging propagation from first principles',
      },
      {
        name: 'TLS',
        artifact: 'Certificate chains, SNI behaviour, and cipher policy that survives a scanner',
      },
      {
        name: 'VPN and tunnelling',
        artifact: 'WireGuard and OpenVPN deployments, protocol selection under active inspection',
      },
      {
        name: 'Restricted networks',
        artifact: 'Transport selection and traffic shaping where the default path does not work',
      },
    ],
  },
]
