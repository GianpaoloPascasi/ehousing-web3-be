create table users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(72) NOT NULL
);

create table nfts(
    id SERIAL PRIMARY KEY,
    metadata JSONB not null
)