import React, { useEffect, useState} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
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
    const { gameId } = useParams();
    const { state } = useLocation();
    const {initialCards, challengeCard} = state || {};
    const navigate = useNavigate();
    const [ownedCards, setOwnedCards] = useState(initialCards);
    const [timer, setTimer] = useState(30);
    const [timerActive, setTimerActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    useEffect(() => {
        setOwnedCards(initialCards);
        setTimer(30);
        setTimerActive(true);
    }, [gameId]);

    // Countdown
    useEffect(() => {
        if (!timerActive) return;
        let intervalId = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(intervalId); // Puliamo l'intervallo dall'interno
                    submitChoice(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timerActive]);

    const submitChoice = async (pos) => {
        setTimerActive(false);
        setLoading(true);
        try {
            const res = await API.submitRoundChoice(gameId, pos);
            setResult(res);
            setOwnedCards(res.ownedCards || []);
        } catch (e) {
            setError(e.message);
        }finally {
            setLoading(false);
        }
    };

    // Start a fresh demo
    const handleStartNewDemo = async () => {
        setError('');
        setLoading(true);
        setResult(null);
        try {
            const { gameId: newId, initialCards: newInitial } = await API.createNewDemoGame();
            const card = await API.getNextChallengeCard(newId);
            navigate(`/Game/${newId}/demo`, { state: { initialCards: newInitial, challengeCard: card } });
        } catch {
            setError('Unable to start a new demo.');
        }
        finally {
            setLoading(false);
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
                </Alert>

                <h3 className="mt-4">All Cards</h3>
                <Row className="justify-content-center mt-3">
                    {ownedCards.map((card) => (
                        <React.Fragment key={card.id}>
                            <OwnedCardDisplay card={card} isHighlighted={result.isCorrect && card.id === result.newCard.id}
                            />
                        </React.Fragment>
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
