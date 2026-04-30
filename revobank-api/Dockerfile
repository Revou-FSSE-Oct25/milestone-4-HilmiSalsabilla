FROM node:20-slim

# Install OpenSSL - required by Prisma
RUN apt-get update -y && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies including devDeps (needed for build)
RUN npm ci

# Copy all source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS → produces /app/dist/
RUN npm run build

EXPOSE 3000

# Migrate then start
CMD [""sh"", ""-c"", ""npx prisma migrate deploy && node dist/main""]
