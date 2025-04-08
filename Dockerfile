
FROM python:3.11-slim

RUN apt-get update \
 && apt-get install -y curl ca-certificates build-essential \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY main.py .

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY start.sh .
RUN chmod +x start.sh

COPY frontend/ ./frontend/

WORKDIR /app/frontend
RUN npm install

WORKDIR /app

EXPOSE 5173
EXPOSE 8001

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/bin/bash", "/app/start.sh"]

