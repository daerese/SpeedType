import {
    Camera,
    Sparkles,
    Brain,
    Zap,
    Flame,
    Gem,
    Feather,
    Hamburger,
    Cat,
    Telescope,
    Ghost,
    Flower,
    Dog,
    ChessQueen,
    Rabbit,
    Rose,
    Pizza,
    Rainbow,
    Piano,
    Cupcake
} from 'lucide-react';

/**
 * avatarIcons (2026)
 *
 * Matches each avatar NAME (what's saved in the database's ProfilePicturePath)
 * to its Lucide icon component.
 *
 * IMPORTANT: These names must exactly match the list in the backend (webapi/Utils/Avatar.cs),
 * because the backend picks a random name from that list for new users.
 */
export const avatarIcons = {
    camera: Camera,
    sparkles: Sparkles,
    brain: Brain,
    zap: Zap,
    flame: Flame,
    gem: Gem,
    feather: Feather,
    hamburger: Hamburger,
    cat: Cat,
    telescope: Telescope,
    ghost: Ghost,
    flower: Flower,
    dog: Dog,
    chessqueen: ChessQueen,
    rabbit: Rabbit,
    rose: Rose,
    pizza: Pizza,
    rainbow: Rainbow,
    piano: Piano,
    cupcake: Cupcake
}
