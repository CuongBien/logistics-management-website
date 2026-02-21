# Skill: Setup Local Development Environment

## Overview

Hướng dẫn dựng môi trường development hoàn chỉnh chỉ bằng Docker Compose trong **< 5 phút**.

**Trigger:** Use this skill when setting up a new machine, troubleshooting Docker, or running the project locally.

## Prerequisites (Yêu cầu máy dev)

- **OS:** Windows 11 (với WSL2), macOS, hoặc Linux
- **Docker Desktop:** Version 20.10+
- **.NET SDK:** Version 8.0+
- **IDE:** Rider, Visual Studio 2022, hoặc VS Code + C# Dev Kit
- **Git:** Latest version
- **RAM:** Minimum 16GB (Recommended 32GB)

## Step 1: Clone Repository

```bash
git clone https://github.com/your-org/lms-platform.git
cd lms-platform
```

## Step 2: Infrastructure Setup (Docker Compose)

### File: `docker-compose.local.yml`

```yaml
version: "3.8"

services:
  # PostgreSQL (Main Database)
  postgres:
    image: postgis/postgis:16-3.4
    container_name: lms-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: lms_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MongoDB (Logs & IoT Data)
  mongodb:
    image: mongo:7.0
    container_name: lms-mongo
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  # Redis (Cache & Distributed Lock)
  redis:
    image: redis:7.2-alpine
    container_name: lms-redis
    ports:
      - "6379:6379"
    command: redis-server --requirepass redis123
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # RabbitMQ (Message Broker)
  rabbitmq:
    image: rabbitmq:3.12-management
    container_name: lms-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672" # AMQP
      - "15672:15672" # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmqctl", "status"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Apache Kafka (Event Streaming)
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: lms-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: lms-kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1

  # Jaeger (Distributed Tracing)
  jaeger:
    image: jaegertracing/all-in-one:1.51
    container_name: lms-jaeger
    ports:
      - "5775:5775/udp"
      - "6831:6831/udp"
      - "6832:6832/udp"
      - "5778:5778"
      - "16686:16686" # UI
      - "14268:14268"
      - "14250:14250"
      - "9411:9411"

  # Seq (Logging)
  seq:
    image: datalust/seq:2023.4
    container_name: lms-seq
    environment:
      ACCEPT_EULA: Y
    ports:
      - "5341:80" # UI
      - "5342:5342" # Ingestion
    volumes:
      - seq_data:/data

  # MailHog (Email Testing)
  mailhog:
    image: mailhog/mailhog:v1.0.1
    container_name: lms-mailhog
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # UI

volumes:
  postgres_data:
  mongo_data:
  rabbitmq_data:
  seq_data:
```

### Start All Services

```bash
docker-compose -f docker-compose.local.yml up -d
```

**Wait for health checks to pass (30-60 seconds):**

```bash
docker-compose -f docker-compose.local.yml ps
```

All services should show `healthy` status.

## Step 3: Configure Application Settings

### File: `src/Services/OMS/OMS.Api/appsettings.Development.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=lms_oms_dev;Username=postgres;Password=postgres",
    "MongoDb": "mongodb://admin:admin123@localhost:27017",
    "Redis": "localhost:6379,password=redis123"
  },
  "MessageBroker": {
    "RabbitMQ": {
      "Host": "localhost",
      "Username": "guest",
      "Password": "guest"
    },
    "Kafka": {
      "BootstrapServers": "localhost:9092"
    }
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    },
    "Seq": {
      "ServerUrl": "http://localhost:5341",
      "ApiKey": ""
    }
  },
  "OpenTelemetry": {
    "JaegerEndpoint": "http://localhost:14268/api/traces"
  },
  "Email": {
    "SmtpHost": "localhost",
    "SmtpPort": 1025,
    "FromEmail": "noreply@lms.local"
  }
}
```

## Step 4: Initialize Databases

### Run EF Core Migrations

```bash
# Navigate to OMS API project
cd src/Services/OMS/OMS.Api

# Apply migrations
dotnet ef database update --project ../OMS.Infrastructure

# Seed test data (if seeder exists)
dotnet run --seed-data
```

Repeat for WMS, TMS, and other services.

### Verify Database

```bash
# Connect to PostgreSQL
docker exec -it lms-postgres psql -U postgres

# List databases
\l

# Connect to OMS database
\c lms_oms_dev

# List tables
\dt

# Exit
\q
```

## Step 5: Run Services

### Option A: Run All Services via Solution

Open `LMS.sln` in Rider/Visual Studio and run all projects (configure multiple startup projects).

### Option B: Run Individual Services via CLI

```bash
# Terminal 1: OMS API
cd src/Services/OMS/OMS.Api
dotnet run

# Terminal 2: WMS API
cd src/Services/WMS/WMS.Api
dotnet run

# Terminal 3: TMS API
cd src/Services/TMS/TMS.Api
dotnet run
```

## Step 6: Verify Everything Works

### Check Service Health

```bash
# OMS
curl http://localhost:5001/health

# WMS
curl http://localhost:5002/health

# TMS
curl http://localhost:5003/health
```

Expected response: `{"status": "Healthy"}`

### Access Management UIs

| Service             | URL                    | Credentials   |
| ------------------- | ---------------------- | ------------- |
| RabbitMQ Management | http://localhost:15672 | guest / guest |
| Seq Logs            | http://localhost:5341  | (none)        |
| Jaeger Tracing      | http://localhost:16686 | (none)        |
| MailHog             | http://localhost:8025  | (none)        |

### Test Create Order API

```bash
curl -X POST http://localhost:5001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST001",
    "items": [
      {
        "sku": "SKU123",
        "quantity": 2,
        "unitPrice": 50.00
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "Hanoi",
      "country": "Vietnam"
    }
  }'
```

Expected: `201 Created` with Order ID.

### Verify Event Flow

1. Check **Seq** logs for "OrderCreated" event
2. Check **RabbitMQ** Management UI → Queues → Should see messages in `wms-order-created-queue`
3. Check **Jaeger** UI → Search for trace with "CreateOrder" operation

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find process using port (example: 5432)
# Linux/Mac
lsof -i :5432

# Windows
netstat -ano | findstr :5432

# Kill process
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows
```

### Issue: Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs lms-postgres

# Restart container
docker restart lms-postgres
```

### Issue: RabbitMQ Not Receiving Messages

```bash
# Check MassTransit configuration in Program.cs
# Ensure UseMessageRetry and ConfigureEndpoints are called

# Check RabbitMQ logs
docker logs lms-rabbitmq
```

## Daily Development Workflow

### Starting Work

```bash
# Start infrastructure
docker-compose -f docker-compose.local.yml up -d

# Wait for health checks
sleep 30

# Start services (in IDE or terminal)
dotnet run
```

### Ending Work

```bash
# Stop services (Ctrl+C in terminals)

# Optional: Stop infrastructure (keeps data)
docker-compose -f docker-compose.local.yml stop

# Optional: Remove everything (destroys data)
docker-compose -f docker-compose.local.yml down -v
```

## Helper Scripts

### Script: `scripts/dev-start.sh`

```bash
#!/bin/bash
echo "🚀 Starting LMS Development Environment..."

# Start infrastructure
docker-compose -f docker-compose.local.yml up -d

# Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Run migrations
echo "🗃️ Running database migrations..."
cd src/Services/OMS/OMS.Api
dotnet ef database update --project ../OMS.Infrastructure
cd ../../..

echo "✅ Environment ready! Start your services now."
```

### Script: `scripts/dev-reset.sh`

```bash
#!/bin/bash
echo "🧹 Resetting development environment..."

# Stop and remove all containers + volumes
docker-compose -f docker-compose.local.yml down -v

# Restart fresh
docker-compose -f docker-compose.local.yml up -d

echo "✅ Environment reset complete!"
```

## Best Practices

- ✅ **Always** start Docker Compose before running .NET services
- ✅ Use separate terminal windows for each service (easier to debug logs)
- ✅ Check Seq logs regularly to catch errors early
- ✅ Run `git pull` every morning to get latest changes
- ✅ Keep Docker Desktop updated
- ❌ **Never** commit `appsettings.Development.json` with real credentials
- ❌ **Never** run production migrations from local machine
