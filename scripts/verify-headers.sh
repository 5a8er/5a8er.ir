#!/usr/bin/env bash
#
# Asserts that every origin serves the same security headers.
#
# The whole argument for defining headers in application code rather than in
# vercel.json and Workers config is that two hand-maintained copies drift, and
# the drift is invisible until somebody scans one origin and not the other.
# This is the check that turns that argument into a fact.
#
# Usage:
#   scripts/verify-headers.sh                       # against the local build
#   scripts/verify-headers.sh https://5a8er.ir \
#       https://cf.5a8er.ir https://5a8er-ir.vercel.app
#
set -uo pipefail

TARGETS=("$@")
if [ ${#TARGETS[@]} -eq 0 ]; then
  TARGETS=("http://127.0.0.1:3111")
fi

# Headers whose value must be identical everywhere.
EXACT_HEADERS=(
  "strict-transport-security"
  "x-content-type-options"
  "referrer-policy"
  "x-frame-options"
  "cross-origin-opener-policy"
  "cross-origin-resource-policy"
  "permissions-policy"
)

# The CSP nonce differs per response by design, so the policy is compared with
# the nonce masked out. Comparing it verbatim would fail every time and teach
# everyone to ignore this script.
mask_nonce() {
  sed -E "s/'nonce-[A-Za-z0-9+/=]+'/'nonce-MASKED'/g"
}

fetch_headers() {
  curl -sS -I --max-time 20 "$1" 2>/dev/null | tr -d '\r' | tr 'A-Z' 'a-z'
}

header_value() {
  grep -i "^$2:" <<<"$1" | head -1 | cut -d' ' -f2- | mask_nonce
}

failures=0
declare -A baseline

for target in "${TARGETS[@]}"; do
  echo "── $target"
  response=$(fetch_headers "$target")

  if [ -z "$response" ]; then
    echo "   UNREACHABLE"
    failures=$((failures + 1))
    continue
  fi

  for name in "${EXACT_HEADERS[@]}" "content-security-policy"; do
    value=$(header_value "$response" "$name")

    if [ -z "$value" ]; then
      echo "   MISSING  $name"
      failures=$((failures + 1))
      continue
    fi

    if [ -z "${baseline[$name]+set}" ]; then
      baseline[$name]="$value"
      echo "   ok       $name"
    elif [ "${baseline[$name]}" = "$value" ]; then
      echo "   ok       $name"
    else
      echo "   DRIFT    $name"
      echo "            first:   ${baseline[$name]}"
      echo "            here:    $value"
      failures=$((failures + 1))
    fi
  done

  # Not compared across origins — this is the header that is *supposed* to
  # differ, and seeing it change is how failover is observed from outside.
  echo "   served-by: $(header_value "$response" "x-served-by")"
done

echo
if [ "$failures" -gt 0 ]; then
  echo "FAILED: $failures problem(s)."
  exit 1
fi

echo "All origins agree."
