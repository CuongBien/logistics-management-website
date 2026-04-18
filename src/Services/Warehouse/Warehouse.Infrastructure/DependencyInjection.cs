using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Infrastructure.Persistence;

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

        // MassTransit Configuration
        services.AddMassTransit(busConfigurator =>
        {
            busConfigurator.SetKebabCaseEndpointNameFormatter();

            // Outbox Pattern for Reliability (use the application's DbContext)
            busConfigurator.AddEntityFrameworkOutbox<WMSDbContext>(o =>
            {
                o.QueryDelay = TimeSpan.FromSeconds(1);
                o.UsePostgres();
                o.UseBusOutbox();

                // Ensure MassTransit uses the same DbContext configuration
                o.UseDbContext< WMSDbContext>((provider, builder) =>
                {
                    builder.UseNpgsql(connectionString);
                });
            });

            busConfigurator.UsingRabbitMq((context, cfg) =>
            {
                // Configure Host
                cfg.Host(configuration["MessageBroker:RabbitMQ:Host"], "/", h =>
                {
                    h.Username(configuration["MessageBroker:RabbitMQ:Username"]);
                    h.Password(configuration["MessageBroker:RabbitMQ:Password"]);
                });

                // Do not configure consumers/endpoints here - this service only publishes (inbound publishing only)
            });
        });

        return services;
    }
}
