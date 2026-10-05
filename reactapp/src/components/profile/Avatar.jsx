//Importing the default profile picture to use if the
// user has nothing set.
import defaultProfilePicture from "../../assets/default-profile-picture.png"

import { avatarIcons } from "./avatarIcons";

// * Used when we don't know the player's color (EX: friend requests and invites only store the picture)
const DEFAULT_AVATAR_COLOR = "#1A8FDD"

/**
 * Avatar
 *
 * Shows a player's avatar as a round picture.
 *
 * 2026: Players now have a built-in Lucide icon avatar (EX: "cat") instead of an uploaded picture.
 * - If `avatar` is one of the icon names in avatarIcons.js: shows that icon on a circle in the player's color.
 * - If `avatar` is a picture link (older players, or a preview): shows the picture.
 * - Otherwise: shows the default keyboard picture.
 *
 * @param {number} size - Width and height in pixels
 * @param {string} avatar - The value saved in the database's ProfilePicturePath (EX: "cat")
 * @param {string} color - The player's preferred color (the circle's background)
 * @param {boolean} noRing - Hide the grey ring around picture avatars
 */
const Avatar = ({ size, avatar, color, noRing = false }) => {

    // * In React, a component stored in a variable has to start with a capital letter to render
    const Icon = avatar ? avatarIcons[avatar] : null

    if (Icon) {
        return (
            <div
                className="rounded-full flex items-center justify-center shrink-0"
                style={{
                    width: size,
                    height: size,
                    backgroundColor: color || DEFAULT_AVATAR_COLOR
                }}
            >
                <Icon
                    size={Math.round(size * 0.55)}
                    color="white"
                    strokeWidth={2}
                    aria-label={`${avatar} avatar`}
                />
            </div>
        )
    }

    // * Older players may still have a picture link saved (EX: from the old Firebase uploads)
    const isPictureLink = typeof avatar === "string" &&
        (avatar.startsWith("http") || avatar.startsWith("blob:"))

    return (
        <img className={`rounded-full p-1 shrink-0 object-cover ${noRing ? "" : "ring-2 ring-gray-300"}`}
            src={isPictureLink ? avatar : defaultProfilePicture}
            alt="Avatar"
            style={{ width: size, height: size }}
        />
    )
}


export default Avatar
