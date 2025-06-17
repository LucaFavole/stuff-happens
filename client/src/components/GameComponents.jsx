import React from 'react';
import { Card, Button } from 'react-bootstrap';

const CARD_WIDTH = '10rem';
const CARD_HEIGHT = '16rem';
const IMG_HEIGHT = '100px';
const IMG_WIDTH = '160px';
const SLOT_WIDTH = '3rem';

// Owned card: name wraps across lines, full width
export const OwnedCardDisplay = ({ card, isHighlighted }) => (
    <Card
        style={{
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
            margin: '0.5rem',
            display: 'flex',
            border: isHighlighted ? '3px solid green' : '2px solid black',
            boxShadow: isHighlighted ? '0 0 10px 2px green' : '0 2px 6px rgba(0,0,0,0.1)',
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'center'}}>
        <Card.Img
            variant="top-center"
            src={`http://localhost:3001${card.image_filename}`}
            alt={card.name}
            style={{
                height: IMG_HEIGHT,
                width: IMG_WIDTH,
            }}
        />
        </div>
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
        <div>
        <h2
            style={{
                backgroundColor: 'transparent',
                borderBottom: 'none',
                textAlign: 'center',
                fontWeight: '600',
                padding: '0.5rem',
                fontSize: '1.25rem', // dimensione testo
                marginBottom: '0.5rem' // spazio sotto la scritta
            }}
        >
            Place This Card
        </h2>
        <Card
            style={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                margin: '0.5rem auto',
                border: '2px solid #0d6efd',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'center'}}>
            <Card.Img
                variant="top"
                src={`http://localhost:3001${cardPublicDetails.image_filename}`}
                alt={cardPublicDetails.name}
                style={{
                    height: IMG_HEIGHT,
                    width: IMG_WIDTH,
                }}
            />
            </div>
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
        </div>
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
