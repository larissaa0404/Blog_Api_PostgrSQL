CREATE TABLE posts(
id SERIAL PRIMARY KEY,
title VARCHAR(50) NOT NULL,
content VARCHAR(5000) NOT NULL,
author VARCHAR(100) NOT NULL,
date VARCHAR(50) NOT NULL
);

CREATE TABLE userblog(
id SERIAL PRIMARY KEY,
name VARCHAR(50) NOT NULL,
username VARCHAR(100) NOT NULL UNIQUE,
password VARCHAR(100) NOT NULL,
);

-- see what posts are made by an author
SELECT name, title, content
FROM userblog as u
LEFT JOIN posts as p 
ON u.name = p.author;