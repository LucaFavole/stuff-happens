import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';
import {
  getUser,
  getUserHistory,
  getInitialCards,
  getNewCard,
  checkPlacement,
  createGame,
  saveRoundState,
  endGame,
  getExcludedCards,
  getCurrentOwnedCards,
  getCurrentRoundNumber,
  getGameOutcome,
  getErrorCount,
  startTimer,
  endTimer, updateRoundState, getRoundState
} from './dao.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use('/images/cards', express.static(path.join(__dirname, '/images/cards')));

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));

// Passport configuration
passport.use(new LocalStrategy(async (username, password, cb) => {
  try {
    const user = await getUser(username, password);
    return user ? cb(null, user) : cb(null, false, { message: 'Invalid credentials' });
  } catch (err) {
    return cb(err);
  }
}));
passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));

// Session management
app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// Auth middleware
const isLoggedIn = (req, res, next) => req.isAuthenticated() ? next() : res.status(401).json({ error: 'Unauthorized' });

// Routes

app.post('/api/sessions', passport.authenticate('local'), (req, res) => {
  res.status(201).json(req.user);
});

app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => res.status(204).json({ message: 'Logout successful' }));
});

app.get('/api/sessions/current', (req, res) => {
  req.isAuthenticated() ? res.json(req.user) : res.status(401).json({ error: 'Unauthenticated' });
});

app.get('/api/history', isLoggedIn, async (req, res) => {
  try {
    const userId = parseInt(req.user? req.user.id: null, 10);
    if (userId == null) return res.status(403).json({ error: 'Forbidden' });
    const history = await getUserHistory(userId);
    history ? res.json(history) : res.status(404).json({ error: 'History not found' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
});

// Game management

app.post('/api/games', async (req, res) => {
  try {
    const initialCards = await getInitialCards();
    const gameId = await createGame( initialCards,req.user? req.user.id: null);
    res.status(201).json({
      gameId,
      initialCards: initialCards.map(c => ({
        id: c.id,
        name: c.name,
        image_filename: c.image_filename,
        misfortune_index: c.misfortune_index
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start new game' });
  }
});

app.post('/api/games/:gameId/round',  async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    const { positionIndex} = req.body;
    const ownedCards = await getCurrentOwnedCards(gameId);
    const roundNumber = await getCurrentRoundNumber(gameId);
    const challengeCardId = await getRoundState(gameId,roundNumber).then(state => state.card_id);
    const placementResult = await checkPlacement(challengeCardId, ownedCards, positionIndex);
    const lastCardTime = await endTimer(gameId);
    if (Date.now() - new Date(lastCardTime.replace(' ', 'T') + 'Z').getTime() > 30000) {
      placementResult.isCorrect = false;
    }
    await updateRoundState(gameId, {
      cardId: challengeCardId,
      status: placementResult.isCorrect ? 'won_round' : 'lost_round',
      round: roundNumber
    });
    const updatedOwnedCards = await getCurrentOwnedCards(gameId);
    const errors = await getErrorCount(gameId);
    const outcome = await getGameOutcome(gameId);

    if (outcome === 'won' || outcome === 'lost') {
      // Salva l'esito e il punteggio finale (numero di carte possedute)
      await endGame(gameId, outcome, updatedOwnedCards.length);
    }

    res.json({
      isCorrect: placementResult.isCorrect,
      newCard: placementResult.isCorrect ? placementResult.placedCardDetails : null,
      ownedCards: updatedOwnedCards,
      errors,
      round: roundNumber,
      outcome,
    });
  } catch (error) {
    res.status(500).json({ error: 'Round processing failed' });
  }
});

app.post('/api/games/:gameId/new-card',  async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    const excludedCards = await getExcludedCards(gameId);
    const newCard = await getNewCard(excludedCards);
    await saveRoundState(gameId, {cardId: newCard.id, status: 'start_round', round: await getCurrentRoundNumber(gameId)});
    await startTimer(gameId);
    res.json({
      id: newCard.id,
      name: newCard.name,
      image_filename: newCard.image_filename
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get new card' });
  }
});

app.get('/api/games/:gameId/state',  async (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    const ownedCards = await getCurrentOwnedCards(gameId);

    const errors = await getErrorCount(gameId);
    const round = await getCurrentRoundNumber(gameId);

    const outcome = await getGameOutcome(gameId);
    let state = "PLAYING";
    if (outcome === "won") state = "WON";
    else if (outcome === "lost") state = "LOST";
    res.json({
      ownedCards,
      state,
      errors,
      round
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load game state" });
  }
});

app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
