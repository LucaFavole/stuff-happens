[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/uNTgnFHD)
# Exam #1: "Stuff Happens"

## Student: s339239 FAVOLE LUCA

## React Client Application Routes

- `/`  
  MainPage: displays the game rules and a Try Demo Game button.

- `/login`  
  LoginForm: user authentication; redirects logged-in users to `/PersonalPage`.

- `/PersonalPage`  
  PersonalPage: user dashboard with profile info and game history (protected).

- `/Game/:gameId`  
  Game: shows three initial cards and a Start Game button.

- `/Game/:gameId/demo`  
  GameDemo: single-round demo for guests or authenticated users.

- `/Game/:gameId/round/:roundId`  
  GameRound: active round with challenge card, countdown timer, placement slots, and owned cards.

- `/Game/:gameId/round/:roundId/endround`  
  GameEndRound: displays round result, won-card preview (if correct), and Next Round or View Final Results button.

- `/Game/:gameId/endgame`  
  GameEndGame: final summary of collected cards and errors, plus Start New Game and Back to Profile buttons.

- `*`  
  NotFound: fallback 404 page.

## API Server

- **POST** `/api/sessions`
  - Body: `{ "username": "string", "password": "string" }`
  - Response 201: authenticated user object

- **DELETE** `/api/sessions/current`
  - Response 204: no content

- **GET** `/api/sessions/current`
  - Response 200: user object if authenticated
  - Response 401: `{ "error": "Unauthenticated" }`

- **GET** `/api/users/:id/history`
  - URL param: `id` (user ID)
  - Response 200: array of past game records

- **POST** `/api/games`
  - No request body
  - Response 201:
    ```
    {
      "gameId": number,
      "initialCards": [
        { "id": number, "name": string, "image_filename": string, "misfortune_index": number },
        …
      ]
    }
    ```

- **POST** `/api/games/:gameId/new-card`
  - URL param: `gameId`
  - Response 200:
    ```
    { "id": number, "name": string, "image_filename": string }
    ```

- **POST** `/api/games/:gameId/round`
  - URL param: `gameId`
  - Body: `{ "positionIndex": number }`
  - Response 200:
    ```
    {
      "isCorrect": boolean,
      "newCard": { "id": number, "name": string, "image_filename": string, "misfortune_index": number } | null,
      "ownedCards": [ … ],
      "errors": number,
      "round": number,
      "outcome": "playing" | "won" | "lost"
    }
    ```

- **GET** `/api/games/:gameId/state`
  - URL param: `gameId`
  - Response 200:
    ```
    {
      "ownedCards": [ … ],
      "state": "PLAYING" | "WON" | "LOST",
      "errors": number,
      "round": number
    }
    ```

## Database Tables
## Database Tables

### Users
| Column        | Type     | Constraints                       |
|---------------|----------|-----------------------------------|
| id            | INTEGER  | PRIMARY KEY, AUTOINCREMENT        |
| username      | TEXT     | NOT NULL, UNIQUE                  |
| password_hash | TEXT     | NOT NULL                          |
| email         | TEXT     |                                   |
| created_at    | DATETIME | DEFAULT CURRENT_TIMESTAMP         |

### Cards
| Column           | Type    | Constraints                                 |
|------------------|---------|---------------------------------------------|
| id               | INTEGER | PRIMARY KEY, AUTOINCREMENT                  |
| name             | TEXT    | NOT NULL                                    |
| image_filename   | TEXT    | NOT NULL                                    |
| misfortune_index | REAL    | NOT NULL, UNIQUE, CHECK (0.5 ≤ value ≤ 100) |

### Games
| Column      | Type     | Constraints                            |
|-------------|----------|----------------------------------------|
| id          | INTEGER  | PRIMARY KEY, AUTOINCREMENT             |
| user_id     | INTEGER  | REFERENCES Users(id) ON DELETE CASCADE |
| start_time  | DATETIME | DEFAULT CURRENT_TIMESTAMP              |
| end_time    | DATETIME |                                        |
| outcome     | TEXT     | CHECK (outcome IN ('won','lost'))      |
| final_score | INTEGER  |                                        |

### GameCards
| Column   | Type    | Constraints                                       |
|----------|---------|---------------------------------------------------|
| id       | INTEGER | PRIMARY KEY, AUTOINCREMENT                        |
| game_id  | INTEGER | NOT NULL, REFERENCES Games(id) ON DELETE CASCADE  |
| card_id  | INTEGER | NOT NULL, REFERENCES Cards(id) ON DELETE RESTRICT |

### RoundStates
| Column       | Type     | Constraints                                                                    |
|--------------|----------|--------------------------------------------------------------------------------|
| id           | INTEGER  | PRIMARY KEY, AUTOINCREMENT                                                     |
| game_id      | INTEGER  | NOT NULL, REFERENCES Games(id) ON DELETE CASCADE                               |
| round_number | INTEGER  | NOT NULL                                                                       |
| card_id      | INTEGER  | NOT NULL, REFERENCES Cards(id) ON DELETE RESTRICT                              |
| status       | TEXT     | NOT NULL, CHECK (status IN ('start_round','initial','won_round','lost_round')) |
| timestamp    | DATETIME | DEFAULT CURRENT_TIMESTAMP                                                      |


## Main React Components


## Screenshot


## User Credentials

- **admin** / **password**
- **luca** / **123456**  

