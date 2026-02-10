using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using OMS.Application.Common.Interfaces;
using OMS.Infrastructure.Persistence;
using MassTransit;

namespace OMS.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            options.UseNpgsql(connectionString);
        });

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

        // MassTransit Configuration
        services.AddMassTransit(busConfigurator =>
        {
            busConfigurator.SetKebabCaseEndpointNameFormatter();

            busConfigurator.UsingRabbitMq((context, cfg) =>
            {
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
