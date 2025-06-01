// server-models.mjs
import dayjs from 'dayjs';

/**
 * Model for a User.
 * @param {number} id - User's unique ID.
 * @param {string} username - User's username.
 * @param {string} name - User's display name (optional).
 * @param {string} [hashedPassword] - User's hashed password (typically not serialized).
 * @param {string} [salt] - Salt for the password (typically not serialized).
 */
function User(id, username, name = null, hashedPassword = null, salt = null) {
    this.id = id;
    this.username = username;
    this.name = name || username; // Default name to username if not provided
    // Internal properties, not usually serialized for API responses
    this._hashedPassword = hashedPassword;
    this._salt = salt;

    /**
     * Serializes the User object for API responses.
     * Omits sensitive information like password and salt.
     */
    this.serialize = () => {
        return {
            id: this.id,
            username: this.username,
            name: this.name,
        };
    };
}

/**
 * Model for a Card.
 * @param {number} id - Card's unique ID.
 * @param {string} name - The name/description of the card (e.g., "Partner snores...").
 * @param {string} imageFilename - Filename of the card's image.
 * @param {number} misfortuneIndex - The card's misfortune index.
 */
function Card(id, name, imageFilename, misfortuneIndex=0) {
    this.id = id;
    this.name = name;
    this.imageFilename = imageFilename;
    this.misfortuneIndex = misfortuneIndex;

    /**
     * Serializes the Card object for API responses.
     */
    this.serialize = () => {
        return {
            id: this.id,
            name: this.name,
            imageFilename: this.imageFilename,
            misfortuneIndex: this.misfortuneIndex,
        };
    };
}

/**
 * Model for a MainPage Detail (a card within a game).
 * This model represents a card's state within a specific game.
 * @param {number} cardId - ID of the card.
 * @param {string} cardName - Name of the card.
 * @param {number} roundPresented - Round number card was presented (0 for initial).
 * @param {string} status - Status in game ('initial', 'won_round', 'lost_round').
 */
function GameCardDetail(cardId, cardName, roundPresented, status) {
    this.cardId = cardId;
    this.cardName = cardName; // Equivalent to Card.name or 'situation'
    this.roundPresented = roundPresented === null ? 0 : roundPresented;
    this.status = status;
    this.won = (status === 'initial' || status === 'won_round');

    /**
     * Serializes the GameCardDetail object for API responses.
     * This structure should match the `cardsPlayed` items in your frontend.
     */
    this.serialize = () => {
        return {
            // cardId: this.cardId, // Optional: frontend might not need cardId directly here
            round: this.roundPresented,
            situation: this.cardName,
            won: this.won,
        };
    };
}


/**
 * Model for a MainPage.
 * @param {number} id - MainPage's unique ID.
 * @param {number} userId - ID of the user who played.
 * @param {string} outcome - 'won' or 'lost'.
 * @param {number} finalScore - Total cards collected.
 * @param {string|Date} startTimestamp - MainPage start time.
 * @param {Array<GameCardDetail>} [cardsPlayed=[]] - Array of GameCardDetail objects for this game.
 */
function Game(id, userId, outcome, finalScore, startTimestamp, cardsPlayed = []) {
    this.id = id;
    this.userId = userId;
    this.outcome = outcome; // 'won' or 'lost'
    this.finalScore = finalScore;
    this.startTimestamp = dayjs(startTimestamp);
    this.cardsPlayed = cardsPlayed; // Array of GameCardDetail instances

    /**
     * Helper to add a card detail to this game.
     * @param {GameCardDetail} cardDetail - An instance of GameCardDetail.
     */
    this.addCardDetail = (cardDetail) => {
        if (cardDetail instanceof GameCardDetail) {
            this.cardsPlayed.push(cardDetail);
        } else {
            console.warn("Attempted to add an invalid object to MainPage.cardsPlayed. Expected GameCardDetail.");
        }
    };

    /**
     * Serializes the MainPage object for API responses.
     * This structure should match the game items in your `gameHistory` array.
     */
    this.serialize = () => {
        return {
            id: this.id,
            // userId: this.userId, // Usually not needed if history is already user-specific
            outcome: this.outcome === 'won' ? 'Won' : 'Lost', // Capitalized for display
            date: this.startTimestamp.toISOString(), // Standard ISO format
            totalCardsCollected: this.finalScore,
            cardsPlayed: this.cardsPlayed.map(cardDetail => cardDetail.serialize()),
        };
    };
}


export { User, Card, Game, GameCardDetail };
