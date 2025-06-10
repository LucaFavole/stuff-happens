// src/components/GameRound.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import API from '../API/API';
import { OwnedCardDisplay, CardToPlaceDisplay, PlacementSlot } from './GameComponents';

function GameRound() {
    const { gameId, roundId } = useParams();
    const navigate = useNavigate();
    const timerRef = useRef(null);

    const [ownedCards, setOwnedCards] = useState([]);
    const [challengeCard, setChallengeCard] = useState(null);
    const [errorsCount, setErrorsCount] = useState(0);
    const [timer, setTimer] = useState(30);
    const [timerActive, setTimerActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Load state and new challenge card
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            setLoading(true);
            setError('');
            clearInterval(timerRef.current);

            try {
                const stateData = await API.getGameState(gameId);
                if (cancelled) return;
                const sorted = [...stateData.ownedCards].sort(
                    (a, b) => a.misfortune_index - b.misfortune_index
                );
                setOwnedCards(sorted);
                setErrorsCount(stateData.errors);

                const challenge = await API.getNextChallengeCard(gameId);
                if (cancelled) return;
                setChallengeCard(challenge);
                setTimer(30);
                setTimerActive(true);
            } catch (e) {
                if (!cancelled) setError(e.message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        init().then();
        return () => {
            cancelled = true;
            clearInterval(timerRef.current);
        };
    }, [gameId, roundId]);

    // Countdown
    useEffect(() => {
        if (!timerActive) return;
        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    submitChoice(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [timerActive]);

    // Submit choice and navigate to EndRound
    const submitChoice = async (positionIndex) => {
        clearInterval(timerRef.current);
        setTimerActive(false);

        try {
            const res = await API.submitRoundChoice(gameId, positionIndex);
            navigate(
                `/Game/${gameId}/round/${roundId}/endround`,
                { state: { result: res, errorsCount: res.errors, ownedCards: res.ownedCards} },
            );
        } catch (e) {
            setError(e.message);
        }
    };

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" /><p>Loading round...</p>
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

    return (
        <Container className="mt-4">
            {/* Top bar: Round, Timer, Errors */}
            <Row className="align-items-center mb-4">
                <Col xs={4}>
                    <h4 className="m-0">Round {roundId}</h4>
                </Col>
                <Col xs={4} className="text-center">
                    <Badge bg="info" pill style={{ fontSize: '1rem' }}>
                        Time: {timer}s
                    </Badge>
                </Col>
                <Col xs={4} className="text-end">
                    <Badge bg="danger" pill style={{ fontSize: '1rem' }}>
                        Errors: {errorsCount} / 3
                    </Badge>
                </Col>
            </Row>

            {/* Challenge card */}
            <Row className="justify-content-center mb-4">
                <CardToPlaceDisplay cardPublicDetails={challengeCard} />
            </Row>

            {/* Placement slots + owned cards */}
            <Row
                className="justify-content-center align-items-center flex-nowrap"
                style={{ overflowX: 'auto', padding: '20px 0', minHeight: '200px' }}
            >
                <PlacementSlot onPlace={() => submitChoice(0)} disabled={!timerActive} />
                {ownedCards.map((card, idx) => (
                    <React.Fragment key={card.id}>
                        <OwnedCardDisplay card={card} />
                        <PlacementSlot onPlace={() => submitChoice(idx + 1)} disabled={!timerActive} />
                    </React.Fragment>
                ))}
            </Row>
        </Container>
    );
}

export default GameRound;
