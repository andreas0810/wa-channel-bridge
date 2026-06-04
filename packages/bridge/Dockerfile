# Bridge im Container. Nutzt das in puppeteer enthaltene Chromium.
FROM node:22-slim

# Abhaengigkeiten fuer Chromium (Puppeteer)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 \
    libxcomposite1 libxdamage1 libxrandr2 xdg-utils wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src

# Persistente Volumes: Session (.wwebjs_auth) und Ausgabe (out)
VOLUME ["/app/.wwebjs_auth", "/app/out"]

ENV HEADLESS=true
ENV INTERVAL_SEC=300
CMD ["node", "src/index.js"]
