create table categories(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

create table languages(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

create table providers(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

create table roles(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

create table users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(72) NOT NULL
);

create table files(
     id SERIAL PRIMARY KEY,
     title VARCHAR(200) NOT NULL,
     description VARCHAR(1000) NOT NULL,
     category INTEGER REFERENCES categories(id) NOT NULL,
     language INTEGER REFERENCES languages(id) NOT NULL,
     provider INTEGER REFERENCES providers(id) NOT NULL,
     file VARCHAR(2048) NOT NULL,
     mimetype VARCHAR(128) NOT NULL,
     uploaded_by INTEGER NOT NULL REFERENCES users
);

create table files_roles(
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) not null,
    file_id  INTEGER REFERENCES files(id) not null
);

insert into categories(name) values ('Conflict resolution'), ('Skills'), ('Soft skills');
insert into languages(name) values ('Italian'), ('English'), ('French');
insert into providers(name) values ('Pack'), ('HR Comp');
insert into roles(name) values ('Mentor/Coach'), ('Mentee/Coachee');

insert into users(username, password) values ('user1', '$2a$12$4Ua5WCi0K/wnQuyAsGjFNeYzaQt32JrYO4jjswA4sRPiccFd8Bk.y');

insert into files (title, description, category, language, provider, file, mimetype, uploaded_by)
            values ('How to deal with conflict in work environment', 'Solving conflicts and improve comunication', 1, 2, 1, 'https://myhost.com/myfile.pdf', 'application/pdf', 1);
            
insert into files (title, description, category, language, provider, file, mimetype, uploaded_by)
            values ('Gestire i conflitti in ambiente lavorativo', 'Risolve conflitti e migliorare la comunicazione', 1, 1, 1, 'https://myhost.com/myfile_ita.pdf', 'application/pdf', 1);

insert into files_roles(role_id, file_id) values (1,1), (1,2), (2,1), (2,2);