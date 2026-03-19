using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Ordering.Application.Common.Interfaces;
using Ordering.Infrastructure.Persistence;
using MassTransit;
using Ordering.Application.Sagas.OrderFulfillment;

namespace Ordering.Infrastructure;

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

            busConfigurator.AddConsumers(typeof(IApplicationDbContext).Assembly);

            busConfigurator.AddSagaStateMachine<OrderFulfillmentStateMachine, OrderState>()
                .EntityFrameworkRepository(r =>
                {
                    r.ConcurrencyMode = ConcurrencyMode.Pessimistic;
                    r.UsePostgres();
                    r.ExistingDbContext<ApplicationDbContext>();
                });

            busConfigurator.AddEntityFrameworkOutbox<ApplicationDbContext>(o =>
            {
                o.QueryDelay = TimeSpan.FromSeconds(1);
                o.UsePostgres();
                o.UseBusOutbox();
            });

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
