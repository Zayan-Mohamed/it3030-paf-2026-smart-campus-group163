CREATE TABLE IF NOT EXISTS amenities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS facility_amenities (
    facility_id BIGINT NOT NULL,
    amenity_id BIGINT NOT NULL,

    PRIMARY KEY (facility_id, amenity_id),

    CONSTRAINT fk_facility
        FOREIGN KEY (facility_id)
        REFERENCES facilities(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_amenity
        FOREIGN KEY (amenity_id)
        REFERENCES amenities(id)
        ON DELETE CASCADE
);

INSERT INTO amenities (name) VALUES
    ('Projector'),
    ('WiFi'),
    ('Air Conditioning'),
    ('Whiteboard'),
    ('Sound System'),
    ('Microphone'),
    ('Smart Board'),
    ('Computers'),
    ('Internet Access'),
    ('Parking'),
    ('Wheelchair Access')
ON CONFLICT (name) DO NOTHING;
