# Logistics Management System (LMS)

## Overview

LMS is a microservices-based system built with .NET 8, following Clean Architecture and DDD principles.

## Project Structure

- `src/BuildingBlocks/` - Shared Kernel (base entities, interfaces)
- `src/Services/OMS/` - Order Management Service
  - `OMS.Domain` - Core business logic
  - `OMS.Application` - Use cases, CQRS, DTOs
  - `OMS.Infrastructure` - DB access, External services
  - `OMS.Api` - REST API endpoints

## Prerequisites

- .NET 8 SDK
- Docker Desktop

## How to Run

1. Start infrastructure:
   ```bash
   # (Will be added in next task)
   # docker-compose up -d
   ```
2. Navigate to OMS API:
   ```bash
   cd src/Services/OMS/OMS.Api
   dotnet run
   ```
3. Open Swagger: `http://localhost:5000/swagger`

## Documentation

See `brain/architecture/` for detailed architectural guidelines.
