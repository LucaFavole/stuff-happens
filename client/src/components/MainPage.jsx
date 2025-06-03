import React from 'react';
import { Button, Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from "../API/API.mjs";

function MainPage() {
    const navigate = useNavigate();

    const handleStartDemo = async () => {

            // Chiamata API per creare una nuova demo (deve restituire un gameId o dati demo)
            const { gameId, demoData } = await API.createNewDemoGame();

            // Salva i dati demo in localStorage (se vuoi tenerli anche localmente)
            localStorage.setItem('demoGame', JSON.stringify(demoData));

            // Redirect alla pagina del gioco demo
            navigate(`/game/${gameId}?demo=1`);

    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="p-4 shadow-sm">
                        <Card.Body>
                            <Card.Title as="h1" className="mb-4 text-center">Stuff Happens - Misfortune Game</Card.Title>
                            <Card.Text as="div">
                                <h5>Game Rules</h5>
                                <ul>
                                    <li>
                                        The game starts with <b>3 random cards</b>, each representing a horrible situation with a unique misfortune index (from 1 to 100).
                                    </li>
                                    <li>
                                        In each round, you are shown a new situation (card) with its name and image, but <b>not its misfortune index</b>.
                                    </li>
                                    <li>
                                        You must guess where this new card fits among your current cards, ordered by misfortune index.
                                    </li>
                                    <li>
                                        If you guess correctly within <b>30 seconds</b>, you win the card and its index is revealed.
                                    </li>
                                    <li>
                                        If you guess wrong or time runs out, you do <b>not</b> win the card and its index remains hidden. That card will not appear again in this game.
                                    </li>
                                    <li>
                                        The game ends when you collect <b>6 cards</b> (you win) or make <b>3 mistakes</b> (you lose).
                                    </li>
                                    <li>
                                        Registered users can play full games and see their game history. Visitors can play a <b>demo game</b> (one round only).
                                    </li>
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
