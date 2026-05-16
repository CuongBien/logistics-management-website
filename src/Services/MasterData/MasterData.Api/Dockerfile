FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/BuildingBlocks/Logistics.Core/Logistics.Core.csproj", "src/BuildingBlocks/Logistics.Core/"]
COPY ["src/BuildingBlocks/EventBus.Messages/EventBus.Messages.csproj", "src/BuildingBlocks/EventBus.Messages/"]
COPY ["src/Services/MasterData/MasterData.Api/MasterData.Api.csproj", "src/Services/MasterData/MasterData.Api/"]
COPY ["src/Services/MasterData/MasterData.Application/MasterData.Application.csproj", "src/Services/MasterData/MasterData.Application/"]
COPY ["src/Services/MasterData/MasterData.Domain/MasterData.Domain.csproj", "src/Services/MasterData/MasterData.Domain/"]
COPY ["src/Services/MasterData/MasterData.Infrastructure/MasterData.Infrastructure.csproj", "src/Services/MasterData/MasterData.Infrastructure/"]
RUN dotnet restore "./src/Services/MasterData/MasterData.Api/MasterData.Api.csproj"
COPY . .
WORKDIR "/src/src/Services/MasterData/MasterData.Api"
RUN dotnet build "./MasterData.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./MasterData.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MasterData.Api.dll"]
