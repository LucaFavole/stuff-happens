// src/components/MainPage.jsx
import React from 'react';
import { Button, Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../API/API.mjs';

function MainPage() {
    const navigate = useNavigate();

    const handleStartDemo = async () => {
        try {
            const { gameId, initialCards } = await API.createNewDemoGame();
            navigate(`/Game/${gameId}/demo`, { state: { initialCards } });
        } catch (err) {
            console.error('Failed to start demo game', err);
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="p-4 shadow-sm">
                        <Card.Body>
                            <Card.Title as="h1" className="mb-4 text-center">
                                Stuff Happens – Misfortune Game
                            </Card.Title>
                            <Card.Text as="div">
                                <h5>Game Rules</h5>
                                <ul>
                                    <li>The game starts with <strong>3 random cards</strong>, each with a unique misfortune index.</li>
                                    <li>Each round, you see a new card’s name and image, but <strong>not</strong> its index.</li>
                                    <li>Place the new card among your cards by misfortune index within <strong>30 seconds</strong>.</li>
                                    <li>If correct, you win the card; otherwise you lose it. That card won’t reappear.</li>
                                    <li>Collect <strong>6 cards</strong> to win or make <strong>3 mistakes</strong> to lose.</li>
                                    <li>Registered users play full games; visitors play a <strong>one-round demo</strong>.</li>
                                </ul>
                            </Card.Text>
                            <div className="text-center mt-4">
                                <Button variant="primary" size="lg" onClick={handleStartDemo}>
                                    Try Demo Game
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default MainPage;
