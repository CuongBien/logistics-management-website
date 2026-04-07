FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
<<<<<<< HEAD
COPY ["src/Services/Warehouse/Warehouse.Api/Warehouse.Api.csproj", "src/Services/Warehouse/Warehouse.Api/"]
COPY ["src/Services/Warehouse/Warehouse.Application/Warehouse.Application.csproj", "src/Services/Warehouse/Warehouse.Application/"]
COPY ["src/Services/Warehouse/Warehouse.Domain/Warehouse.Domain.csproj", "src/Services/Warehouse/Warehouse.Domain/"]
COPY ["src/Services/Warehouse/Warehouse.Infrastructure/Warehouse.Infrastructure.csproj", "src/Services/Warehouse/Warehouse.Infrastructure/"]
COPY ["src/BuildingBlocks/Logistics.Core/Logistics.Core.csproj", "src/BuildingBlocks/Logistics.Core/"]
COPY ["src/BuildingBlocks/EventBus.Messages/EventBus.Messages.csproj", "src/BuildingBlocks/EventBus.Messages/"]
RUN dotnet restore "./src/Services/Warehouse/Warehouse.Api/Warehouse.Api.csproj"
COPY . .
WORKDIR "/src/src/Services/Warehouse/Warehouse.Api"
RUN dotnet build "./Warehouse.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Warehouse.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false
=======
COPY ["src/Services/WMS/WMS.Api/WMS.Api.csproj", "src/Services/WMS/WMS.Api/"]
COPY ["src/Services/WMS/WMS.Application/WMS.Application.csproj", "src/Services/WMS/WMS.Application/"]
COPY ["src/Services/WMS/WMS.Domain/WMS.Domain.csproj", "src/Services/WMS/WMS.Domain/"]
COPY ["src/Services/WMS/WMS.Infrastructure/WMS.Infrastructure.csproj", "src/Services/WMS/WMS.Infrastructure/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Domain/BuildingBlocks.Domain.csproj", "src/BuildingBlocks/BuildingBlocks.Domain/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Messaging/BuildingBlocks.Messaging.csproj", "src/BuildingBlocks/BuildingBlocks.Messaging/"]
RUN dotnet restore "./src/Services/WMS/WMS.Api/WMS.Api.csproj"
COPY . .
WORKDIR "/src/src/Services/WMS/WMS.Api"
RUN dotnet build "./WMS.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./WMS.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false
>>>>>>> 6c7233986f10afb82e0d848bc4e071f7d080d974

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
<<<<<<< HEAD
ENTRYPOINT ["dotnet", "Warehouse.Api.dll"]
=======
ENTRYPOINT ["dotnet", "WMS.Api.dll"]
>>>>>>> 6c7233986f10afb82e0d848bc4e071f7d080d974
