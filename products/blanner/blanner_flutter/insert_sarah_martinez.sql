-- Insert Sarah Martinez user into PostgreSQL
-- Assumes a 'users' table with the following structure:
-- id UUID PRIMARY KEY
-- name VARCHAR NOT NULL
-- username VARCHAR NOT NULL
-- email VARCHAR
-- phone VARCHAR
-- phone_verified BOOLEAN DEFAULT FALSE
-- bio TEXT
-- photo_url VARCHAR
-- avatar_url VARCHAR
-- gender VARCHAR (or ENUM: 'male', 'female', 'other', 'preferNotToSay')
-- birthdate DATE
-- city VARCHAR
-- interests VARCHAR
-- verified_flag BOOLEAN DEFAULT FALSE
-- created_at TIMESTAMP
-- updated_at TIMESTAMP

INSERT INTO users (
    id,
    name,
    username,
    email,
    phone,
    phone_verified,
    bio,
    photo_url,
    avatar_url,
    gender,
    birthdate,
    city,
    interests,
    verified_flag,
    created_at,
    updated_at
) VALUES (
    '660e8400-e29b-41d4-a716-446655440001'::UUID,
    'Sarah Martinez',
    '+1987654321',
    'sarah.martinez@example.com',
    '+1987654321',
    TRUE,
    'Fitness enthusiast and coffee lover. Always up for new adventures!',
    NULL,
    NULL,
    'female',
    '1992-03-22'::DATE,
    'New York',
    'Fitness, Coffee, Hiking, Photography',
    TRUE,
    '2024-02-10 09:15:00'::TIMESTAMP,
    '2024-11-20 16:45:00'::TIMESTAMP
);

