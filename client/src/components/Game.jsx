import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../API/API.mjs';
// Display for a card the player owns
const OwnedCardDisplay = ({ card }) => (
    <Card style={{ height:'14rem', width: '10rem', margin: '5px', textAlign: 'center', border: '2px solid #ccc' }}>
        <Card.Img variant="top" src={"http://localhost:3001" + card.image_filename} alt="image" style={{ height: '80px', objectFit: 'cover' }} />
        <Card.Body style={{ padding: '0.5rem' }}>
            <Card.Text style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{card.name}</Card.Text>
            <Card.Text style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>MI: {card.misfortune_index}</Card.Text>
        </Card.Body>
    </Card>
);

const CardToPlaceDisplay = ({ cardPublicDetails }) => {
    if (!cardPublicDetails) return null;
    return (
        <div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Place This Card:
            </div>
            <Card style={{ height:'14rem', width: '10rem', margin: '10px auto', textAlign: 'center', border: '2px solid blue' }}>
                <Card.Img variant="top" src={"http://localhost:3001" + cardPublicDetails.image_filename} alt="image" style={{ height: '100px', objectFit: 'cover' }} />
                <Card.Body>
                    <Card.Text style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{cardPublicDetails.name}</Card.Text>
                </Card.Body>
            </Card>
        </div>

    );
};

const PlacementSlot = ({ onPlace, disabled }) => (
    <Button
        variant="outline-success"
        onClick={onPlace}
        style={{
            margin: '5px 10px',
            minHeight: '150px',
            width: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
        }}
        disabled={disabled}
        title="Place card here"
    >
        ⇨
    </Button>
);

function Game({ user, isDemoMode = false }) {
    const navigate = useNavigate();

    // Minimal and safe states
    const { gameId } = useParams();
    const [ownedCards, setOwnedCards] = useState(null);
    const [challengeCard, setChallengeCard] = useState(null);
    const [gameState, setGameState] = useState('LOADING');
    const [roundMessage, setRoundMessage] = useState('');
    const [outcome, setOutcome] = useState(null);
    const [gameOutcome, setGameOutcome] = useState(null);
    const [timer, setTimer] = useState(30);
    const [timerActive, setTimerActive] = useState(false);
    const [errors, setErrors] = useState(0);
    const [round, setRound] = useState(1);

    // Limits
    const MAX_CARDS_TO_WIN = isDemoMode ? 1 : 3;
    const MAX_MISTAKES = isDemoMode ? 1 : 3;
    const handleStartGame = async () => {
            try {
                const { gameId } =user?  await API.createNewGame(): await API.createNewDemoGame();
                navigate(`/Game/${gameId}`);
            } catch (err) {
                setErrors(1);
                setRoundMessage(err);
            }
    };
    // Start game
    useEffect(() => {
        let ignore = false;
        const loadGame = async () => {
            setGameState('LOADING');
            setRoundMessage('');
            if (!gameId) {
                setGameState('GAME_OVER');
                return;
            }
            try {
                const data = await API.getGameState(gameId);
                if (ignore) return;
                setOwnedCards(data.ownedCards || []);
                setGameState(data.state || 'PLAYING');
                setErrors(data.errors || 0);
                setRound((data.ownedCards?.length || 3) - 2);
            } catch (err) {
                if (ignore) return;
                setGameState('GAME_OVER');
            }
        };
        loadGame();
        return () => { ignore = true; };
    }, [gameId, isDemoMode]);

    // Load new card to place
    useEffect(() => {
        let ignore = false;
        if (gameState === 'PLAYING' && gameId) {
            setChallengeCard(null);
            setTimer(30);
            setTimerActive(false);
            API.getNextChallengeCard(gameId)
                .then(card => { if (!ignore) { setChallengeCard(card); setTimerActive(true); } })
                .catch(() => { if (!ignore) setGameState('GAME_OVER'); });
        }
        return () => { ignore = true; };
    }, [gameState, gameId]);

    // Timer round
    useEffect(() => {
        if (!timerActive || gameState !== 'PLAYING' || !challengeCard) return;
        if (timer === 0) {
            setTimerActive(false);
            handlePlacementTimeout().then();
            return;
        }
        const id = setTimeout(() => setTimer(t => t - 1), 1000);
        return () => clearTimeout(id);
    }, [timer, timerActive, gameState, challengeCard]);

    // Handle card placement
    const handleCardPlacement = async (slotIndex) => {
        if (!gameId || !challengeCard || gameState !== 'PLAYING' || !timerActive) return;
        setTimerActive(false);
        setGameState('WAITING_RESULT');
        try {
            const result = await API.submitRoundChoice(gameId, slotIndex, challengeCard.id);
            setOwnedCards(result.ownedCards.sort((a, b) => a.misfortune_index - b.misfortune_index));
            setRoundMessage(result.isCorrect
                ? `Correct! "${result.newCard.name}" (MI: ${result.newCard.misfortune_index}) added.`
                : "Wrong placement!");
            setGameOutcome(result.outcome);
            setOutcome(result.isCorrect ? 'won' : 'lost');
            setErrors(result.errors);
            setRound(prev => prev + 1);
            setGameState(result.outcome === 'active' ? 'ROUND_OVER_AWAITING_NEXT' : 'GAME_OVER');
        } catch (err) {
            setRoundMessage("Server communication error.");
            setGameState('GAME_OVER');
        }
    };

    // Handle timeout
    const handlePlacementTimeout = async () => {
        if (!gameId || !challengeCard || gameState !== 'PLAYING') return;
        setGameState('WAITING_RESULT');
        try {
            const result = await API.submitRoundChoice(gameId, null, challengeCard.id);
            setOwnedCards(result.ownedCards.sort((a, b) => a.misfortune_index - b.misfortune_index));
            setRoundMessage("Time's up!");
            setOutcome(result.isCorrect ? 'won' : 'lost');
            setOutcome(result.outcome);
            setErrors(result.errors);
            setRound(prev => prev + 1);
            setGameState(result.outcome === 'active' ? 'ROUND_OVER_AWAITING_NEXT' : 'GAME_OVER');
        } catch (err) {
            setRoundMessage("Server communication error.");
            setGameState('GAME_OVER');
        }
    };

    const handleProceedToNextRound = () => {
        if (gameState === 'ROUND_OVER_AWAITING_NEXT' && gameOutcome === 'active') {
            setRoundMessage('');
            setGameState('PLAYING');
        }
    };

    // DEMO MODE: single round game
    useEffect(() => {
        if (isDemoMode && gameState === 'ROUND_OVER_AWAITING_NEXT') {
            setGameState('GAME_OVER');
        }
    }, [isDemoMode, gameState]);

    // UI
    if (gameState === 'LOADING' || gameState === 'WAITING_RESULT') {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" role="status" />
                <p>
                    {gameState === 'WAITING_RESULT'
                        ? 'Validating placement...'
                        : 'Loading game...'}
                </p>
            </Container>
        );
    }

    if (gameState === 'GAME_OVER') {
        return (
            <Container className="text-center mt-5">
                <h2>{gameOutcome === 'won'
                    ? 'Congratulations, you won!'
                    : gameOutcome === 'lost'
                        ? 'Sorry, you lost!'
                        : 'Game over'}</h2>
                <Alert variant={outcome === 'won' ? "success" : "danger"} className="mt-3">{roundMessage}</Alert>
                <Button variant="primary" onClick={handleStartGame}>New game</Button>
                <Button variant="secondary" className="ms-2" onClick={() => navigate(user ? '/personalpage' : '/')}>
                    {user ? 'Profile' : 'Home'}
                </Button>
                <h4 className="mt-4">Cards won:</h4>
                <Row className="justify-content-center">
                    {ownedCards.map(card => (
                        <OwnedCardDisplay card={card} key={card.id} />
                    ))}
                </Row>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-3 game-container">
            <Row>
                <Col md={8}>
                    <h4>Your cards (sorted by misfortune index):</h4>
                </Col>
                <Col md={4} className="text-end">
                    <div>
                        <strong>Round:</strong> {round}
                        {' | '}
                        <strong>Mistakes:</strong> {errors}/{MAX_MISTAKES}
                        {' | '}
                        <strong>Cards won:</strong> {ownedCards ? ownedCards.length-3 : 0}/{MAX_CARDS_TO_WIN}
                    </div>
                </Col>
            </Row>
            <Row className="justify-content-center align-items-center flex-nowrap" style={{ overflowX: 'auto', paddingBottom: '15px', minHeight: '200px', border: '1px solid #eee', borderRadius: '8px', background: '#f8f9fa' }}>
                <PlacementSlot onPlace={() => handleCardPlacement(0)} disabled={gameState !== 'PLAYING' || !timerActive} />
                {ownedCards && ownedCards.map((card, index) => (
                    <React.Fragment key={card.id}>
                        <OwnedCardDisplay card={card} />
                        <PlacementSlot onPlace={() => handleCardPlacement(index + 1)} disabled={gameState !== 'PLAYING' || !timerActive} />
                    </React.Fragment>
                ))}
            </Row>
            {gameState === 'PLAYING' && challengeCard && (
                <Row className="mt-3 justify-content-center">
                    <Col md={6} className="text-center">
                        <CardToPlaceDisplay cardPublicDetails={challengeCard} />
                        <ProgressBar animated now={(timer / 30) * 100} label={`${timer}s`} variant={timer > 10 ? "success" : timer > 5 ? "warning" : "danger"} style={{ height: "25px", fontSize: "1rem" }} />
                        <p className="mt-2 text-muted">Click on ⇩ to place the card before time runs out!</p>
                    </Col>
                </Row>
            )}
            {roundMessage && (gameState === 'ROUND_OVER_AWAITING_NEXT' || gameState === 'GAME_OVER') && (
                <Alert
                    variant={outcome === 'won' ? "success" : outcome === 'lost' ? "danger" : "info"}
                    className="mt-3 text-center"
                >
                    {roundMessage}
                </Alert>
            )}
            {gameState === 'ROUND_OVER_AWAITING_NEXT' && gameOutcome === 'active' && (
                <div className="mt-3 text-center">
                    <Button variant="info" size="lg" onClick={handleProceedToNextRound}>
                        Next round
                    </Button>
                </div>
            )}
        </Container>
    );
}

export default Game;
