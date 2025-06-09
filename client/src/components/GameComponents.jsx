import React from 'react';
import {Button, Card} from 'react-bootstrap';

// Mostra una carta posseduta dal giocatore, con tutti i dettagli (nome, immagine, indice di sfortuna)
export const OwnedCardDisplay = ({ card }) => (
    <Card style={{ height:'14rem', width: '10rem', margin: '5px', textAlign: 'center', border: '2px solid #ccc' }}>
        <Card.Img variant="top" src={"http://localhost:3001" + card.image_filename} alt="image" style={{ height: '80px', objectFit: 'cover' }} />
        <Card.Body style={{ padding: '0.5rem' }}>
            <Card.Text style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{card.name}</Card.Text>
            <Card.Text style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>MI: {card.misfortune_index}</Card.Text>
        </Card.Body>
    </Card>
);

export const CardToPlaceDisplay = ({ cardPublicDetails }) => {
    if (!cardPublicDetails) return null;
    return (
        <div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Place This Card:
            </div>
            <Card style={{ height:'14rem', width: '10rem', margin: '10px auto', textAlign: 'center', border: '2px solid blue' }}>
                <Card.Img variant="top" src={"http://localhost:3001" + cardPublicDetails.image_filename} alt="image" style={{ height: '100px', objectFit: 'cover' }} />
                <Card.Body>
                    <Card.Text style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }}>{cardPublicDetails.name}</Card.Text>
                </Card.Body>
            </Card>
        </div>

    );
};

export const PlacementSlot = ({ onPlace, disabled }) => (
    <Button
        variant="outline-success"
        onClick={onPlace}
        style={{
            margin: '5px 10px',
            minHeight: '150px',
            width: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed'
        }}
        disabled={disabled}
        title="Place card here"
    >
        ⇨
    </Button>
);