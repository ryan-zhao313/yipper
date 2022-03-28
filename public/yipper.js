/*
 * Name: Ryan Zhao
 * Date: May 26, 2021
 * Section: CSE 154 AG; Shawn Cho
 *
 * This is the JS to implement the UI for homework 4 Yipper assignment. Its
 * main purpose is call on the client side API where I use AJAX fetch to
 * request data from Yipper API and insert it into yipper.html.
 */
"use strict";

(function() {
  const TWO_SECONDS = 2000;
  const ONE = 1;

  /** function init will be called when the window is loaded. */
  window.addEventListener("load", init);

  /**
   * This function calls on requestYip at the beggining and adds event listeners
   * to home button, search term, search button, and yip button.
   */
  function init() {
    requestYips();
    id('home-btn').addEventListener('click', homeBehavior);
    id('search-term').addEventListener('input', searchBar);
    id('search-btn').addEventListener('click', search);
    id('yip-btn').addEventListener('click', addYip);
  }

  /** This function will fetch the '/yipper/likes'*/
  function updateLike() {
    let neighborP = this.nextElementSibling;
    let cardId = this.parentNode.parentNode.parentNode.id;
    let params = new FormData();
    params.append("id", cardId);
    fetch('/yipper/likes', {method: "POST", body: params})
      .then(statusCheck)
      .then(resp => resp.text())
      .then(response => {
        neighborP.textContent = response;
      })
      .catch(yipError);
  }

  /** This function will fetch the 'yipper/user/:user*/
  function indivBehavior() {
    id('user').innerHTML = "";
    id('home').classList.add('hidden');
    id('user').classList.remove("hidden");
    id('new').classList.add("hidden");
    fetch('/yipper/user/' + this.textContent)
      .then(statusCheck)
      .then(resp => resp.json())
      .then(displayIndividual)
      .catch(yipError);
  }

  /**
   * This function will add articles from all of the returned user post JSON object.
   * @param {Object} response - array of all the user posts of one user that was searched.
   */
  function displayIndividual(response) {
    let userContainer = gen('article');
    userContainer.classList.add("single");
    let nameTitle = gen('h2');
    nameTitle.textContent = "Yips shared by " + response[ONE].name + ":";
    userContainer.appendChild(nameTitle);
    for (let i = 0; i < response.length; i++) {
      let yip = gen('p');
      yip.textContent = "Yip " + (i + ONE) + ": " + response[i].yip + " #" + response[i].hashtag;
      userContainer.appendChild(yip);
    }
    id("user").appendChild(userContainer);
  }

  /**
   * This function makes the new view visible while it hides the other ones.
   * Adds even listener to form button.
   */
  function addYip() {
    resetFilter();
    id('home').classList.add('hidden');
    id('user').classList.add("hidden");
    id('new').classList.remove("hidden");
    qs('form button').addEventListener('click', submitYip);
  }

  /** This function fetches the 'yipper/new' API.*/
  function submitYip() {
    let name = id("name").value;
    let yip = id("yip").value;
    id("name").value = "";
    id("yip").value = "";
    let params = new FormData();
    params.append("name", name);
    params.append("full", yip);
    fetch('/yipper/new', {method: "POST", body: params})
      .then(statusCheck)
      .then(resp => resp.json())
      .then(newYipCard)
      .catch(yipError);
  }

  /**
   * This function creates a new post from the user created and adds it to the
   * top after 2 seconds if successful.
   * @param {Object} response - new onject of a post
   */
  function newYipCard(response) {
    let article = yipArticle(response);
    qs("#home").prepend(article);
    setTimeout(backHome, TWO_SECONDS);
  }

  /** This function calls on the 'yipper/yips' API. */
  function requestYips() {
    fetch('/yipper/yips')
      .then(statusCheck)
      .then(resp => resp.json())
      .then(createYips)
      .catch(yipError);
  }

  /** This function hides the new view and shows the home view. */
  function backHome() {
    id('home').classList.remove("hidden");
    id('new').classList.add("hidden");
  }

  /**
   * This function creates all the cards when the page is loaded.
   * @param {Object} response - list of all posts and information
   */
  function createYips(response) {
    for (let i = 0; i < response.yips.length; i++) {
      let cardResponse = response.yips[i];
      let article = yipArticle(cardResponse);
      qs("#home").appendChild(article);
    }
  }

  /**
   * This function creates the yip card article element and everything inside.
   * @param {object} response - response from API
   * @returns {Element} - yip article element with everything inside
   */
  function yipArticle(response) {
    let article = gen('article');
    article.classList.add('card');
    article.id = response.id;
    let image = gen('img');
    image.src = "img/" + response.name.replace(/ /g, "-").toLowerCase() + ".png";
    let yipDiv = gen('div');
    let p1 = gen('p');
    let p2 = gen('p');
    p1.classList.add('individual');
    p1.addEventListener('click', indivBehavior);
    p1.textContent = response.name;
    p2.textContent = response.yip + " #" + response.hashtag;
    yipDiv.append(p1, p2);
    let dateDiv = gen('div');
    dateDiv.classList.add('meta');
    let datep = gen('p');
    datep.textContent = new Date(response.date).toLocaleString();
    let likesDiv = gen('div');
    let likeImg = gen('img');
    likeImg.src = "img/heart.png";
    likeImg.addEventListener('click', updateLike);
    let likeCount = gen('p');
    likeCount.textContent = response.likes;
    likesDiv.append(likeImg, likeCount);
    dateDiv.append(datep, likesDiv);
    article.append(image, yipDiv, dateDiv);
    return article;
  }

  /**
   * This function checks if the input value is white space or not and
   * disables the button if it is.
   */
  function searchBar() {
    if (id('search-term').value.replace(/\s+/g, '').length === 0) {
      id('search-btn').disabled = true;
    } else {
      id('search-btn').disabled = false;
    }
  }

  /**
   * This function hides the user and new view and shows the home view.
   * Fetches the '/yipper/yips?search='.
   */
  function search() {
    id('home').classList.remove("hidden");
    id('user').classList.add("hidden");
    id('new').classList.add("hidden");
    fetch('/yipper/yips?search=' + id('search-term').value.replace(/\s+/g, ''))
      .then(statusCheck)
      .then(resp => resp.json())
      .then(filterSearch)
      .catch(yipError);
  }

  /**
   * Thiss function disabled the saerch button and hides all the cards expected
   * for the ones that meet the search.
   * @param {Object} response - array of id
   */
  function filterSearch(response) {
    id('search-btn').disabled = true;
    let card = document.querySelectorAll('main article section .card');
    for (let i = 0; i < card.length; i++) {
      card[i].classList.add('hidden');
    }
    for (let i = 0; i < response.yips.length; i++) {
      let searchId = response.yips[i].id;
      id(searchId).classList.remove('hidden');
    }
  }

  /** This function clears the search term and unhides all the cards.*/
  function resetFilter() {
    id('search-term').value = "";
    let card = document.querySelectorAll('main article section .card');
    for (let i = 0; i < card.length; i++) {
      card[i].classList.remove('hidden');
    }
  }

  /**
   * Takes in error message and shows error view and disables all the buttons.
   * @param {String} response - error message from API calls.
   */
  function yipError(response) {
    id('yipper-data').classList.add("hidden");
    id('error').textContent = response;
    id('error').classList.remove("hidden");
    id('search-btn').disabled = true;
    id('home-btn').disabled = true;
    id('yip-btn').disabled = true;
  }

  /** This function hides the user and new view and shows the home view. */
  function homeBehavior() {
    id('user').classList.add("hidden");
    id('new').classList.add("hidden");
    id('home').classList.remove("hidden");
    resetFilter();
  }

  /**
   * This function's purpose is to check the status of the API
   * to see if there is a response or an error and returns the
   * param response if the response is ok.
   * @param {object} response - response from API
   * @returns {object} response - response from API
   */
  async function statusCheck(response) {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response;
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns a new element with the given tag name.
   * @param {string} tagName - HTML tag name for new DOM element.
   * @returns {object} New DOM object for given HTML tag.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }

})();