using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Ordering.Application.Common.Behaviors;

namespace Ordering.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
            
            // Register Pipeline Behaviors
            cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        // AutoMapper if needed
        // services.AddAutoMapper(Assembly.GetExecutingAssembly());

        return services;
    }
}
