import sqlite from 'sqlite3';
import crypto from 'crypto';
import {User, Card, Game, GameDetail} from "./models.mjs";

// --- DATABASE INIT ---
const db = new sqlite.Database('database.sqlite', (err) => {
    if (err) throw err;
});

// --- UTENTE ---

export const getUser = (username, password) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM user WHERE username = ?';
        db.get(sql, [username], (err, row) => {
            if (err) {
                reject(err);
            }
            else if (row === undefined) {
                resolve(false);
            }
            else {
                const user = {id: row.id, username: row.username, name: row.name};
                crypto.scrypt(password, row.salt, 16, function(err, hashedPassword) {
                    if (err) reject(err);
                    if(!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword))
                        resolve(false);
                    else
                        resolve(user);
                });
            }
        });
    });
};

// --- STORIA UTENTE ---

export const getUserHistory = (userId) => {
    return new Promise((resolve, reject) => {
        const userSql = 'SELECT id, username, name FROM User WHERE id = ?';
        db.get(userSql, [userId], (err, userInfo) => {
            if (err) {
                return reject(err);
            }
            if (!userInfo) {
                return resolve(null);
            }

            const gamesSql = `
                SELECT id, outcome, final_score, date
                FROM Games
                WHERE user_id = ?
                  AND outcome IN ('lost', 'won')
                ORDER BY date DESC
            `;
            db.all(gamesSql, [userId], async (err, games) => {
                if (err) {
                    return reject(err);
                }

                const gameHistoryFormatted = [];
                let gameIndex = 0;
                const fetchNextGameDetails = () => {
                    if (gameIndex >= games.length) {
                        const historyPayload = {
                            id: userInfo.id,
                            username: userInfo.username,
                            name: userInfo.name || userInfo.username,
                            gameHistory: gameHistoryFormatted
                        };
                        return resolve(historyPayload);
                    }

                    const game = games[gameIndex];
                    const gameDetailsSql = `
                        SELECT C.name AS card_situation, GD.round_presented, GD.status
                        FROM GameDetails GD
                        JOIN Cards C ON GD.card_id = C.id
                        WHERE GD.game_id = ?
                        ORDER BY GD.round_presented, C.misfortune_index 
                    `;
                    db.all(gameDetailsSql, [game.id], (err, detailsOfThisGame) => {
                        if (err) {
                            return reject(err);
                        }

                        const cardsPlayedFormatted = detailsOfThisGame.map(detail => ({
                            round: detail.round_presented === null ? 0 : detail.round_presented,
                            situation: detail.card_situation,
                            won: (detail.status === 'initial' || detail.status === 'won_round')
                        }));

                        gameHistoryFormatted.push({
                            id: game.id,
                            outcome: game.outcome === 'won' ? 'Won' : 'Lost',
                            date: new Date(game.date).toISOString(),
                            totalCardsCollected: game.final_score,
                            cardsPlayed: cardsPlayedFormatted
                        });

                        gameIndex++;
                        fetchNextGameDetails();
                    });
                };

                fetchNextGameDetails();
            });
        });
    });
};

// --- CARTE ---

export const getInitialCards = () => {
    return new Promise ((resolve, reject) => {
        const sql = 'SELECT id, name, image_filename, misfortune_index FROM Cards ORDER BY RANDOM() LIMIT 3';
        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows.map(row => new Card(row.id, row.name, row.image_filename, row.misfortune_index)));
        });
    });
};

export const getNewCard = (excludedCards) => {
    return new Promise((resolve, reject) => {
        if (!excludedCards || excludedCards.length === 0) {
            // Se non ci sono carte da escludere, restituisci una a caso
            db.get('SELECT id, name, image_filename, misfortune_index FROM Cards ORDER BY RANDOM() LIMIT 1', [], (err, row) => {
                if (err) reject(err);
                else if (!row) resolve(null);
                else resolve(new Card(row.id, row.name, row.image_filename, row.misfortune_index));
            });
        } else {
            const placeholders = excludedCards.map(() => '?').join(',');
            const sql = `SELECT id, name, image_filename, misfortune_index FROM Cards WHERE id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT 1`;
            db.get(sql, excludedCards, (err, row) => {
                if (err) reject(err);
                else if (!row) resolve(null);
                else resolve(new Card(row.id, row.name, row.image_filename, row.misfortune_index));
            });
        }
    });
};

// --- PARTITA ---

// Crea una nuova partita e inserisce le 3 carte iniziali in GameDetails
export const createGame = (initialCardObjects, userId) => {

    return new Promise((resolve, reject) => {
        const gameSql = `INSERT INTO Games (user_id, outcome, final_score, date) VALUES (?, ?, ?, DATETIME('now'))`;
        db.run(gameSql, [userId, null, 3], function(gameInsertErr) {
            if (gameInsertErr) return reject(gameInsertErr);
            const newGameId = this.lastID;
            const detailInsertPromises = initialCardObjects.map(initialCard =>
                new Promise((res, rej) => {
                    const initialDetailSql = 'INSERT INTO GameDetails (game_id, card_id, status, round_presented) VALUES (?, ?, ?, ?)';
                    db.run(initialDetailSql, [newGameId, initialCard.id, 'initial', null], (err) => {
                        if (err) rej(err); else res();
                    });
                })
            );
            Promise.all(detailInsertPromises)
                .then(() => resolve(newGameId))
                .catch(detailsErr => reject(detailsErr));
        });
    });
};

// Salva lo stato di un singolo round (viene chiamato ad ogni round)
export const saveRoundState = (gameId, roundState) => {

    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO GameDetails (game_id, card_id, status, round_presented) VALUES (?, ?, ?, ?)';
        db.run(
            sql,
            [
                gameId,
                roundState.cardId,
                roundState.status,
                roundState.round
            ],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ detailId: this.lastID });
                }
            }
        );
    });
};

export const updateRoundState = (gameId, roundState) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE GameDetails 
            SET status = ?
            WHERE game_id = ? AND card_id = ?
        `;
        db.run(
            sql,
            [
                roundState.status,
                gameId,
                roundState.cardId
            ],
            function(err) {
                if (err) {
                    console.error("Error updating round state:", err);
                    reject(err);
                } else {
                    resolve({ detailId: this.changes });
                }
            }
        );
    });
}

// Aggiorna l’outcome e il punteggio finale della partita (chiamato a fine partita)
export const endGame = (gameId, outcome, finalScore) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE Games SET outcome = ?, final_score = ? WHERE id = ?`;
        db.run(sql, [outcome, finalScore, gameId], function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
};

// --- LOGICA ROUND (per validazione lato backend) ---

export const checkPlacement = (challengeCardId, ownedCards, positionIndex) => {
    return new Promise((resolve, reject) => {
        // Recupera la carta da indovinare
        const sql = `SELECT id, name, image_filename, misfortune_index FROM Cards WHERE id = ?`;
        db.get(sql, [challengeCardId], (err, row) => {
            if (err || !row) return reject(err || new Error("Card not found"));

            const misfortune = parseFloat(row.misfortune_index);

            // Calcola i limiti (ordinando le carte possedute)
            const sorted = ownedCards.slice().sort((a, b) => a.misfortune_index - b.misfortune_index);
            if (positionIndex===null){
                return resolve({ isCorrect: false, placedCardDetails: row });
            }
            let lower = positionIndex === 0 ? -Infinity : parseFloat(sorted[positionIndex - 1].misfortune_index);
            let upper = positionIndex === sorted.length ? Infinity : parseFloat(sorted[positionIndex].misfortune_index);

            if (misfortune > lower && misfortune < upper) {
                resolve({ isCorrect: true, placedCardDetails: row });
            } else {
                resolve({ isCorrect: false, placedCardDetails: row });
            }
        });
    });
}
export const getCurrentOwnedCards = (gameId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT C.id, C.name, C.image_filename, C.misfortune_index
            FROM GameDetails GD
            JOIN Cards C ON GD.card_id = C.id
            WHERE GD.game_id = ? AND (GD.status = 'initial' OR GD.status = 'won_round')
            ORDER BY C.misfortune_index ASC
        `;
        db.all(sql, [gameId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

export const getCurrentRoundNumber = (gameId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(*) AS roundCount
            FROM GameDetails
            WHERE game_id = ? AND status IN ('won_round', 'lost_round')
        `;
        db.get(sql, [gameId], (err, row) => {
            if (err) reject(err);
            else resolve((row.roundCount || 0) + 1); // +1 per il prossimo round
        });
    });
};

export const getExcludedCards = (gameId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT card_id
            FROM GameDetails
            WHERE game_id = ?
        `;
        db.all(sql, [gameId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows.map(r => r.card_id));
        });
    });
};

export const getErrorCount = (gameId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT COUNT(*) AS errors FROM GameDetails WHERE game_id = ? AND status = 'lost_round'`;
        db.get(sql, [gameId], (err, row) => {
            if (err) reject(err);
            else resolve(row.errors);
        });
    });
};

export const getGameOutcome = async (gameId) => {
    const MAX_CARDS_TO_WIN = 6;
    const MAX_MISTAKES = 3;
    const ownedCards = await getCurrentOwnedCards(gameId);
    const errors = await getErrorCount(gameId);
    if (ownedCards.length >= MAX_CARDS_TO_WIN) return 'won';
    if (errors >= MAX_MISTAKES) return 'lost';
    return 'active';
};

export const startTimer = async (gameId) => {
    return new Promise((resolve, reject) => {
        const sql = 'UPDATE Games SET last_card_time = DATETIME("now") WHERE id = ?';
        db.run(sql, [gameId], function(err) {
            if (err) reject(err);
            else resolve();
        });
    });
};

export const endTimer = async (gameId) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT last_card_time FROM Games WHERE id = ?';
        db.get(sql, [gameId], function(err,row) {
            if (err) reject(err);
            else resolve(row.last_card_time);
        });
    }); 
}

export const getRoundState = async (gameId, round) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT card_id
            FROM GameDetails GD
            WHERE GD.game_id = ? AND GD.round_presented = ?
        `;
        db.get(sql, [gameId, round], (err, row) => {
            if (err) reject(err);
            else if (!row) resolve(null);
            else resolve(
                {
                card_id : row.card_id,
            });
        });
    });
};




