# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* vars at build time, so they must be passed as build args.
ARG VITE_ESIGNET_CLIENT_ID
ARG VITE_ESIGNET_REDIRECT_URI
ARG VITE_ESIGNET_AUTHORIZE_URI
ARG VITE_ESIGNET_SCOPE
ARG VITE_ESIGNET_ACR_VALUES
ENV VITE_ESIGNET_CLIENT_ID=$VITE_ESIGNET_CLIENT_ID \
    VITE_ESIGNET_REDIRECT_URI=$VITE_ESIGNET_REDIRECT_URI \
    VITE_ESIGNET_AUTHORIZE_URI=$VITE_ESIGNET_AUTHORIZE_URI \
    VITE_ESIGNET_SCOPE=$VITE_ESIGNET_SCOPE \
    VITE_ESIGNET_ACR_VALUES=$VITE_ESIGNET_ACR_VALUES

RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
