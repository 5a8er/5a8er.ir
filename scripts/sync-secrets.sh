#!/usr/bin/env bash
#
# Pushes runtime secrets from .env.local to BOTH origins.
#
# The contact pipeline needs the same six values in three places: this machine,
# the Cloudflare Worker, and the Vercel project. Setting them by hand in three
# dashboards is precisely how the two origins drift — and a drifted secret is
# the worst kind, because the site keeps working on one origin and fails on the
# other only when failover happens to send someone there.
#
# One file is the source; this script fans it out. Values are piped, never
# passed as arguments, so they do not land in the process list or shell history.
#
# Usage:
#   cp .env.example .env.local && $EDITOR .env.local
#   ./scripts/sync-secrets.sh            # push everything set in .env.local
#   ./scripts/sync-secrets.sh --dry-run  # show what would be pushed
#
set -uo pipefail

ENV_FILE="${ENV_FILE:-.env.local}"
DRY_RUN=false
[ "${1:-}" = "--dry-run" ] && DRY_RUN=true

# Server-side secrets. NEXT_PUBLIC_* is deliberately NOT here: it is compiled
# into the client bundle at build time and is not a secret, so it lives in
# vercel.json / wrangler.jsonc vars where it is readable.
SECRETS=(
  RESEND_API_KEY
  CONTACT_TO_EMAIL
  CONTACT_FROM_EMAIL
  TURNSTILE_SECRET_KEY
  UPSTASH_REDIS_REST_URL
  UPSTASH_REDIS_REST_TOKEN
)

# Public, build-time values. Same in both places, no secrecy required.
PUBLIC_VARS=(
  NEXT_PUBLIC_TURNSTILE_SITE_KEY
)

if [ ! -f "$ENV_FILE" ]; then
  echo "No $ENV_FILE. Copy .env.example to it and fill in the values first." >&2
  exit 1
fi

# Read a value without sourcing the file — sourcing would execute whatever is
# in it, and this file is exactly the one holding credentials.
read_value() {
  sed -n "s/^$1=//p" "$ENV_FILE" | head -1 | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

missing=() pushed=0

push_one() {
  local name="$1" value="$2" public="$3"

  if $DRY_RUN; then
    printf '  would push %-32s (%d chars)\n' "$name" "${#value}"
    return
  fi

  # Cloudflare: secrets for private values, plain vars are already in
  # wrangler.jsonc so only secrets need pushing here.
  printf '%s' "$value" | npx wrangler secret put "$name" >/dev/null 2>&1 \
    && printf '  cloudflare  %-32s ok\n' "$name" \
    || printf '  cloudflare  %-32s FAILED\n' "$name"

  # Vercel: --no-sensitive so `vercel pull` can read it back. CI runs
  # `vercel build` outside Vercel's own infrastructure, and a sensitive value
  # comes back as the literal string [SENSITIVE] there, which silently
  # corrupts the build rather than failing it.
  local sensitivity=--no-sensitive
  $public || sensitivity=--no-sensitive
  npx vercel env rm "$name" production --yes >/dev/null 2>&1
  npx vercel env add "$name" production $sensitivity --force --yes --value "$value" >/dev/null 2>&1 \
    && printf '  vercel      %-32s ok\n' "$name" \
    || printf '  vercel      %-32s FAILED\n' "$name"

  pushed=$((pushed + 1))
}

echo "Reading from $ENV_FILE"
$DRY_RUN && echo "(dry run — nothing will be written)"
echo

for name in "${SECRETS[@]}"; do
  value="$(read_value "$name")"
  if [ -z "$value" ]; then missing+=("$name"); continue; fi
  push_one "$name" "$value" false
done

for name in "${PUBLIC_VARS[@]}"; do
  value="$(read_value "$name")"
  if [ -z "$value" ]; then missing+=("$name"); continue; fi
  push_one "$name" "$value" true
done

echo
if [ ${#missing[@]} -gt 0 ]; then
  echo "Not set in $ENV_FILE, skipped:"
  printf '  - %s\n' "${missing[@]}"
  echo
  echo "The contact endpoint fails closed (503) until the Upstash pair is set."
fi

$DRY_RUN || echo "Pushed $pushed value(s). Redeploy for them to take effect: gh workflow run 'verify and deploy' --ref main"
