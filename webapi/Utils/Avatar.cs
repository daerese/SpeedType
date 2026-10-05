namespace webapi.Utils
{
    public class Avatar
    {

        private readonly string[] icons =
        {
            "camera",
            "sparkles",
            "brain",
            "zap",
            "flame",
            "gem",
            "feather",
            "hamburger",
            "cat",
            "telescope",
            "ghost",
            "flower",
            "dog",
            "chessqueen",
            "rabbit",
            "rose",
            "pizza",
            "rainbow",
            "piano",
            "cupcake"
        };

        public string GetRandomIcon()
        {
            Random random = new Random();
            int index = random.Next(icons.Length);
            return icons[index];
        }

    }
}
