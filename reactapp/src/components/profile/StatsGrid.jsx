/**
 * StatsGrid (2026)
 *
 * Shows a player's stats as a 2x2 grid of tiles (big number, small label).
 * Used on both the home page and the profile page so they look the same.
 *
 * @param {object} stats - { averageWpm, averageAccuracy, bestWpm, gamesPlayed } or null
 * @param {string} emptyMessage - Shown when the player hasn't played a game yet
 */

const StatTile = ({ label, value }) => {

    return (
        <div className="bg-white/70 border border-gray-200 rounded-lg px-3 py-2">
            <p className="text-2xl font-bold leading-tight">{value ?? "–"}</p>
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        </div>
    )
}

const StatsGrid = ({ stats, emptyMessage = "Play your first game to see your stats." }) => {

    if (!stats || !stats.gamesPlayed) {
        return <p className="text-gray-500">{emptyMessage}</p>
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            <StatTile label="Avg WPM" value={stats.averageWpm} />
            <StatTile label="Best WPM" value={stats.bestWpm} />
            <StatTile label="Avg Accuracy" value={stats.averageAccuracy != null ? `${stats.averageAccuracy}%` : null} />
            <StatTile label="Games Played" value={stats.gamesPlayed} />
        </div>
    )
}

export default StatsGrid
