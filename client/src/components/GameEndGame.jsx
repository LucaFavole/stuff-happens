import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Alert, Button } from 'react-bootstrap';

function GameEndGame() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const victory = state?.victory || false;

    return (
        <Container className="text-center mt-5">
            <h2>Partita Terminata</h2>
            <Alert variant={victory ? "success" : "danger"} className="mt-4">
                {victory ? (
                    <>
                        <h4>Complimenti! Hai vinto!</h4>
                        <p>Hai raccolto 6 carte</p>
                    </>
                ) : (
                    <>
                        <h4>Partita persa</h4>
                        <p>Hai accumulato 3 errori</p>
                    </>
                )}
            </Alert>
            <Button
                variant="info"
                size="lg"
                className="mt-4"
                onClick={() => navigate('/PersonalPage')}
            >
                Torna al profilo
            </Button>
        </Container>
    );
}

export default GameEndGame;
