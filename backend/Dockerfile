FROM python:3.11-slim as base
WORKDIR /app
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p uploads data
RUN chmod +x cli.py
RUN echo '#!/bin/bash\ncurl -f http://localhost:5000/api/tables || exit 1' > /app/healthcheck.sh \
    && chmod +x /app/healthcheck.sh

FROM base as api-server
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ["/app/healthcheck.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "app:app"]

FROM base as cli-terminal
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV CLI_API_URL=http://backend:5000/api
EXPOSE 8080
CMD ["python", "cli_terminal_server.py"]

FROM base as development
EXPOSE 5000 8080

COPY start-dev.sh /app/start-dev.sh
RUN chmod +x /app/start-dev.sh

CMD ["/app/start-dev.sh"]
