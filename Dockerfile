FROM node:20-slim
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy application code
COPY . .

# Precompute embeddings once at build time - bakes data/embeddings.json into the image
# so it never needs to be regenerated at runtime/cold-start
RUN npx tsx scripts/precomputeEmbeddings.ts

# Build the Next.js app (TypeScript still available)
RUN npm run build

# NOW remove dev dependencies after build is complete
RUN npm prune --production

# Expose Hugging Face Spaces default port
EXPOSE 7860

# Set environment variables
ENV NODE_ENV=production
ENV PORT=7860

# Start the application
CMD ["npm", "start"]
