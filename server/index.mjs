//import
import express from 'express';
import morgan from 'morgan';
//import {check, validationResult} from 'express-validator';
import cors from 'cors';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';
import {getUser, getUserHistory, getInitialCards,getNewCard,checkPlacement,saveGame} from './dao.mjs';
import req from "express/lib/request.js";
import res from "express/lib/response.js";
// init express
const app = new express();
const port = 3001;

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/images/cards', express.static(path.join(__dirname, 'public/images/cards')));
// middleware
app.use(express.json());
app.use(morgan('dev'));

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessState: 200,
  credentials: true
};

app.use(cors(corsOptions));

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const user = await getUser(username, password);
  if(!user)
    return cb(null, false, 'Incorrect username or password.');

  return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

app.use(session({
  secret: "shhhhh... it's a secret!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));
/* ROUTES */

// POST /api/sessions
app.post('/api/sessions', passport.authenticate('local'), function(req, res) {
  return res.status(201).json(req.user);
});

// GET /api/sessions/current
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.json(req.user);}
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/session/current
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// GET /api/users/:id/history
app.get('/api/users/:id/history', isLoggedIn, async (req, res) => {
  const paramIdString = req.params.id;
  const requestedUserId = parseInt(paramIdString, 10);


  if (req.user.id !== requestedUserId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const history = await getUserHistory(requestedUserId);
    if (history) {
      res.json(history);
    } else {
      res.status(404).json({ error: 'History not found' });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve history." });
  }
});

// GET /api/cards/initial
app.get('/api/cards/initial', async (req, res) => {
  const sql = await getInitialCards();
  if (sql) {
    res.json(sql);
  } else {
    res.status(500).json({error: 'Failed to retrieve initial cards.'});
  }
});

// GET /api/cards/new
app.get('/api/cards/new', async (req, res) => {
  // timer sul server per la carta
  req.session.challengeStartTime = Date.now();
  //
  const sql = await getNewCard(req.query.excludedCards || []);
  if (sql) {
    res.json(sql);
  } else {
    res.status(500).json({error: 'Failed to retrieve initial cards.'});
  }

});

// GET /api/cards/check-placement
app.get('/api/cards/check-placement', async (req, res) => {
  /*
  // timer sul server per la carta
  const challengeStartTime = req.session.challengeStartTime;
  const now = Date.now();
  delete req.session.challengeStartTime;
  if (!challengeStartTime || (now - challengeStartTime) > 30000) {
    return res.json({
      isCorrect: false,
      timeOut: true,
      message: "Time's up! You did not place the card in time."
    })
  }*/
  const sql = await checkPlacement(req.query);
  if (sql) {
    res.json(sql);
  } else {
    res.status(500).json({error: 'Failed to retrieve initial cards.'});
  }

});

// POST /api/games
app.post('/api/games', isLoggedIn, async (req, res) => {
  const gameData = req.body;
    if (!gameData || !gameData.initialCardObjects || !gameData.playedRoundsLog || !gameData.userId || !gameData.outcome) {
        return res.status(400).json({ error: 'Invalid game data.' });
    }
    const sql = await saveGame(gameData);
    if (!sql) {
        return res.status(500).json({ error: 'Failed to save game.' });
    }else{
  res.status(201);}
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});