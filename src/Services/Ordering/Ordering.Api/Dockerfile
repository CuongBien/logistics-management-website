FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/Services/OMS/OMS.Api/OMS.Api.csproj", "src/Services/OMS/OMS.Api/"]
COPY ["src/Services/OMS/OMS.Application/OMS.Application.csproj", "src/Services/OMS/OMS.Application/"]
COPY ["src/Services/OMS/OMS.Domain/OMS.Domain.csproj", "src/Services/OMS/OMS.Domain/"]
COPY ["src/Services/OMS/OMS.Infrastructure/OMS.Infrastructure.csproj", "src/Services/OMS/OMS.Infrastructure/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Domain/BuildingBlocks.Domain.csproj", "src/BuildingBlocks/BuildingBlocks.Domain/"]
COPY ["src/BuildingBlocks/BuildingBlocks.Messaging/BuildingBlocks.Messaging.csproj", "src/BuildingBlocks/BuildingBlocks.Messaging/"]
RUN dotnet restore "./src/Services/OMS/OMS.Api/OMS.Api.csproj"
COPY . .
WORKDIR "/src/src/Services/OMS/OMS.Api"
RUN dotnet build "./OMS.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./OMS.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "OMS.Api.dll"]
