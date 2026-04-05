FROM node:20-alpine as build
WORKDIR /app

# Accept build args for environment configuration
ARG VITE_APP_TYPE=owner
ARG VITE_API_URL=https://salonos-backend-rgvcleapsa-uc.a.run.app

# Set as environment variables for Vite
ENV VITE_APP_TYPE=${VITE_APP_TYPE}
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
