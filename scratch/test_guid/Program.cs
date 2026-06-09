using System;

class Program
{
    static void Main()
    {
        string[] guids = {
            "b61a8f61-5238-4a18-809c-335cc293a025",
            "a3a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1",
            "b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2",
            "c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3",
            "d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4",
            "e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5",
            "f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6",
            "d1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1",
            "d2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2",
            "d3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3"
        };

        foreach (var g in guids)
        {
            try
            {
                Guid guid = Guid.Parse(g);
                Console.WriteLine($"{g} -> OK (Guid: {guid})");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"{g} -> FAIL: {ex.Message}");
            }
        }
    }
}
