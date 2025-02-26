
FROM python:3.11 AS backend

WORKDIR /app
COPY requirements.txt /app/
COPY app/ /app/


FROM node:20 AS frontend

WORKDIR /frontend
COPY frontend/ /frontend/
RUN npm install && npm run build


FROM python:3.11

WORKDIR /app


COPY --from=backend /app /app
COPY --from=frontend /frontend /frontend


RUN apt update && apt install -y nodejs npm && npm install -g vite
RUN pip install --no-cache-dir -r /app/requirements.txt


COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh


CMD ["/bin/bash", "/app/start.sh"]
