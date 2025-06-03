import dayjs from 'dayjs';

/**
 * Model for the Users table.
 * @param {number} id - The unique identifier for the user.
 * @param {string} username - The user's username.
 * @param {string} hashedPassword - The user's hashed password.
 * @param {string} salt - The salt used for hashing the password.
 */
function User(id, username, hashedPassword, salt) {
    this.id = id;
    this.username = username;
    this.hashedPassword = hashedPassword; // In a real application, you wouldn't often pass hash and salt like this
    this.salt = salt;                   // but the model reflects the table structure.
}

/**
 * Model for the Cards table.
 * @param {number} id - The unique identifier for the card.
 * @param {string} name - The name of the horrible situation.
 * @param {string} imageFilename - The filename of the representative image.
 * @param {number} misfortuneIndex - The misfortune index of the card.
 */
function Card(id, name="", imageFilename="", misfortuneIndex=0) {
    this.id = id;
    this.name = name;
    this.image_filename = imageFilename;
    this.misfortune_index = misfortuneIndex;
    this.serialize = () => {
        return {
            id: this.id,
            name: this.name,
            image_filename: this.image_filename,
            misfortune_index: this.misfortune_index,
        };
    };
}

/**
 * Model for the Games table.
 * @param {number} id - The unique identifier for the game.
 * @param {number} userId - The ID of the user who played the game.
 * @param {string|Date} startTimestamp - The start timestamp of the game.
 * @param {string} outcome - The outcome of the game ('won' or 'lost').
 * @param {string|Date|null} [endTimestamp=null] - The end timestamp of the game (optional).
 * @param {number|null} [finalScore=null] - The final score of the game (optional).
 */
function Game(id, userId, startTimestamp, outcome, endTimestamp = null, finalScore = null) {
    this.id = id;
    this.userId = userId;
    this.startTimestamp = dayjs(startTimestamp);
    this.outcome = outcome;
    this.endTimestamp = endTimestamp ? dayjs(endTimestamp) : null;
    this.finalScore = finalScore;
}

/**
 * Model for the GameDetails table.
 * @param {number} gameId - The ID of the game this detail refers to.
 * @param {number} cardId - The ID of the card involved in this detail.
 * @param {string} status - The status of the card in the game ('initial', 'won_round', 'lost_round').
 * @param {number|null} [roundPresented=null] - The round in which the card was presented (optional, null for initial cards).
 */
function GameDetail(gameId, cardId, status, roundPresented = null) {
    this.gameId = gameId;
    this.cardId = cardId;
    this.status = status;
    this.roundPresented = roundPresented;
}

export { User, Card, Game, GameDetail };
