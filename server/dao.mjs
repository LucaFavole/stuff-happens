import sqlite from 'sqlite3';
import crypto from 'crypto';
import {User, Card, Game, GameDetail} from "./models.mjs";

const db = new sqlite.Database('database.sqlite', (err) => {
    if (err) throw err;
});
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
                SELECT id, outcome, final_score, start_ts
                FROM Games
                WHERE user_id = ?
                ORDER BY start_ts DESC
            `;
            db.all(gamesSql, [userId], async (err, games) => {
                if (err) {
                    console.error(`DAO Error (getGames): User ID ${userId}`, err);
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
                            date: new Date(game.start_ts).toISOString(),
                            totalCardsCollected: game.final_score,
                            cardsPlayed: cardsPlayedFormatted
                        });

                        gameIndex++;
                        fetchNextGameDetails(); // Process next game
                    });
                };

                fetchNextGameDetails(); // Start fetching details for the first game
            });
        });
    });
};

export const getInitialCards = () => {
    return new Promise ((resolve, reject) => {
        const sql = 'SELECT id, name, image_filename, misfortune_index FROM Cards ORDER BY RANDOM() LIMIT 3';

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('DAO Error (getInitialCards):', err);
                reject(err);
            }
            resolve(rows.map(row => new Card(row.id, row.name, row.image_filename, row.misfortune_index)));
        });
    });
}

export const getNewCard = (excludedCards) => {
    return new Promise((resolve, reject) => {
        const placeholders = excludedCards.map(() => '?').join(',');
        const sql = `SELECT id, name, image_filename, misfortune_index FROM Cards WHERE id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT 1`;

        db.get(sql, excludedCards, (err, row) => {
            if (err) {
                console.error('DAO Error (getNewCard):', err);
                reject(err);
            } else if (!row) {
                resolve(null); // No new card available
            } else {
                resolve(new Card(row.id, row.name, row.image_filename));
            }
        });
    });
}


export const checkPlacement = (placementData) => {
    return new Promise((resolve, reject) => {
        const {challengeCardId, lowerBoundOwnedCardMI, upperBoundOwnedCardMI} = placementData;
        const sql = `
            SELECT C.id, C.name, C.image_filename, C.misfortune_index
            FROM Cards C
            WHERE C.id = ?
        `;
        db.get(sql, [challengeCardId], (err, row) => {
            if (err) {
                console.error('DAO Error (checkPlacement):', err);
                reject(err);
            }
            if (parseFloat(row.misfortune_index) > parseFloat(lowerBoundOwnedCardMI) && parseFloat(row.misfortune_index) < parseFloat(upperBoundOwnedCardMI)) {
                const placedCard = new Card(row.id, row.name, row.image_filename, row.misfortune_index);
                resolve({isCorrect: true, placedCardDetails: placedCard.serialize()});
            }else{
                const placedCard = new Card(challengeCardId);
                resolve({isCorrect: false, placedCardDetails: placedCard.serialize()});
            }
        });
    });

}

export const saveGame = (gameData) => {
    return new Promise((resolve, reject) => {
        const {userId,initialCardObjects, playedRoundsLog,outcome} = gameData;
        const gameSql = `INSERT INTO Games (user_id, outcome, final_score, start_ts, end_ts) 
                         VALUES (?, ?, ?, DATETIME('now', '-5 minutes'), DATETIME('now'))`;
        db.run(gameSql, [userId, outcome, playedRoundsLog.length+3], function(gameInsertErr) {
            if (gameInsertErr) {
                return reject(gameInsertErr);
            }

            const newGameId = this.lastID;

            const detailInsertPromises = [];

            initialCardObjects.forEach(initialCard => {
                detailInsertPromises.push(new Promise((res, rej) => {
                    const initialDetailSql = 'INSERT INTO GameDetails (game_id, card_id, status, round_presented) VALUES (?, ?, ?, ?)';
                    db.run(initialDetailSql, [newGameId, initialCard.id, 'initial', null], (err) => {
                        if (err) rej(err); else res();
                    });
                }));
            });

            // 3. Insert cards from played rounds into GameDetails
            playedRoundsLog.forEach(roundCard => {
                detailInsertPromises.push(new Promise((res, rej) => {
                    const roundDetailSql = 'INSERT INTO GameDetails (game_id, card_id, status, round_presented) VALUES (?, ?, ?, ?)';
                    db.run(roundDetailSql, [newGameId, roundCard.cardId, roundCard.status, roundCard.round], (err) => {
                        if (err) rej(err); else res();
                    });
                }));
            });

            Promise.all(detailInsertPromises)
                .then(() => {
                    resolve({ newGameId: newGameId, message: "Game and details saved (simplified)." });
                })
                .catch(detailsErr => {
                    reject(new Error(`Game record ${newGameId} created, but failed to save all details: ${detailsErr.message}`));
                });
        });
    });


}