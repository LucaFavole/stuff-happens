import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, ListGroup, Badge } from 'react-bootstrap';
import { Navigate } from 'react-router-dom';
import API from "../API/API.mjs";
import "../models/models.mjs"


const fetchGameHistoryAPI = async (userId) => {
    const history = await API.getUserHistory(userId);
    return history || [];
};


function PersonalPage({ user }) {
    const [currentUser, setCurrentUser] = useState(user);
    const [gameHistory, setGameHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [errorHistory, setErrorHistory] = useState(null);
    const [redirectToGame, setRedirectToGame] = useState(null);

    useEffect(() => {
        setCurrentUser(user);
    }, [user]);

    useEffect(() => {
        if (currentUser && currentUser.id) {
            setIsLoadingHistory(true);
            setErrorHistory(null);
            setGameHistory([]);

            fetchGameHistoryAPI(currentUser.id)
                .then(profileData => {
                    setGameHistory(profileData?.gameHistory || []);
                    setIsLoadingHistory(false);
                })
                .catch(err => {
                    console.error("Error fetching game history:", err);
                    setErrorHistory(err.message || 'Failed to load game history.');
                    setGameHistory([]);
                    setIsLoadingHistory(false);
                });
        } else {
            setGameHistory([]);
            setIsLoadingHistory(false);
            setErrorHistory(null);
        }
    }, [currentUser]);

    const handleStartGame = async () => {
        if (currentUser) {
            try {
                const { gameId } = await API.createNewGame();
                setRedirectToGame(`/Game/${gameId}`);
            } catch (err) {
                setErrorHistory('Failed to start new game: '+ err);
            }
        }
    };

    if (redirectToGame) {
        return <Navigate to={redirectToGame} replace />;
    }

    if (!currentUser || !currentUser.id) {
        return (
            <Container className="mt-5">
                <Row className="justify-content-center">
                    <Col md={8} className="text-center">
                        <h2>Personal Page</h2>
                        <p>User data not available. Please log in to see your history.</p>
                    </Col>
                </Row>
            </Container>
        );
    }
    return (
        <Container fluid className="mt-4 p-4 bg-light rounded shadow-sm">
            <Row className="mb-4 align-items-center">
                <Col md={8}>
                    <h2 className="display-5">Welcome back, {currentUser.name}!</h2>
                    <p className="lead text-muted">Ready for a new challenge or to relive your past glories?</p>
                </Col>
                <Col md={4} className="text-md-end text-center mt-3 mt-md-0">
                    <Button variant="primary" size="lg" onClick={handleStartGame} className="shadow">
                        <i className="bi bi-play-circle-fill me-2"></i>
                        Start New Game
                    </Button>
                </Col>
            </Row>

            <hr className="my-4"/>

            <Row>
                <Col>
                    <h3 className="mb-3 text-secondary">
                        <i className="bi bi-clock-history me-2"></i>
                        Game History
                    </h3>
                    {isLoadingHistory ? (
                        <p>Loading game history...</p>
                    ) : errorHistory ? (
                        <p className="text-danger">{errorHistory}</p>
                    ) : gameHistory.length === 0 ? (
                        <p>You haven't played any games yet. Click "Start New Game" to begin!</p>
                    ) : (
                        <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '15px' }}>

                            {gameHistory.map((partita) => (
                                <Card key={partita.id} className="mb-3 shadow-sm hover-shadow">
                                    <Card.Header as="h5" className={`bg-${partita.outcome === 'Won' ? 'success' : 'danger'} text-white`}>
                                        Game {partita.outcome}
                                        <span className="float-end small">{new Date(partita.date).toLocaleTimeString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit',hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                                    </Card.Header>
                                    <Card.Body>
                                        <Card.Subtitle className="mb-2 text-muted">
                                            Cards Collected: <Badge pill bg="info">{partita.totalCardsCollected}</Badge>
                                        </Card.Subtitle>

                                        <h6 className="mt-3">Situation Details:</h6>
                                        {partita.cardsPlayed && partita.cardsPlayed.length > 0 ? (
                                            <ListGroup variant="flush">
                                                {partita.cardsPlayed.map((card, index) => (
                                                    <ListGroup.Item key={`${partita.id}-card-${index}`} className="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <strong>{card.round === 0 ? "Initial" : `Round ${card.round}`}:</strong> {card.situation}
                                                        </div>
                                                        <Badge bg={card.won ? 'success-subtle' : 'danger-subtle'} text={card.won ? 'success' : 'danger'} pill>
                                                            {card.won ? 'Obtained' : 'Lost/Not Obtained'}
                                                        </Badge>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>
                                        ) : (
                                            <p className="text-muted small">No card details available for this game.</p>
                                        )}
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default PersonalPage;
