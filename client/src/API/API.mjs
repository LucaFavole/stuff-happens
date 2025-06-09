const SERVER_URL = "http://localhost:3001/api";

const handleResponse = async (response) => {
    if (response.status === 204) return;
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    return response.json();
};

// Auth API
const logIn = async (credentials) => {
    const response = await fetch(`${SERVER_URL}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
    });
    return handleResponse(response);
};

const getUserInfo = async () => {
    const response = await fetch(`${SERVER_URL}/sessions/current`, {
        credentials: 'include'
    });
    return handleResponse(response);
};

const logOut = async () => {
    const response = await fetch(`${SERVER_URL}/sessions/current`, {
        method: 'DELETE',
        credentials: 'include'
    });
    return handleResponse(response);
};

// Game API
const createNewGame = async () => {
    const response = await fetch(`${SERVER_URL}/games`, {
        method: 'POST',
        credentials: 'include'
    });
    return handleResponse(response);
};
const createNewDemoGame = async () => {
    const response = await fetch(`${SERVER_URL}/games`, {
        method: 'POST',
    });
    return handleResponse(response);
};

const getNextChallengeCard = async (gameId) => {
    const response = await fetch(`${SERVER_URL}/games/${gameId}/new-card`, {
        method: 'POST',
        credentials: 'include'
    });
    return handleResponse(response);
};

const submitRoundChoice = async (gameId, positionIndex) => {
    const response = await fetch(`${SERVER_URL}/games/${gameId}/round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ positionIndex})
    });
    return handleResponse(response);
};

// History API
const getUserHistory = async (userId) => {
    const response = await fetch(`${SERVER_URL}/users/${userId}/history`, {
        credentials: 'include'
    });
    return handleResponse(response);
};
async function getGameState(gameId) {
    const response = await fetch(`${SERVER_URL}/games/${gameId}/state`, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch game state");
    return await response.json();
}
const API = {
    // Auth
    logIn,
    getUserInfo,
    logOut,

    // Game flow
    createNewGame,
    getNextChallengeCard,
    submitRoundChoice,

    // History
    getUserHistory,

    getGameState,
    createNewDemoGame
};

export default API;
