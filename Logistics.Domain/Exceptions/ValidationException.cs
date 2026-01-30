using System.Collections.Generic;
using System.Linq;

namespace Logistics.Domain.Exceptions
{
    public class ValidationException : DomainException
    {
        public IReadOnlyDictionary<string, string[]> Errors { get; }

        public ValidationException(IReadOnlyDictionary<string, string[]> errors)
            : base("One or more validation failures have occurred.")
        {
            Errors = errors;
        }

        public ValidationException(string[] errors) 
            : this(new Dictionary<string, string[]> { { "Validation", errors } })
        {
        }
        
        public ValidationException(string error)
            : this(new[] { error })
        {
        }
    }
}
