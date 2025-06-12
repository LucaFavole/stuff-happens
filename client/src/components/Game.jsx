import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import API from '../API/API.mjs';
import { OwnedCardDisplay } from './GameComponents';

function Game({ user }) {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [ownedCards, setOwnedCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        let ignore = false;
        setLoading(true);
        setErrorMsg('');
        API.getGameState(gameId)
            .then(data => {
                if (!ignore) setOwnedCards(data.ownedCards || []);
            })
            .catch(() => {
                if (!ignore) setErrorMsg('Errore nel caricamento delle carte iniziali.');
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });
        return () => { ignore = true; };
    }, [gameId]);

    const handleStartGame = async () => {
        setLoading(true);
        setError('');
        let challengeCard;
        try {
            challengeCard = await API.getNextChallengeCard(gameId);
        } catch (e) {
           setError(e.message);
        } finally {
            setLoading(false);
        }
        navigate(`/Game/${gameId}/round/1`, {state: { ownedCards: ownedCards, challengeCard: challengeCard, errorsCount: 0} });
    };

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" />
                <p>Caricamento carte iniziali...</p>
            </Container>
        );
    }
    if (error) {
        return (
            <Container className="text-center mt-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }
    if (errorMsg) {
        return (
            <Container className="text-center mt-5">
                <Alert variant="danger">{errorMsg}</Alert>
            </Container>
        );
    }

    return (
        <Container className="text-center mt-5">
            <h2>Le tue carte iniziali</h2>
            <Row className="justify-content-center">
                {ownedCards.map(card => (
                    <Col key={card.id} xs="auto">
                        <OwnedCardDisplay card={card} />
                    </Col>
                ))}
            </Row>
            <Button
                variant="primary"
                size="lg"
                className="mt-4"
                onClick={handleStartGame}
                disabled={ownedCards.length !== 3}
            >
                Start Game
            </Button>
        </Container>
    );
}

export default Game;
