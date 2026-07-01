# Stage 1: Build de arquivos estáticos
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:8000
ARG VITE_DEFAULT_USER_ID=default_user
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEFAULT_USER_ID=$VITE_DEFAULT_USER_ID
RUN npm run build

# Stage 2: Servir os arquivos usando Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
