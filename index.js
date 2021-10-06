const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Get Books API
app.get("/books/", async (request, response) => {
  const getBooksQuery = `
  SELECT
    *
  FROM
    book
  ORDER BY
    book_id;`;
  const booksArray = await db.all(getBooksQuery);
  response.send(booksArray);
});

app.post("/users/", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 11);
  const getUsernameQuery = `
       SELECT * 
       FROM user
       WHERE username = '${username}';`;
  const getUsername = await db.get(getUsernameQuery);
  console.log(getUsername);
  if (getUsername === undefined) {
    const registerUserQuery = `
          INSERT INTO user ( name, username, password, gender, location )
          VALUES
           ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
    const registerUser = await db.run(registerUserQuery);
    const userId = registerUser.lastID;
    response.send({ userId: userId });
  } else {
    response.send("User already exists");
  }
});

app.get("/users/", async (request, response) => {
  const getUsersQuery = `
  SELECT
    *
  FROM
    user;`;
  const usersArray = await db.all(getUserQuery);
  response.send(usersArray);
});

app.post("/login", async (request, response) => {
  try {
    const { username, password } = request.body;
    const selectUserQuery = `
            SELECT * 
            FROM user
            WHERE username = '${username}';`;

    const getUser = await db.get(selectUserQuery);
    if (getUser === undefined) {
      response.send("User doesn't exists");
    } else {
      console.log(getUser.password);
      const verifyPassword = await bcrypt.compare(password, getUser.password);
      if (verifyPassword === true) {
        response.send("login successful");
      } else {
        response.send("Invalid password");
      }
    }
  } catch (e) {
    console.log(`ERROR: ${e}`);
  }
});
