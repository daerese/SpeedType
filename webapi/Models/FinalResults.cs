namespace webapi.Models
{
    public class FinalResults
    {


        public int FinalWpm { get; set; }

        public long FinishTime { get; set; }

        public int Position { get; set; }

        public int PlayerCount { get; set; }
        

        public int FinalAccuracy { get; set; }

        // Determines if a player left early or not
        // TODO: If True, DONT upload to database
        public bool Dnf { get; set; }


        public override string ToString()
        {
            return $"FinalWpm: {FinalWpm}\nFinishTime: {FinishTime}\nPosition: {Position}\nDnf: {Dnf} \nAccuracy: {FinalAccuracy}";
        }



    }
}
