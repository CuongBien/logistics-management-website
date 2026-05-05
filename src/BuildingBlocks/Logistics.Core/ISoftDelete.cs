namespace Logistics.Core;

public interface ISoftDelete
{
    bool IsDeleted { get; }
    void Delete();
}
