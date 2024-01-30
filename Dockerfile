# base image
FROM node:16.13.0-alpine


LABEL org.opencontainers.image.authors=""

RUN apk --no-cache --update add dumb-init vim nano sudo bash git curl && \
    rm -rf /var/cache/apk/* /tmp && \
    mkdir /tmp && \
    chmod 777 /tmp

# Global installs to non root owned directory and add that to path so they're executable
ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH="/home/node/.npm-global/bin:${PATH}"

# Install global Yarn packages:
# - typescript: Run tsc  -p server on docker-compose up
# - nodemon: Run the node server in development mode on docker-compose up
# - concurrently: Run tsc and nodemon in parallel on docker-compose up

RUN npm -g add typescript
RUN npm -g add nodemon
RUN npm -g add concurrently


# Set the application directory
ARG application_dir=.

WORKDIR /usr/src/app

RUN chown node:node /usr/src/app

USER node

# Add all the files needed for yarn install
ADD --chown=node:node $application_dir/package.json \
    $application_dir/package-lock.json\
    /usr/src/app/

# Auth library config
ARG GH_NPM_TOKEN
# ENV GL_NPM_TOKEN=$GL_NPM_TOKEN
# Use the line above for jenkins environment, use the line below for local environments
ENV GH_NPM_TOKEN=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
RUN npm config set @demoorg:registry=https://npm.pkg.github.com
RUN npm config set '//npm.pkg.github.com/:_authToken=${GH_NPM_TOKEN}'

# Switch to non-root user and install dependencies
RUN npm install

## Add files to the container, perform chmod and chown
ADD --chown=node:node $application_dir /usr/src/app/

RUN bash -c 'echo -e ARE you From .env? ${GL_NPM_TOKEN_A}'
RUN npm run build
