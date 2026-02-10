using System.Linq.Expressions;

namespace BuildingBlocks.Domain;

public interface IRepository<T> where T : IEntity
{
    Task<T?> FindByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    void Add(T entity);
    void Update(T entity);
    void Delete(T entity);
}
