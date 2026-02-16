FROM node:20-slim

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy everything first
COPY . .

# Install dependencies (skip prepare script, we'll build manually)
RUN npm install --ignore-scripts

# Build the main library
RUN npm run build

# Install example server dependencies and build
RUN cd examples/node && npm install --legacy-peer-deps && npx tsc

EXPOSE 8080
CMD ["node", "examples/node/dist/index.js"]
