#build node static files
FROM node:current-alpine AS build

WORKDIR /app/

ARG VITE_DBHELPER_API_BASE_URL="https://dbhelperui.trahan.dev/api"
ARG VITE_API_WEB_INFRA_URL="https://dbhelperui.trahan.dev/api/auth"
ENV VITE_API_WEB_INFRA_URL=${VITE_API_WEB_INFRA_URL}
ARG VITE_DOCS_README_URL="https://raw.githubusercontent.com/babbage88/db-helper-ui/refs/heads/master/README.md"
ARG VITE_AUTH_API_BASE_URL="https://dbhelperui.trahan.dev/api/auth"
ARG VITE_CERT_API_BASE_URL="https://dbhelperui.trahan.dev/api/auth"
ENV VITE_AUTH_API_BASE_URL=${VITE_AUTH_API_BASE_URL}
ENV VITE_CERT_API_BASE_URL=${VITE_CERT_API_BASE_URL}
ENV VITE_DBHELPER_API_BASE_URL=${VITE_DBHELPER_API_BASE_URL}
ENV VITE_DOCS_README_URL=${VITE_DOCS_README_URL}

#COPY package.json .
COPY package*.json package-lock.json ./ 
#RUN npm install
# Run npm ci to install dependencies, exclude development deps 
RUN npm ci 

COPY . .
RUN echo 

RUN npm run build

## Use Nginx as the production server
FROM nginx:alpine

# Copy nginx.conf config file 
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

## Copy the built React app to Nginx's web server directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

## Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]
