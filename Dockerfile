FROM ollama/ollama:latest

RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pnpm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN ollama serve & sleep 10 && ollama pull llama3.2:1b && pkill ollama

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

RUN pnpm add tsx

COPY src/ ./src/
COPY db/ ./db/
COPY tsconfig.json ./

ENTRYPOINT []

CMD ["/bin/bash", "-c", "ollama serve > /dev/null 2>&1 & sleep 10 && ollama run llama3.2:1b > /dev/null 2>&1 & sleep 5 && pnpm exec tsx src/entrypoint/mcp.ts"]
