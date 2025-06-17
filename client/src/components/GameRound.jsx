import React, { useState, useEffect} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import { Container, Row, Col, Alert, Badge } from 'react-bootstrap';
import API from '../API/API';
import { OwnedCardDisplay, CardToPlaceDisplay, PlacementSlot } from './GameComponents';

function GameRound() {
    const { gameId, roundId } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const {ownedCards, challengeCard,errorsCount} = state || {};
    const [timer, setTimer] = useState(30);
    const [timerActive, setTimerActive] = useState(false);
    const [error, setError] = useState('');

    // inizializzo il timer
    useEffect(() => {
        //clearInterval(timerRef.current);
        setTimer(30);
        setTimerActive(true);
        //return () => {clearInterval(timerRef.current);};
    }, [gameId, roundId]);

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
        /*
        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    submitChoice(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);*/
        return () => clearInterval(intervalId);
    }, [timerActive]);

    // Submit choice and navigate to EndRound
    const submitChoice = async (positionIndex) => {
        //clearInterval(timerRef.current);
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
    /*
    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" /><p>Loading round...</p>
            </Container>
        );
    }*/
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
