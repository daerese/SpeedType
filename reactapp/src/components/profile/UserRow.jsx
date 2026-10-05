import Avatar from './Avatar'

/**
 * UserRow (2026)
 *
 * A compact, clickable row for a player: their avatar, username, and (optionally) whether
 * they're online. Clicking it opens their profile, where you can add them as a friend.
 * Used for friend search results and the friends list in the navbar.
 *
 * @param {object} user - { username, profilePicturePath, color, isOnline? }
 * @param {boolean} showStatus - Show the green "online" / grey "offline" dot
 */
const UserRow = ({ user, showStatus = false }) => {

    return (
        <a
            href={`/profile/${user.username}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 duration-200"
        >
            <Avatar
                avatar={user.profilePicturePath}
                color={user.color}
                size={40}
                noRing={true}
            />

            <p className="font-semibold text-sm text-left grow truncate">{user.username}</p>

            {
                showStatus &&
                <span className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${user.isOnline ? "bg-green-500" : "bg-gray-300"}`}></span>
                    {user.isOnline ? "Online" : "Offline"}
                </span>
            }
        </a>
    )
}

export default UserRow
