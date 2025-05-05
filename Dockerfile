#build node static files
FROM node:18-alpine AS build

WORKDIR /app/

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

## Use Nginx as the production server
FROM nginx:alpine

## Copy the built React app to Nginx's web server directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

## Start Nginx when the container runs
CMD ["nginx", "-g", "daemon off;"]
