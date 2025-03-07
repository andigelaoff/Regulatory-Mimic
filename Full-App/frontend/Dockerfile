FROM node:18-alpine AS build-frontend
COPY . /app
WORKDIR /app
RUN npm install react-scripts
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]