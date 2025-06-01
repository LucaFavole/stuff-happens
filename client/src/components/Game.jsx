import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Card, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../API/API.mjs';

const OwnedCardDisplay = ({ card }) => (
    <Card style={{ width: '10rem', margin: '5px', textAlign: 'center', border: '2px solid #ccc' }}>
        <Card.Img variant="top" src={card.imageFilename}  /*alt={"immagine"}*/ style={{ height: '80px', objectFit: 'cover' }}/>
        <Card.Body style={{ padding: '0.5rem' }}>
            <Card.Text style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{card.name}</Card.Text>
            <Card.Text style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>MI: {card.misfortuneIndex}</Card.Text>
        </Card.Body>
    </Card>
);

const CardToPlaceDisplay = ({ cardPublicDetails }) => {
    if (!cardPublicDetails) return null;
    return (
        <Card style={{ width: '12rem', margin: '10px auto', textAlign: 'center', border: '2px solid blue' }}>
            <Card.Header as="h5">Place This Card:</Card.Header>
            <Card.Img variant="top" src={cardPublicDetails.imageFilename} /*alt={"immagine"}*/ style={{ height: '100px', objectFit: 'cover' }}/>
            <Card.Body>
                <Card.Title>{cardPublicDetails.name}</Card.Title>
            </Card.Body>
        </Card>
    );
};

const PlacementSlot = ({ onPlace, disabled }) => (
    <Button
        variant="outline-success"
        onClick={onPlace}
        style={{ margin: '5px 10px', minHeight: '150px', width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        disabled={disabled}
        title="Place card here"
    >
        ⇩
    </Button>
);

function Game({ user, isDemoMode = false }) {
    const navigate = useNavigate();

/*prova*/ const [initialCardObjects, setInitialCardObjects] = useState([]);
/*prova*/    const [playedRoundsLog, setPlayedRoundsLog] = useState([]);
/*prova*/    const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
    const [gameState, setGameState] = useState('LOADING_INITIAL');
    const [ownedCards, setOwnedCards] = useState([]);
    const [currentChallengeCardDetails, setCurrentChallengeCardDetails] = useState(null);
    const [mistakesMade, setMistakesMade] = useState(0);
    const [lostCardIdsThisGame, setLostCardIdsThisGame] = useState([]);
    const [roundMessage, setRoundMessage] = useState('');
    const [gameOutcome, setGameOutcome] = useState(null);
    const [timer, setTimer] = useState(30);
    const [timerActive, setTimerActive] = useState(false);
    const [showRoundResultBriefly, setShowRoundResultBriefly] = useState(false);

    const MAX_CARDS_TO_WIN = isDemoMode ? 4 : 6;
    const MAX_MISTAKES = isDemoMode ? 1 : 3;

    useEffect(() => {
        let intervalId;
        if (timerActive && timer > 0 && gameState === 'PLAYING_ROUND') {
            intervalId = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);
        } else if (timerActive && timer === 0 && gameState === 'PLAYING_ROUND') {
            setTimerActive(false);
            handlePlacementTimeout();
        }
        return () => clearInterval(intervalId);
    }, [timerActive, timer, gameState]);

    const initializeGame = useCallback(async () => {
        setGameState('LOADING_INITIAL');
        setMistakesMade(0);
        setOwnedCards([]);
        setCurrentChallengeCardDetails(null);
        setLostCardIdsThisGame([]);
        setRoundMessage('');
        setGameOutcome(null);
        setShowRoundResultBriefly(false);
        /*prova*/ setInitialCardObjects([]);
        /*prova*/ setPlayedRoundsLog([]);
        /*prova*/ setCurrentRoundNumber(1);
        try {
            const initialCards = await API.getInitialCards();
            setOwnedCards(initialCards.sort((a, b) => a.misfortuneIndex - b.misfortuneIndex));
            /*prova*/ setInitialCardObjects(initialCards);
            startNewRoundFlow(initialCards.map(c => c.id), []);
        } catch (error) {
            console.error("Error initializing game:", error);
            setRoundMessage(`Error starting game: ${error.message}`);
            setGameState('GAME_OVER');
        }
    }, [isDemoMode]);

    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    const startNewRoundFlow = async (currentOwnedCardIds, currentLostCardIds) => {
        if (gameOutcome) return;
        setCurrentChallengeCardDetails(null);
        setGameState('LOADING_NEXT_CHALLENGE_CARD');
        setRoundMessage('');
        try {
            const excludedIds = [...currentOwnedCardIds, ...currentLostCardIds];
            const newChallengePublicDetails = await API.getNewRoundCard(excludedIds);
            if (newChallengePublicDetails && newChallengePublicDetails.id) {
                setCurrentChallengeCardDetails(newChallengePublicDetails);
                setGameState('PLAYING_ROUND');
                setTimer(30);
                setTimerActive(true);
            } /*else {
                setRoundMessage("No more cards available to draw. Game might be won or no cards left.");
                setGameState('GAME_OVER');
                if (user && !isDemoMode) {
                    const potentialOutcome = ownedCards.length >= MAX_CARDS_TO_WIN ? 'won' : 'in_progress_no_cards';
                        saveGame(potentialOutcome, ownedCards.length, ownedCards, lostCardIdsThisGame);
                }
            }*/
        } catch (error) {
            console.error("Error fetching new challenge card:", error);
            setRoundMessage(`Error fetching next card: ${error.message}`);
            setGameState('GAME_OVER');
        }
    };

    const handleCardPlacement = async (slotIndex) => {
        if (!currentChallengeCardDetails || !timerActive || gameState !== 'PLAYING_ROUND') return;
        setTimerActive(false);
        setGameState('AWAITING_PLACEMENT_VALIDATION');

        const lowerBoundOwnedCardMI = (slotIndex === 0 || ownedCards.length === 0) ? null : ownedCards[slotIndex - 1].misfortuneIndex;
        const upperBoundOwnedCardMI = (slotIndex === ownedCards.length || ownedCards.length === 0) ? null : ownedCards[slotIndex].misfortuneIndex;

        try {
            const placementData = {
                challengeCardId: currentChallengeCardDetails.id,
                lowerBoundOwnedCardMI: lowerBoundOwnedCardMI,
                upperBoundOwnedCardMI: upperBoundOwnedCardMI,
            };
            const validationResult = await API.submitPlacement(placementData);
            handlePlacementResult(validationResult.isCorrect, false, validationResult.placedCardDetails);
        } catch (error) {
            console.error("Error submitting placement:", error);
            setRoundMessage(`Error processing placement: ${error.message}`);
            handlePlacementResult(false, false, { id: currentChallengeCardDetails.id, name: currentChallengeCardDetails.name, imageFilename: currentChallengeCardDetails.imageFilename });
        }
    };

    const handlePlacementTimeout = async () => {
        if (!currentChallengeCardDetails || gameState !== 'PLAYING_ROUND') return;
        setTimerActive(false);
        setGameState('AWAITING_PLACEMENT_VALIDATION');
        try {
            // Option 1: Client determines it's a timeout, sends a "failed" placement or specific timeout API.
            // For simplicity, we'll assume the client calls submitPlacement with data indicating a "fail by timeout" if needed,
            // or the server can infer timeout if it tracks active challenges and they expire.
            // Here, we just pass it to handlePlacementResult as timedOut=true.
            // If your API.submitPlacement needs to be informed of a timeout, call it here.
            // Example: await API.submitPlacement({ challengeCardId: currentChallengeCardDetails.id, timedOut: true });
            // The server would then respond, and its response would be used in handlePlacementResult.
            // For now, the client is determining the immediate consequence of timeout.
            handlePlacementResult(false, true, { id: currentChallengeCardDetails.id, name: currentChallengeCardDetails.name, imageFilename: currentChallengeCardDetails.imageFilename });
        } catch (error) {
            console.error("Error processing timeout:", error);
            handlePlacementResult(false, true, { id: currentChallengeCardDetails.id, name: currentChallengeCardDetails.name, imageFilename: currentChallengeCardDetails.imageFilename });
        }
    };

    const handlePlacementResult = (isCorrect, timedOut, serverProvidedCardDetails) => {
        setShowRoundResultBriefly(true);
        let newOwnedCards = [...ownedCards];
        let newMistakes = mistakesMade;
        let newLostCardIds = [...lostCardIdsThisGame];
        let currentRoundMsg = '';

        const cardNameForMsg = serverProvidedCardDetails?.name || currentChallengeCardDetails?.name || "The card";

        if (timedOut) {
            currentRoundMsg = `Time's up for "${cardNameForMsg}"!`;
            newMistakes++;
            if (currentChallengeCardDetails) newLostCardIds.push(currentChallengeCardDetails.id);
        } else if (isCorrect && serverProvidedCardDetails && serverProvidedCardDetails.misfortuneIndex !== undefined) {
            currentRoundMsg = `Correct! "${serverProvidedCardDetails.name}" (MI: ${serverProvidedCardDetails.misfortuneIndex}) added.`;
            newOwnedCards.push(serverProvidedCardDetails);
            newOwnedCards.sort((a, b) => a.misfortuneIndex - b.misfortuneIndex);
        } else {
            currentRoundMsg = `Incorrect placement for "${cardNameForMsg}".`;
            newMistakes++;
            if (currentChallengeCardDetails) newLostCardIds.push(currentChallengeCardDetails.id);
        }
        const roundDetails = {
            cardId: currentChallengeCardDetails.id,
            round: currentRoundNumber,
            status: timedOut ? 'lost_round' : (isCorrect ? 'won_round' : 'lost_round')
        };
        setRoundMessage(currentRoundMsg);
        setOwnedCards(newOwnedCards);
        setMistakesMade(newMistakes);
        setLostCardIdsThisGame(newLostCardIds);
        setCurrentChallengeCardDetails(null);

        let currentOutcomeResult = null;
        if (newOwnedCards.length >= MAX_CARDS_TO_WIN) currentOutcomeResult = 'won';
        else if (newMistakes >= MAX_MISTAKES) currentOutcomeResult = 'lost';
        else if (isDemoMode) currentOutcomeResult = isCorrect ? 'won_demo' : 'lost_demo';

        if (currentOutcomeResult) {
            setGameOutcome(currentOutcomeResult);
            setGameState('GAME_OVER');
            setRoundMessage(prev => prev + (currentOutcomeResult.includes('won') ? "\nCongratulations, you WON!" : "\nSorry, you LOST."));
            if (user && !isDemoMode && (currentOutcomeResult === 'won' || currentOutcomeResult === 'lost')) {
                API.saveGame(user.id, initialCardObjects, [...playedRoundsLog, roundDetails], currentOutcomeResult);
            }
        } else {
                startNewRoundFlow(newOwnedCards.map(c => c.id), newLostCardIds);
        }
        setPlayedRoundsLog(prev => [...prev, roundDetails]);
        setCurrentRoundNumber(prev => prev + 1);
    };


    if (['LOADING_INITIAL', 'LOADING_NEXT_CHALLENGE_CARD', 'AWAITING_PLACEMENT_VALIDATION'].includes(gameState)) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>
                <p>
                    {gameState === 'AWAITING_PLACEMENT_VALIDATION' ? 'Validating placement...' :
                        gameState === 'LOADING_INITIAL' ? 'Loading Game...' : 'Loading Next Card...'}
                </p>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-3 game-container">
            <Row>
                <Col md={8}><h4>Your Hand (Sorted by Misfortune Index):</h4></Col>
                <Col md={4} className="text-end">
                    <h5>Mistakes: {mistakesMade} / {MAX_MISTAKES}</h5>
                    <h5>Cards: {ownedCards.length} / {MAX_CARDS_TO_WIN}</h5>
                </Col>
            </Row>

            <Row className="justify-content-center align-items-center flex-nowrap" style={{ overflowX: 'auto', paddingBottom: '15px', minHeight: '200px', border: '1px solid #eee', borderRadius: '8px', background: '#f8f9fa' }}>
                <PlacementSlot onPlace={() => handleCardPlacement(0)} disabled={gameState !== 'PLAYING_ROUND' || !timerActive} />
                {ownedCards.map((card, index) => (
                    <React.Fragment key={card.id}>
                        <OwnedCardDisplay card={card} />
                        <PlacementSlot onPlace={() => handleCardPlacement(index + 1)} disabled={gameState !== 'PLAYING_ROUND' || !timerActive} />
                    </React.Fragment>
                ))}
            </Row>

            {gameState === 'PLAYING_ROUND' && currentChallengeCardDetails && (
                <Row className="mt-3 justify-content-center">
                    <Col md={6} className="text-center">
                        <CardToPlaceDisplay cardPublicDetails={currentChallengeCardDetails} />
                        <ProgressBar animated now={(timer / 30) * 100} label={`${timer}s`} variant={timer > 10 ? "success" : timer > 5 ? "warning" : "danger"} style={{height: "25px", fontSize: "1rem"}} />
                        <p className="mt-2 text-muted">Click a ⇩ slot to place the card before time runs out!</p>
                    </Col>
                </Row>
            )}

            {roundMessage && (showRoundResultBriefly || gameState === 'GAME_OVER') && (
                <Alert
                    variant={gameOutcome === 'won' || gameOutcome === 'won_demo' || (roundMessage.includes('Correct!')) ? "success" : "danger"}
                    className="mt-3 text-center"
                >
                    {roundMessage.split("\n").map((line, i) => <p key={i} className="mb-0">{line}</p>)}
                </Alert>
            )}

            {gameState === 'GAME_OVER' && (
                <div className="mt-3 text-center">
                    <Button variant="primary" onClick={initializeGame} className="me-2">Play Again</Button>
                    <Button variant="secondary" onClick={() => navigate(user ? '/personalpage' : '/')}>
                        {user ? 'Back to Profile' : 'Back to Home'}
                    </Button>
                </div>
            )}
        </Container>
    );
}

export default Game;
