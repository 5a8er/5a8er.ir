# Self-hosting escape hatch.
#
# Not the primary deployment — the site runs on Cloudflare Workers and Vercel.
# This exists so the project is not captive to either: `docker compose up`
# gives a third origin on any VPS, and it is the path that keeps the DevSecOps
# claims in the portfolio backed by something in the repository.
#
# Base images are pinned by digest, not by tag. A tag is a moving pointer, so
# `node:22-alpine` today and tomorrow are different images and the build is not
# reproducible. Refresh deliberately.

# node:22-alpine
FROM node@sha256:2d07db07a2df6830718ae2a47db6fedce6745f5bcd174c398f2acdda90a11c4c AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# `npm ci` installs exactly the lockfile, and fails rather than silently
# resolving something newer.
RUN npm ci --ignore-scripts

FROM node@sha256:2d07db07a2df6830718ae2a47db6fedce6745f5bcd174c398f2acdda90a11c4c AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DEPLOY_TARGET=docker
RUN npm run build:posts && npm run build

FROM node@sha256:2d07db07a2df6830718ae2a47db6fedce6745f5bcd174c398f2acdda90a11c4c AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Runs as an unprivileged user with no shell and no home directory. A process
# that never needs to log in should not be able to.
RUN addgroup -g 1001 -S nodejs \
 && adduser -u 1001 -S -G nodejs -H -s /sbin/nologin nextjs

# `output: 'standalone'` emits only the files the server actually reaches, so
# the runtime image carries no build toolchain and no dev dependencies.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
