let width = 5;
let height = 4;
let numOfPlayers = 3;
let cluesCount = width * height;
let answerTimer = 8000;
let playerData = {};

class Player {
  constructor() {
    this.points = 0;
  }
  addP(val) {
    this.points += val;
  }
  removeP(val) {
    this.points -= val;
  }
}

generateTable();
generatePlayers($(".players-list.table-view"), true);
generatePlayers($(".modal-footer .players-list"), false);
createPlayerData();

/*get:
random catergories from api
 */
async function getRandCategories(num) {
  let resCount = 50;
  let catSet = new Set();
  let res = await axios.get(`http://jservice.io/api/categories`, {
    params: { count: resCount }
  });

  while (catSet.size < num) {
    let idx = Math.floor(Math.random() * resCount);
    catSet.add(res.data[idx]);
  }
  console.log([...catSet]);
  return [...catSet];
}

/*get:
   question from api using catergory id
   limit number of questions to height
 */
async function getQuestions(id, height) {
  let res = await axios.get(`http://jservice.io/api/clues`, {
    params: { category: id }
  });
  let data = res.data;
  data.length = height;
  console.log(data, id);
  return data;
}

/*generates:
    dom table from getRandCategories() and getQuestions()
    data is associated with question td
 */
async function generateTable() {
  let cat = await getRandCategories(width);
  console.log();

  let cols = await Promise.all(
    cat.map(async c => {
      let obj = { category: c.title };
      obj.questions = await getQuestions(c.id, height);
      return obj;
    })
  );

  console.log(cols);
  for (i = 0; i < height; i++) {
    let row = $("<tr>");
    $("tbody").append(row);
  }

  for (col of cols) {
    let headData = $("<td>")
      .text(col.category)
      .addClass("text-center");
    $("thead").append(headData);

    col.questions.map((quest, idx) => {
      let points = (idx + 1) * 100;
      let rowData = $("<td>")
        .data("category", col.category)
        .data("points", points)
        .data("question", quest.question)
        .data("answer", quest.answer)
        .data("active", true);
      rowData.append(`<button class="btn btn-primary">${points}</button>`);
      $(`tbody tr:nth(${idx})`).append(rowData);
    });
  }
}

/*on:
  table td click shows modal
  returns of the td is not active

  disables button from future clicks
  populates modal data
  
  on modal hide event resets modal
 */
$("tbody").on("click", "td", function() {
  if (!$(this).data("active")) return;
  $(this).data("active", false);

  $(this)
    .children("button")
    .attr("disabled", "disabled");

  const { category, points, question, answer } = $(this).data();
  $(".modal-title").text(`${category} for ${points}`);
  $(".modal-body").data("points", points);
  $(".modal-footer").data("points", points);

  $(".modal-body .question").text(question);
  let $counter = $(".modal-body .timer .counter");
  setIntervalRef = generateTimer($counter, answerTimer);
  $(".modal-body .answer .text").html(answer);
  $(".modal-body .answer").hide();

  $("#questionModal").modal("show");
  $("#questionModal").on("hidden.bs.modal", function() {
    clearInterval(setIntervalRef);
    hideAnswer();
    enablePlayersButtons();
  });

  console.log($(this).data());
  console.log(question);
});

/*generates:
  timer for modal
  shows answer when time reaches zero
 */
function generateTimer($elm, sec) {
  let time = sec;
  $elm.text(`${time / 1000} sec`);
  let counter = setInterval(count, 1000);
  return counter;

  function count() {
    if (time < 0) {
      clearInterval(counter);
      showAnswer();
    } else {
      $elm.text(`${time / 1000} sec`);
      time -= 1000;
    }
  }
}

/*on:
  show answer button, shows answer
 */
$(".modal-body button.show-ans").on("click", function() {
  showAnswer();
});

function showAnswer() {
  $(".modal-body .answer").show();
  $(".modal-body .timer").hide();
}

function hideAnswer() {
  $(".modal-body .answer").hide();
  $(".modal-body .timer").show();
}

/*generates:
    differnt dom players, depending on if table view
 */
function generatePlayers($elm, isTableView) {
  for (let i = 0; i < numOfPlayers; i++) {
    let player = $(
      `<li class ="player list-group-item" > 
        <h5>player ${i}</h5>
      </li>`
    );
    if (isTableView) {
      player.prepend($(`<div class="score">0</div> `));
    } else {
      player.append(`
      <button class="yes btn btn-light"><i class="fas fa-check"></i></button>
      <button class="no btn btn-light"><i class="fas fa-times"></i></button>`);
    }
    player.data("player", i);
    $elm.append(player);
  }
}

/*on:
  player yes/no button click update score and disable fro further clicks
 */
$(".player").on("click", "button", function() {
  let points = $(this)
    .parents(".modal-footer")
    .data("points");
  let player = $(this)
    .parents(".player")
    .data("player");

  $(this).hasClass("yes")
    ? playerData[player].addP(points)
    : playerData[player].removeP(points);
  console.log(playerData, player);
  updatePlayerScore();
  disablePlayersButtons();
});

/*generates:
    object to hold player data
 */
function createPlayerData() {
  for (let i = 0; i < numOfPlayers; i++) {
    playerData[i] = new Player();
  }
}

function updatePlayerScore() {
  let $players = $(".players-list.table-view .player");
  $players.each(function(idx) {
    $(this)
      .children(".score")
      .text(playerData[idx].points);
  });
}

function disablePlayersButtons() {
  let $btns = $(".player button");
  $btns.attr("disabled", "disabled");
}

function enablePlayersButtons() {
  let $btns = $(".player button");
  $btns.removeAttr("disabled");
}
