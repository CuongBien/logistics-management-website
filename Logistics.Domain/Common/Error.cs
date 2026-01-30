using System;
using System.Collections.Generic;

namespace Logistics.Domain.Common
{
    public sealed record Error(string Code, string Description)
    {
        public static readonly Error None = new(string.Empty, string.Empty);
    }
}
