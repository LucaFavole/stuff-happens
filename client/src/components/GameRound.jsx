import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Button, Spinner, Alert } from 'react-bootstrap';
import API from '../API/API.mjs';
import { OwnedCardDisplay, CardToPlaceDisplay, PlacementSlot } from './GameComponents';

function GameRound({ user }) {
    const { gameId, roundId } = useParams();
    const navigate = useNavigate();

    const [ownedCards, setOwnedCards] = useState([]);
    const [challengeCard, setChallengeCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timer, setTimer] = useState(30);
    const [timerActive, setTimerActive] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Load round data on mount or when roundId changes
    useEffect(() => {
        setLoading(true);
        setErrorMsg('');

        const loadRoundData = async () => {
            try {
                const gameData = await API.getGameState(gameId);
                const sortedCards = [...gameData.ownedCards].sort(
                    (a, b) => a.misfortune_index - b.misfortune_index
                );
                setOwnedCards(sortedCards);

                const challenge = await API.getNextChallengeCard(gameId);
                setChallengeCard(challenge);

                setTimer(30);
                setTimerActive(true);
            } catch (err) {
                setErrorMsg(`Failed to load round data: ${err}`);
            } finally {
                setLoading(false);
            }
        };

        loadRoundData();
    }, [gameId, roundId]);

    // Countdown timer
    useEffect(() => {
        if (!timerActive || !challengeCard) return;

        const timerId = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    handlePlacement(null); // Auto-submit on timeout
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [timerActive, challengeCard]);

    // Handle placement of challenge card
    const handlePlacement = async (slotIndex) => {
        setTimerActive(false);
        try {
            const result = await API.submitRoundChoice(gameId, roundId, slotIndex);

            navigate(`/Game/${gameId}/round/${roundId}/endround`, {
                state: {
                    result,
                    newRoundId: parseInt(roundId) + 1,
                    loseCount: result.loseCount
                }
            });
        } catch (err) {
            setErrorMsg(`Server error during placement: ${err}`);
        }
    };

    // UI: loading spinner
    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" />
                <p>Loading round...</p>
            </Container>
        );
    }

    // UI: error message
    if (errorMsg) {
        return (
            <Container className="text-center mt-5">
                <Alert variant="danger">{errorMsg}</Alert>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </Container>
        );
    }

    // UI: main game round
    return (
        <Container className="mt-4">
            <h4 className="text-center">Round {roundId}</h4>

            {/* Challenge Card */}
            <Row className="justify-content-center">
                <CardToPlaceDisplay cardPublicDetails={challengeCard} />
            </Row>

            {/* Card placement slots */}
            <Row
                className="justify-content-center align-items-center flex-nowrap"
                style={{ overflowX: 'auto', padding: '20px 0', minHeight: '200px' }}
            >
                {/* Slot before first owned card */}
                <PlacementSlot onPlace={() => handlePlacement(0)} disabled={!timerActive} />

                {/* Cards + slots between them */}
                {ownedCards.map((card, index) => (
                    <React.Fragment key={card.id}>
                        <OwnedCardDisplay card={card} />
                        <PlacementSlot
                            onPlace={() => handlePlacement(index)}
                            disabled={!timerActive}
                        />
                    </React.Fragment>
                ))}
            </Row>

            {/* Countdown */}
            <div className="text-center mt-3">
                <span>Time left: <strong>{timer}s</strong></span>
            </div>
        </Container>
    );
}

export default GameRound;
