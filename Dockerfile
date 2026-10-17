FROM node:20-alpine
WORKDIR /app
COPY package.json server.js ./
COPY public ./public
ENV PORT=8081
EXPOSE 8081
USER node
CMD ["node", "server.js"]
