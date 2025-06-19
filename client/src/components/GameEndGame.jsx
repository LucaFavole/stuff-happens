import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Alert, Button, Spinner} from 'react-bootstrap';
import API from '../API/API';
import { OwnedCardDisplay } from './GameComponents';

function GameEndGame() {
    const { gameId } = useParams();
    const navigate = useNavigate();

    const [ownedCards, setOwnedCards] = useState([]);
    const [errorsCount, setErrorsCount] = useState(0);
    const [gameState, setGameState] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await API.getGameState(gameId);
                if (cancelled) return;
                setOwnedCards(data.ownedCards || []);
                setErrorsCount(data.errors);
                setGameState(data.state);
            } catch (e) {
                if (!cancelled) setError(e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [gameId]);

    const handleStartNewGame = async () => {
        try {
            const newGame = await API.createNewGame();
            navigate(`/Game/${newGame.gameId}`);
        } catch {
            setError('Failed to start a new game.');
        }
    };

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" /><p>Loading final results...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="text-center mt-5">
                <Alert variant="danger">{error}</Alert>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </Container>
        );
    }

    const victory = gameState === 'WON';

    return (
        <Container className="mt-5">
            <h2 className="text-center">Game Over</h2>

            <Alert variant={victory ? 'success' : 'danger'} className="mt-4">
                <h4 className="alert-heading">
                    {victory ? 'Congratulations! You won the game!' : 'Game Over: You lost.'}
                </h4>
                <p>
                    You collected <strong>{ownedCards.length}</strong> cards and made <strong>{errorsCount}</strong> errors.
                </p>
            </Alert>

            <h3 className="mt-5 mb-3 text-center">Your Cards</h3>
            <Row className="justify-content-center">
                {ownedCards.map(card => (
                    <Col key={card.id} xs="auto" className="mb-4">
                        <OwnedCardDisplay card={card} />
                    </Col>
                ))}
            </Row>

            <div className="d-flex justify-content-center gap-3 mt-5">
                <Button variant="primary" size="lg" onClick={handleStartNewGame}>
                    Start New Game
                </Button>
                <Button
                    variant="outline-secondary"
                    size="lg"
                    onClick={() => navigate('/PersonalPage')}
                >
                    Back to Profile
                </Button>
            </div>
        </Container>
    );
}

export default GameEndGame;
