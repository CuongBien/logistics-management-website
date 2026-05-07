using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Infrastructure.Persistence;
using Warehouse.Infrastructure.ErpSync;

namespace Warehouse.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<WMSDbContext>((sp, options) =>
        {
            options.UseNpgsql(connectionString);
        });

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<WMSDbContext>());
        services.AddMemoryCache();
        services.AddScoped<IOperatorAuthorizationService, Identity.OperatorAuthorizationService>();
        
        services.Configure<ErpSyncOptions>(configuration.GetSection("ErpSync"));
        services.AddHttpClient<IErpMasterDataClient, ErpMasterDataClient>((sp, client) =>
        {
            var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<ErpSyncOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl);
        });
        services.AddHostedService<ErpSyncWorker>();

        // MassTransit Configuration
        services.AddMassTransit(busConfigurator =>
        {
            busConfigurator.SetKebabCaseEndpointNameFormatter();
            busConfigurator.AddConsumers(typeof(IApplicationDbContext).Assembly);

            // Outbox Pattern for Reliability (use the application's DbContext)
            busConfigurator.AddEntityFrameworkOutbox<WMSDbContext>(o =>
            {
                o.QueryDelay = TimeSpan.FromSeconds(1);
                o.UsePostgres();
                o.UseBusOutbox();

            });

            busConfigurator.UsingRabbitMq((context, cfg) =>
            {
                // Configure Host
                cfg.Host(configuration["MessageBroker:RabbitMQ:Host"], "/", h =>
                {
                    h.Username(configuration["MessageBroker:RabbitMQ:Username"]);
                    h.Password(configuration["MessageBroker:RabbitMQ:Password"]);
                });

                cfg.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}
