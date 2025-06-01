const SERVER_URL = "http://localhost:3001/api";
const logIn = async (credentials) => {
    const response = await fetch(SERVER_URL + '/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
    });
    if(response.ok) {
        const user = await response.json();
        return user;
    }
    else {
        const errDetails = await response.text();
        throw errDetails;
    }
};

const getUserInfo = async () => {
    const response = await fetch(SERVER_URL + '/sessions/current', {
        credentials: 'include',
    });
    const user = await response.json();
    if (response.ok) {
        return user;
    } else {
        throw user;  // an object with the error coming from the server
    }
};

const logOut = async() => {
    const response = await fetch(SERVER_URL + '/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    });
    if (response.ok)
        return null;
}
async function getUserHistory(userId) {
    const response = await fetch(`${SERVER_URL}/users/${userId}/history`,{
        method: 'GET',
        headers: {
    },
    credentials: 'include'
});
    if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }

        throw new Error('Invalid content type received for user profile.');
    } else {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { message: response.statusText };
        }
        const error = new Error(errorData.message || `Failed to fetch user profile with status ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }
}

async function getInitialCards() {
    const response = await fetch(`${SERVER_URL}/cards/initial`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    if (response.ok) {
        return response.json();
    } else {
        throw new Error('Failed to fetch initial cards');
    }
}
async function getNewRoundCard(excludedCards) {
    const params = new URLSearchParams();
    excludedCards.forEach(id => {
        params.append('excludedCards[]', id.toString());
    });
    const response = await fetch(`${SERVER_URL}/cards/new?${params.toString()}`, {
        method: 'GET',
        headers: {
        },
    });
    if (response.ok) {
        return response.json();
    } else {
        throw new Error('Failed to fetch new round card');
    }
}

async function submitPlacement(placementData) {
    const params = new URLSearchParams();
    params.append('challengeCardId', placementData.challengeCardId.toString());
    if (placementData.lowerBoundOwnedCardMI != null) {
        params.append('lowerBoundOwnedCardMI', placementData.lowerBoundOwnedCardMI.toString());
    }else{
        params.append('lowerBoundOwnedCardMI', '0');
    }
    if (placementData.upperBoundOwnedCardMI != null) {
        params.append('upperBoundOwnedCardMI', placementData.upperBoundOwnedCardMI.toString());
    }else{
        params.append('upperBoundOwnedCardMI', '100');
    }
    const response = await fetch(`${SERVER_URL}/cards/check-placement?${params.toString()}`, {
        method: 'GET', // Using GET
        headers: {
            // 'Content-Type': 'application/json', // Not needed for GET
        },
    });
    if (response.ok) {
        return response.json();
    } else {
        throw new Error('Failed to fetch new round card');
    }

}
async function saveGame(userId,initialCardObjects, playedRoundsLog,currentOutcomeResult) {
    const gameData = {
        userId: userId,
        initialCardObjects: initialCardObjects,
        playedRoundsLog: playedRoundsLog,
        outcome: currentOutcomeResult
    };
    const response = await fetch(`${SERVER_URL}/games`, { // POST to /api/games
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Send session cookies for authentication
        body: JSON.stringify(gameData),
    });
    if (response.ok) {
         return "ok";
    } else {
        throw new Error('Failed to save game');
    }
}

const API = {logIn, getUserInfo, logOut, getUserHistory,getInitialCards,getNewRoundCard,submitPlacement,saveGame};
export default API;