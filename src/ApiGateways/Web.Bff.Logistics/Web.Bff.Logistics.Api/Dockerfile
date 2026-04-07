FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/ApiGateways/Web.Bff.Logistics/Web.Bff.Logistics.Api/Web.Bff.Logistics.Api.csproj", "src/ApiGateways/Web.Bff.Logistics/Web.Bff.Logistics.Api/"]
RUN dotnet restore "./src/ApiGateways/Web.Bff.Logistics/Web.Bff.Logistics.Api/Web.Bff.Logistics.Api.csproj"
COPY . .
WORKDIR "/src/src/ApiGateways/Web.Bff.Logistics/Web.Bff.Logistics.Api"
RUN dotnet build "./Web.Bff.Logistics.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Web.Bff.Logistics.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Web.Bff.Logistics.Api.dll"]
