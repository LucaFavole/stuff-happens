import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Container, Alert, Button } from 'react-bootstrap';
import { OwnedCardDisplay } from './GameComponents';

function GameEndRound() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { result, newRoundId, loseCount } = state || {};
    const { gameId } = useParams();

    const handleContinue = () => {
        if (result?.gameOver) {
            navigate(`/Game/${gameId}/endgame`, {
                state: { victory: result.victory }
            });
        } else {
            navigate(`/Game/${gameId}/round/${newRoundId}`);
        }
    };

    return (
        <Container className="text-center mt-5">
            <h3>Round Result</h3>
            {result?.won ? (
                <Alert variant="success">
                    <h4>Correct!</h4>
                    <p>You won this card:</p>
                    <OwnedCardDisplay card={result.card} />
                </Alert>
            ) : (
                <Alert variant="danger">
                    <h4>Wrong answer or time out</h4>
                    <p>You did not win the card.</p>
                </Alert>
            )}
            <div className="mt-4">
                <Button variant="primary" size="lg" onClick={handleContinue}>
                    {result?.gameOver ? "See final result" : "Next round"}
                </Button>
            </div>
            <div className="mt-3 text-muted">
                Mistakes so far: {loseCount || 0}/3
            </div>
        </Container>
    );
}

export default GameEndRound;
