FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
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

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WMS.Api.dll"]
