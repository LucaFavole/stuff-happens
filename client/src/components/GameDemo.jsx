// src/components/GameDemo.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Row,
    Col,
    Spinner,
    Alert,
    Button,
    Badge
} from 'react-bootstrap';
import API from '../API/API';
import {
    OwnedCardDisplay,
    CardToPlaceDisplay,
    PlacementSlot
} from './GameComponents';

function GameDemo() {
    const { state } = useLocation();
    const { gameId } = useParams();
    const navigate = useNavigate();
    const timerRef = useRef(null);

    // Pull initial cards from location.state (or empty)
    const initialCards = (state?.initialCards || []).slice()
        .sort((a, b) => a.misfortune_index - b.misfortune_index);

    const [ownedCards, setOwnedCards] = useState(initialCards);
    const [challengeCard, setChallengeCard] = useState(null);
    const [timer, setTimer] = useState(30);
    const [timerActive, setTimerActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    // Reset and load whenever gameId or initialCards change
    useEffect(() => {
        let cancelled = false;
        async function initDemo() {
            setLoading(true);
            setError('');
            setResult(null);
            setOwnedCards(initialCards);
            clearInterval(timerRef.current);

            try {
                // fetch the one demo challenge card
                const card = await API.getNextChallengeCard(gameId);
                if (cancelled) return;
                setChallengeCard(card);
                setTimer(30);
                setTimerActive(true);
            } catch (e) {
                if (!cancelled) setError(e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        initDemo();
        return () => {
            cancelled = true;
            clearInterval(timerRef.current);
        };
    }, [gameId, JSON.stringify(initialCards)]); // watch gameId and initialCards

    // Countdown
    useEffect(() => {
        if (!timerActive) return;
        timerRef.current = setInterval(() => {
            setTimer(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    submitChoice(null);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [timerActive]);

    // Send placement (or timeout) to server
    const submitChoice = async (pos) => {
        clearInterval(timerRef.current);
        setTimerActive(false);
        try {
            const res = await API.submitRoundChoice(gameId, pos);
            setResult(res);
            if (res.isCorrect && res.newCard) {
                setOwnedCards(prev =>
                    [...prev, res.newCard].sort((a, b) => a.misfortune_index - b.misfortune_index)
                );
            }
        } catch (e) {
            setError(e.message);
        }
    };

    // Start a fresh demo
    const handleStartNewDemo = async () => {
        try {
            const { gameId: newId, initialCards: newInitial } = await API.createNewDemoGame();
            navigate(`/Game/${newId}/demo`, { state: { initialCards: newInitial } });
        } catch {
            setError('Unable to start a new demo.');
        }
    };

    const handleBackHome = () => navigate('/');

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" /><p>Loading demo…</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="text-center mt-5">
                <Alert variant="danger">{error}</Alert>
                <Button onClick={handleBackHome}>Back to Home</Button>
            </Container>
        );
    }

    // After the one demo round
    if (result) {
        return (
            <Container className="mt-5 text-center">
                <h2>Demo Summary</h2>
                <Alert variant={result.isCorrect ? 'success' : 'danger'} className="mt-4">
                    <h4>{result.isCorrect ? 'Correct!' : 'Time Up or Incorrect'}</h4>
                    <p>
                        {result.isCorrect
                            ? 'You earned this card:'
                            : 'You did not earn the demo card.'}
                    </p>
                    {result.isCorrect && <OwnedCardDisplay card={result.newCard} />}
                </Alert>

                <h3 className="mt-4">All Cards</h3>
                <Row className="justify-content-center mt-3">
                    {ownedCards.map(c => (
                        <Col key={c.id} xs="auto" className="mb-3">
                            <OwnedCardDisplay card={c} />
                        </Col>
                    ))}
                </Row>

                <div className="d-flex justify-content-center gap-3 mt-4">
                    <Button variant="primary" size="lg" onClick={handleStartNewDemo}>
                        Start New Demo
                    </Button>
                    <Button variant="outline-secondary" size="lg" onClick={handleBackHome}>
                        Back to Home
                    </Button>
                </div>
            </Container>
        );
    }

    // Active demo round UI
    return (
        <Container className="mt-4">
            <Row className="align-items-center mb-3">
                <Col><h4>Demo Round</h4></Col>
                <Col className="text-center">
                    <Badge bg="info">Time: {timer}s</Badge>
                </Col>
            </Row>

            <Row className="justify-content-center mb-4">
                <CardToPlaceDisplay cardPublicDetails={challengeCard} />
            </Row>

            <Row
                className="justify-content-center align-items-center flex-nowrap"
                style={{ overflowX: 'auto', padding: '20px 0', minHeight: '200px' }}
            >
                <PlacementSlot onPlace={() => submitChoice(0)} disabled={!timerActive} />
                {ownedCards.map((c, i) => (
                    <React.Fragment key={c.id}>
                        <OwnedCardDisplay card={c} />
                        <PlacementSlot
                            onPlace={() => submitChoice(i + 1)}
                            disabled={!timerActive}
                        />
                    </React.Fragment>
                ))}
            </Row>
        </Container>
    );
}

export default GameDemo;
