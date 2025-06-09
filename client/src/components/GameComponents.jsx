// src/components/GameComponents.jsx
import React from 'react';
import { Card, Button } from 'react-bootstrap';

const CARD_WIDTH = '10rem';
const CARD_HEIGHT = '14rem';
const IMG_HEIGHT = '100px';
const SLOT_WIDTH = '3rem';

// Owned card: name wraps across lines, full width
export const OwnedCardDisplay = ({ card }) => (
    <Card
        style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            margin: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
        }}
    >
        <Card.Img
            variant="top"
            src={`http://localhost:3001${card.image_filename}`}
            alt={card.name}
            style={{
                height: IMG_HEIGHT,
                objectFit: 'cover'
            }}
        />
        <Card.Body
            style={{
                padding: '0.5rem',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}
        >
            <div
                style={{
                    fontSize: '0.85rem',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    textAlign: 'center',
                    marginBottom: '0.5rem',
                    lineHeight: '1.2'
                }}
                title={card.name}
            >
                {card.name}
            </div>
            <div
                style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    textAlign: 'center'
                }}
            >
                MI: {card.misfortune_index}
            </div>
        </Card.Body>
    </Card>
);

// Challenge card: same wrapping behavior
export const CardToPlaceDisplay = ({ cardPublicDetails }) => {
    if (!cardPublicDetails) return null;
    return (
        <Card
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                margin: '0.5rem auto',
                border: '2px solid #0d6efd',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
        >
            <Card.Header
                style={{
                    backgroundColor: 'transparent',
                    borderBottom: 'none',
                    textAlign: 'center',
                    fontWeight: '600',
                    padding: '0.5rem'
                }}
            >
                Place This Card
            </Card.Header>
            <Card.Img
                variant="top"
                src={`http://localhost:3001${cardPublicDetails.image_filename}`}
                alt={cardPublicDetails.name}
                style={{
                    height: IMG_HEIGHT,
                    objectFit: 'cover'
                }}
            />
            <Card.Body
                style={{
                    padding: '0.5rem',
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <div
                    style={{
                        fontSize: '0.85rem',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        textAlign: 'center',
                        lineHeight: '1.2'
                    }}
                    title={cardPublicDetails.name}
                >
                    {cardPublicDetails.name}
                </div>
            </Card.Body>
        </Card>
    );
};

// Slot: same height as cards
export const PlacementSlot = ({ onPlace, disabled }) => (
    <Button
        variant="outline-success"
        onClick={onPlace}
        disabled={disabled}
        style={{
            width: SLOT_WIDTH,
            height: CARD_HEIGHT,
            margin: '0 0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            border: '2px dashed #198754',
            backgroundColor: disabled ? '#e9ecef' : 'transparent'
        }}
        title="Place card here"
    >
        ⇨
    </Button>
);
