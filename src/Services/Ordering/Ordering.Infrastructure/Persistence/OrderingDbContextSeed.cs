using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace Ordering.Infrastructure.Persistence;

public static class OrderingDbContextSeed
{
    public static Task SeedAsync(ApplicationDbContext context, ILogger logger)
    {
        logger.LogInformation("Seeding Ordering database...");
        // Placeholder for future database seed data if needed.
        return Task.CompletedTask;
    }
}
