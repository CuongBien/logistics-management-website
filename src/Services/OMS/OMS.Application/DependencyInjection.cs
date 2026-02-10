using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace OMS.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        services.AddMediatR(cfg => {
            cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
        });

        // AutoMapper if needed
        // services.AddAutoMapper(Assembly.GetExecutingAssembly());

        return services;
    }
}
