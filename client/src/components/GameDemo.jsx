import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import API from '../API/API.mjs';
import { OwnedCardDisplay, CardToPlaceDisplay, PlacementSlot } from './GameComponents';

function GameDemo() {
    const { gameId } = useParams();
    const navigate = useNavigate();

    const [ownedCards, setOwnedCards] = useState([]);
    const [challengeCard, setChallengeCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timer, setTimer] = useState(30);
    const [timerActive, setTimerActive] = useState(false);
    const [result, setResult] = useState(null); // { won: true/false, card: {...} }
    const [errorMsg, setErrorMsg] = useState('');
    const [showSummary, setShowSummary] = useState(false);

    // Carica carte iniziali e challenge card
    useEffect(() => {
        let ignore = false;
        setLoading(true);
        setErrorMsg('');
        Promise.all([
            API.getGameState(gameId),
            API.getDemoChallengeCard(gameId)
        ])
            .then(([gameData, challengeData]) => {
                if (!ignore) {
                    setOwnedCards(gameData.ownedCards || []);
                    setChallengeCard(challengeData.card);
                    setTimer(30);
                    setTimerActive(true);
                }
            })
            .catch(() => {
                if (!ignore) setErrorMsg('Errore nel caricamento dati demo.');
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });
        return () => { ignore = true; };
    }, [gameId]);

    // Timer countdown
    useEffect(() => {
        if (!timerActive || result) return;
        if (timer === 0) {
            setTimerActive(false);
            handlePlacement(null); // timeout: nessuna scelta
            return;
        }
        const id = setTimeout(() => setTimer(t => t - 1), 1000);
        return () => clearTimeout(id);
    }, [timer, timerActive, result]);

    // Gestione scelta posizione
    const handlePlacement = (slotIndex) => {
        setTimerActive(false);
        API.submitDemoChoice(gameId, slotIndex)
            .then((res) => {
                setResult(res); // { won: true/false, card: {...} }
            })
            .catch(() => setErrorMsg('Errore di comunicazione.'));
    };

    // Riepilogo finale
    const handleShowSummary = () => setShowSummary(true);

    // Nuova partita
    const handleNewDemo = () => navigate('/');

    if (loading) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" />
                <p>Caricamento partita demo...</p>
            </Container>
        );
    }

    if (errorMsg) {
        return (
            <Container className="text-center mt-5">
                <Alert variant="danger">{errorMsg}</Alert>
                <Button onClick={handleNewDemo}>Torna alla Home</Button>
            </Container>
        );
    }

    if (showSummary) {
        return (
            <Container className="text-center mt-5">
                <h3>Riepilogo Demo</h3>
                <p>{result && result.won ? 'Hai vinto la carta!' : 'Non hai vinto la carta.'}</p>
                <Row className="justify-content-center">
                    {result && result.won && <OwnedCardDisplay card={result.card} />}
                </Row>
                <Button className="mt-4" onClick={handleNewDemo}>Gioca una nuova demo</Button>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2 className="text-center">Partita Demo: 1 solo round</h2>
            <h5 className="text-center">Le tue carte iniziali</h5>
            <Row className="justify-content-center">
                {ownedCards.map(card => (
                    <Col key={card.id} xs="auto">
                        <OwnedCardDisplay card={card} />
                    </Col>
                ))}
            </Row>
            <hr />
            <h5 className="text-center">Dove si colloca questa situazione?</h5>
            <Row className="justify-content-center">
                <Col md={6}>
                    <CardToPlaceDisplay cardPublicDetails={challengeCard} />
                </Col>
            </Row>
            <Row className="justify-content-center align-items-center flex-nowrap" style={{ overflowX: 'auto', paddingBottom: '15px', minHeight: '200px' }}>
                {/* Slot prima della prima carta */}
                <PlacementSlot onPlace={() => handlePlacement(0)} disabled={!timerActive || !!result} />
                {ownedCards.map((card, idx) => (
                    <React.Fragment key={card.id}>
                        <OwnedCardDisplay card={card} />
                        <PlacementSlot onPlace={() => handlePlacement(idx + 1)} disabled={!timerActive || !!result} />
                    </React.Fragment>
                ))}
            </Row>
            <div className="text-center mt-3">
                <span>Tempo rimasto: <strong>{timer}s</strong></span>
            </div>
            {result && (
                <Alert variant={result.won ? "success" : "danger"} className="mt-4 text-center">
                    {result.won
                        ? "Corretto! Hai vinto la carta."
                        : "Risposta errata o tempo scaduto. Non hai vinto la carta."}
                </Alert>
            )}
            {result && (
                <div className="text-center mt-3">
                    <Button variant="info" size="lg" onClick={handleShowSummary}>
                        Mostra riepilogo
                    </Button>
                </div>
            )}
        </Container>
    );
}

export default GameDemo;
