using MasterData.Application.Common.Interfaces;
using MasterData.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MassTransit;
using MasterData.Application.Features.Partners.Consumers;

namespace MasterData.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<MasterDataDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<MasterDataDbContext>());

        // MassTransit Configuration
        services.AddMassTransit(busConfigurator =>
        {
            busConfigurator.SetKebabCaseEndpointNameFormatter();
            busConfigurator.AddConsumer<NewPartnerEncounteredConsumer>();

            // Outbox Pattern for Reliability
            busConfigurator.AddEntityFrameworkOutbox<MasterDataDbContext>(o =>
            {
                o.QueryDelay = TimeSpan.FromSeconds(1);
                o.UsePostgres();
                o.UseBusOutbox();
            });

            busConfigurator.UsingRabbitMq((context, cfg) =>
            {
                cfg.Host(configuration["MessageBroker:RabbitMQ:Host"], "/", h =>
                {
                    h.Username(configuration["MessageBroker:RabbitMQ:Username"] ?? "lms");
                    h.Password(configuration["MessageBroker:RabbitMQ:Password"] ?? "lms123");
                });

                cfg.ReceiveEndpoint("master-data-partner-sync", e =>
                {
                    // Đảm bảo Binding được tạo đúng với Exchange của Event
                    e.Bind("EventBus.Messages.Events:NewPartnerEncounteredIntegrationEvent");
                    
                    e.ConfigureConsumer<NewPartnerEncounteredConsumer>(context);
                });
            });
        });

        return services;
    }
}
