FROM node:22-bookworm-slim@sha256:d649c27dae7ba0137b3cef5dd75baa422c08dc3d9e3fc0c23dfb172dc3cc6436

ARG TESTKIT_VERSION=development
ARG TESTKIT_CONTEXT_SHA256=unavailable
LABEL dev.dsh-testkit.version="${TESTKIT_VERSION}" \
      dev.dsh-testkit.context-sha256="${TESTKIT_CONTEXT_SHA256}"
ENV COREPACK_HOME=/opt/corepack

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates g++ git iproute2 make procps python3 \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && mkdir -p /opt/corepack \
  && corepack prepare pnpm@11.1.3 --activate

WORKDIR /opt/dsh-testkit
COPY package.json pnpm-workspace.yaml ./
COPY assets/runner-pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --prod --frozen-lockfile
COPY dist/src ./dist/src

ENV DSH_TESTKIT_RUNNER=docker
ENV DSH_TESTKIT_IMAGE=dsh-testkit-runner:${TESTKIT_VERSION}
ENV DSH_TESTKIT_WORK_ROOT=/work/run
ENV DSH_TESTKIT_COREPACK_HOME=/opt/corepack
ENV HOME=/work/user-home
ENTRYPOINT ["node", "/opt/dsh-testkit/dist/src/worker/main.js"]
