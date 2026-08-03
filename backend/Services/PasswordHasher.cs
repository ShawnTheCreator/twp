using System;
using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

namespace TWPublishers.Backend.Services
{
    public class PasswordHasher
    {
        // Argon2id parameters
        private const int DegreeOfParallelism = 1;
        private const int Iterations = 3;
        private const int MemorySize = 65536; // 64 MB
        private const int SaltSize = 16;
        private const int HashSize = 32;

        public string Hash(string password)
        {
            byte[] salt = new byte[SaltSize];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
            {
                Salt = salt,
                DegreeOfParallelism = DegreeOfParallelism,
                Iterations = Iterations,
                MemorySize = MemorySize
            };

            byte[] hash = argon2.GetBytes(HashSize);

            // Format: $argon2id$v=19$m=65536,t=3,p=1$salt$hash
            return $"$argon2id$v=19$m={MemorySize},t={Iterations},p={DegreeOfParallelism}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
        }

        public bool Verify(string password, string hashString)
        {
            if (string.IsNullOrEmpty(hashString) || !hashString.StartsWith("$argon2id$"))
                return false;

            try
            {
                var parts = hashString.Split('$');
                if (parts.Length != 6) return false;

                var salt = Convert.FromBase64String(parts[4]);
                var expectedHash = Convert.FromBase64String(parts[5]);

                var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
                {
                    Salt = salt,
                    DegreeOfParallelism = DegreeOfParallelism,
                    Iterations = Iterations,
                    MemorySize = MemorySize
                };

                byte[] actualHash = argon2.GetBytes(HashSize);

                return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
            }
            catch
            {
                return false;
            }
        }
    }
}
