// src/components/GameEndRound.jsx
import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Container, Row, Col, Alert, Button, Card } from 'react-bootstrap';
import { OwnedCardDisplay } from './GameComponents';

function GameEndRound() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { gameId, roundId } = useParams();

    const { result, errorsCount } = state || {};
    const currentRound = parseInt(roundId, 10);
    const nextRound = currentRound + 1;
    const isGameOver = result.outcome === 'won' || result.outcome === 'lost';

    const handleContinue = () => {
        if (isGameOver) {
            navigate(`/Game/${gameId}/endgame`);
        } else {
            navigate(`/Game/${gameId}/round/${nextRound}`);
        }
    };

    const headingText = result.isCorrect ? 'Well done!' : 'Oops!';
    const bodyText = result.isCorrect
        ? 'You have earned this card.'
        : 'You did not earn this card.';

    return (
        <Container className="mt-5">
            <h2 className="text-center mb-4">Round {currentRound} Result</h2>

            <Row className="align-items-center justify-content-center mb-4">
                <Col xs={12} md={6}>
                    <Alert
                        variant={result.isCorrect ? 'success' : 'danger'}
                        className="py-3"
                    >
                        <h4 className="alert-heading">{headingText}</h4>
                        <p className="mb-0">{bodyText}</p>
                    </Alert>
                </Col>
                {result.isCorrect && result.newCard && (
                    <Col xs="auto" className="text-center">
                        <Card style={{ width: '10rem' }}>
                            <OwnedCardDisplay card={result.newCard} />
                        </Card>
                    </Col>
                )}
            </Row>

            <p className="text-center text-muted mb-4">
                Errors accumulated: {errorsCount} / 3
            </p>

            <Row className="justify-content-center">
                <Col xs="auto">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleContinue}
                    >
                        {isGameOver ? 'View Final Results' : 'Next Round'}
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}

export default GameEndRound;
