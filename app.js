/*
 * Name: Ryan Zhao
 * Date: May 26, 2021
 * Section: CSE 154 AG; Shawn Cho
 *
 * This is the JS to implement the client side Javascript for homework 4
 * Yipper assignment. I will work with regular expression and reading/ writing
 * database.
 *
 * Yipper API Documentation
 * the Yipper API provides information about all the posts in the database.
 *
 * ## Get all yip data or yip data matching a given search term
 * Request Format: /yipper/yips
 * Query Parameters: search (optional)
 * Request Type (both requests): GET
 * Returned Data Format: JSON
 * Description 1: If the search parameter is not included in the request, your service should get
 *  the id, name, yip, hashtag, likes and date from the yips table and outputs JSON containing the
 *  information in the order of dates in descending order.
 * Example Request 1: /yipper/yips
 * Example Output 1:
 * {
 *   "yips":[
 *     {
 *       "id": 25,
 *       "name": "Mister Fluffers",
 *       "yip": "It is sooooo fluffy I am gonna die",
 *       "hashtag": "fluff",
 *       "likes": 6,
 *       "date": "2020-07-07 03:48:28"
 *     },
 *     {
 *       "id": 24,
 *       "name": "Sir Barks a Lot",
 *       "yip": "Imagine if my name was sir barks a lot and I was meowing all day haha",
 *       "hashtag": "clown",
 *       "likes": 6,
 *       "date": "2020-07-06 00:55:08"
 *     },
 *    ...
 *   ]
 * }
 *
 * **Error Handling:**
 * - Possible 500 (SERVER_ERROR) errors (all plain text):
 *   - Response: "An error occurred on the server. Try again later.""
 *
 * ## Get yip data for a designated user
 * Request Format: /yipper/user/:user
 * Query Parameters: none.
 * Request Type: GET
 * Returned Data Format: JSON
 * Description: Should get the name, yip, hashtag and date for all the yips for a
 *   designated user ordered by the date in descending order. User passed in request.
 * Example Request: /yipper/user/Chewbarka
 * Example Output:
 * [
 *   {
 *     "name": "Chewbarka",
 *     "yip": "chewy or soft cookies. I chew them all",
 *     "hashtag": "largebrain",
 *     "date": "2020-07-09 22:26:38",
 *   },
 *   {
 *     "name": "Chewbarka",
 *     "yip": "Every snack you make every meal you bake every bite you take...
 *             I will be watching you.",
 *     "hashtag": "foodie",
 *     "date": "2019-06-28 23:22:21"
 *   }
 * ]
 *
 * Description 2: If the search parameter is included in the request, your service should respond
 *   with all the ids of the yips matching the term passed in the search query parameter.
 * Example Request 2: /yipper/yips?search=if
 * Example Output 2:
 * {
 *   "yips" : [
 *     {
 *       "id": 8
 *     },
 *     {
 *       "id": 24
 *     }
 *   ]
 * }
 *
 * **Error Handling:**
 * - Possible 400 (INVALID_PARAM_ERROR) errors (all plain text):
 *   - If request is invalid user: "Yikes. User does not exist."
 * - Possible 500 (SERVER_ERROR) errors (all plain text):
 *   - Response: "An error occurred on the server. Try again later.""
 *
 * ## Update the likes for a designated yip
 * Request Format: /yipper/likes
 * Body Parameters: id
 * Request Type: POST
 * Returned Data Format: plain text
 * Description: Your service should update the likes for a yip by incrementing the current value
 *  by 1 and responding with the new value.
 * Example Request: /yipper/likes
 * Example Output:
 * 8
 *
 * **Error Handling:**
 * - Possible 400 (INVALID_PARAM_ERROR) errors (all plain text):
 *   - If request is invalid id: "Yikes. ID does not exist."
 * - Possible 500 (SERVER_ERROR) errors (all plain text):
 *   - Response: "An error occurred on the server. Try again later.""
 *
 * ## Add a new yip
 * Request Format: /yipper/new
 * Body Parameters: name and full
 * Request Type: POST
 * Returned Data Format: JSON
 * Description: Adds new Yip information to the database and send back and
 *   output the JSON with the id, name, yip, hashtag, likes and date.
 * Example Request: /yipper/new
 * Example Output:
 * {
 *   "id": 528,
 *   "name": "Chewbarka",
 *   "yip": "love to yip allllll day long",
 *   "hashtag": "coolkids",
 *   "likes": 0,
 *   "date": "2020-09-09 18:16:18"
 * }
 *
 * **Error Handling:**
 * - Possible 400 (INVALID_PARAM_ERROR) errors (all plain text):
 *   - If POST request missing parameter: "Missing one or more of the required params."
 *   - If POST user doesn't exist: "Yikes. User does not exist."
 *   - IF POST full parameter is incorrect: "Yikes. Yip format is invalid."
 * - Possible 500 (SERVER_ERROR) errors (all plain text):
 *   - Response: "An error occurred on the server. Try again later.""
 */
"use strict";

const express = require('express');
const app = express();

const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const multer = require('multer');

const INVALID_PARAM_ERROR = 400;
const SERVER_ERROR = 500;
const SERVER_ERROR_MSG = "An error occurred on the server. Try again later.";
const PARAM_ERROR = "Missing one or more of the required params.";

const regex = /^(\w|\s|\.|!|\?)+( #){1}(\w)+$/;
const yipRegex = /^(\w|\s|\.|!|\?)+/;
const hashtagRegex = /(#){1}(\w)+$/;
const PORT_NUM = 8000;

/** All three important middleware to handle different POST requests*/
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());

/**
 * Thus endpoint returns all the posts and if the search query parameter is there,
 * it will return all posts that meet the search parameter.
 */
app.get('/yipper/yips', async function(req, res) {
  try {
    let db = await getDBConnection();
    let search = req.query.search;
    if (!search) {
      let yipData = await db.all('SELECT * FROM yips ORDER BY DATETIME(date) DESC;');
      await db.close();
      res.json({"yips": yipData});
    } else {
      let idData = await db.all('SELECT id FROM yips WHERE yip LIKE (?);', ['%' + search + '%']);
      await db.close();
      res.json({"yips": idData});
    }
  } catch (err) {
    res.type("text");
    res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
  }
});

/**
 * This endpoint gets the name, yip, hashtag, and date for the yips based on the
 * user that is passed through as a parameter. Returns all posts of user and error
 * if user doesn't exist.
 */
app.get('/yipper/user/:user', async function(req, res) {
  try {
    let db = await getDBConnection();
    let user = req.params['user'];
    let yipData = await db.all(
      'SELECT name, yip, hashtag, date FROM yips ' +
      'WHERE name LIKE (?) ORDER BY DATETIME(date) DESC;',
      user
    );
    await db.close();
    if (yipData.length === 0) {
      res.type("text");
      res.status(INVALID_PARAM_ERROR).send("Yikes. User does not exist.");
    } else {
      res.json(yipData);
    }
  } catch (err) {
    res.type("text");
    res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
  }
});

/** The endpoint update the likes for the yip and returns the new value.*/
app.post('/yipper/likes', async function(req, res) {
  try {
    res.type('text');
    let id = req.body.id;
    if (!id) {
      res.status(INVALID_PARAM_ERROR).send(PARAM_ERROR);
    } else {
      let db = await getDBConnection();
      await db.run('UPDATE yips SET likes = likes + 1 WHERE id LIKE (?);', [id]);
      let yipData = await db.all('SELECT likes FROM yips WHERE id LIKE (?);', [id]);
      await db.close();
      if (yipData.length === 0) {
        res.status(INVALID_PARAM_ERROR).send("Yikes. ID does not exist.");
      } else {
        let likeNum = yipData[0].likes.toString();
        res.send(likeNum);
      }
    }
  } catch (err) {
    res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
  }
});

/**
 * This endpoint checks and updates the database with a new post with
 * the information based on the name and full.
 */
app.post('/yipper/new', async function(req, res) {
  try {
    let name = req.body.name;
    let full = req.body.full;
    let fullMatch = full.match(regex);
    let yip = full.match(yipRegex)[0].trimEnd();
    let hashtag = full.match(hashtagRegex)[0].slice(1);
    if (!name || !full) {
      res.status(INVALID_PARAM_ERROR).send(PARAM_ERROR);
    } else {
      let db = await getDBConnection();
      let nameCheck = await db.all('SELECT * FROM yips WHERE name = (?);', [name]);
      let sql = 'INSERT INTO yips (name, yip, hashtag, likes) VALUES (?, ?, ?, ?)';
      let newDb = await db.run(sql, [name, yip, hashtag, 0]);
      let id = newDb.lastID;
      let newYip = await db.all('SELECT * FROM yips WHERE id = (?);', [id]);
      await db.close();
      if (fullMatch.length === 0) {
        res.status(INVALID_PARAM_ERROR).send("Yikes. Yip format is invalid.");
      } else if (nameCheck.length === 0) {
        res.status(INVALID_PARAM_ERROR).send("Yikes. User does not exist.");
      } else {
        res.json(newYip[0]);
      }
    }
  } catch (err) {
    res.status(SERVER_ERROR).send(SERVER_ERROR_MSG);
  }
});

/**
 * Establishes a database connection to a database and returns the database object.
 * Any errors that occur during connection should be caught in the function
 * that calls this one.
 * @returns {Object} - The database object for the connection.
 */
async function getDBConnection() {
  const db = await sqlite.open({
    filename: "yipper.db",
    driver: sqlite3.Database
  });
  return db;
}

app.use(express.static('public'));
const PORT = process.env.PORT || PORT_NUM;
app.listen(PORT);