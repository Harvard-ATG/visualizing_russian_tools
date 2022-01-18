(function ($) {
  /**
   * Theorem that given a prime number you could generate N * N + N + 1 cards with N + 1 symbols
   * whose relationship between each card has a maximum of one related symbol
   * Note: reason we use prime numbers is due to the theorem which uses a diagonalization method for generating the 1 to 1 relationship between the cards
   * Ref: https://math.stackexchange.com/questions/1303497/what-is-the-algorithm-to-generate-the-cards-in-the-game-dobble-known-as-spo
   **/
  const generateDeckFromPrimeNum = (n) => {
    let i, j, k;
    let deck = [];
    let c = [];
    // for first card containing n+1 symbols
    for (i = 0; i <= n; i++) {
      c.push(i);
    }
    deck.push(c);
    // for generating cards up to n
    for (j = 0; j < n; j++) {
      c = [0];
      for (k = 0; k < n; k++) {
        c.push(n + 1 + n * j + k);
      }
      deck.push(c);
    }

    //  for generating  n * n cards
    for (i = 0; i < n; i++) {
      for (j = 0; j < n; j++) {
        c = [i + 1];
        for (k = 0; k < n; k++) {
          c.push(n + 1 + n * k + ((i * k + j) % n));
        }
        deck.push(c);
      }
    }
    return deck;
  };

  const shuffle = (a) => {
    const cloneA = [...a];
    let j, x;
    for (let idx = cloneA.length - 1; idx > 0; idx--) {
      j = Math.floor(Math.random() * (idx + 1));
      // swap - could use destructure [a[idx], a[j]] = [a[j], a[idx]]
      x = cloneA[idx];
      cloneA[idx] = cloneA[j];
      cloneA[j] = x;
    }
    return cloneA;
  };

  const generateImageElement = (card, parent, cardIndex, data, pos) => {
    let imgs = "";
    for (let q = 0; q < card.length; q++) {
      let idx = card[q];
      let { id } = data[idx];
      // TODO replace id with image
      if (pos) {
        let [right, top] = pos[q];
        let size = generateRand(80, 160);
        //TODO make random size fit on card without overlapping
        imgs += `<button class="custom-button" style="position:relative; right:${right}px; top: ${top}px; transform:rotate(${generateRand(
          0,
          360
        )}deg)" >
							<img id="${idx}" style="min-width:${size}px;min-height:${size}px" value="${idx}" data-index="${cardIndex}" data-parent="${parent}" src=https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png />
						</button>`;
      } else {
        imgs += `<button class="custom-button" >
							<img id="${idx}" value="${idx}" data-index="${cardIndex}" data-parent="${parent}" src=https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png />
						</button>`;
      }
    }
    return imgs;
  };

  const generateRand = (a, b) => {
    result = Math.floor(Math.random() * (b - a)) + a;
    return result;
  };

  $(document).ready(async function () {
    console.log("ready!");
    const state = {
      p1: "Player 1",
      p2: "Player 2",
      p1Score: 0,
      p2Score: 0,
      card1: {
        value: [],
        index: [],
      },
      card2: {
        value: [],
        index: [],
      },
      centralCard: {
        value: [],
        index: [],
      },
      foundPrimeNum: {},
    };
    // TODO ADD DECK AND CURRSELECTED TO STATE
    let deck = [];
    let currSelected = {};
    let card1 = [];
    let card2 = [];
    let centralCard = [];
    let deckElementP2 = "";
    state.p1Score = 0;
    state.p2Score = 0;
    const data = JSON.parse(document.getElementById("data").textContent);
    // static numbers to validate against data length
    // image/button element position:[right,top]
    // TODO make more dynamic - using static positions for images so they do not overlap
    const maxNumReqImages = [
      { primeNum: 1, maxImages: 3 },
      { primeNum: 2, maxImages: 7 },
      {
        primeNum: 3,
        maxImages: 13,
        pos: [
          [-80, -80],
          [-110, -80],
          [110, 80],
          [80, 80],
        ],
      },
      {
        primeNum: 5,
        maxImages: 31,
        pos: [
          [-90, -65],
          [-90, -65],
          [160, 40],
          [40, 40],
          [-40, 50],
          [-90, 50],
        ],
      },
      {
        primeNum: 7,
        maxImages: 57,
        pos: [
          [-40, -40],
          [-40, -80],
          [-30, -40],
          [0, 50],
          [-35, 0],
          [-25, 50],
          [-35, 50],
          [150, -50],
        ],
      },
    ];

    // TODO make error page redirect if number images are less than maxImages
    const foundPrimeNum = maxNumReqImages.find((ele) => {
      if (data.length === ele.maxImages) {
        return ele.primeNum;
      }
    });
    state.foundPrimeNum = foundPrimeNum;
    deck = shuffle(generateDeckFromPrimeNum(foundPrimeNum.primeNum));
    centralCard = deck[0];
    card1 = deck[1];
    card2 = deck[2];

    let { card1: c1, card2: c2, centralCard: centralC } = state;
    c1.value = deck[1];
    c1.index = 1;
    c2.value = deck[2];
    c2.index = 2;
    centralC.value = deck[0];
    centralC.index = 0;

    let imgsCentral = `
			<div class="d-flex justify-content-center" id="central-card">
				<div class="circle" style="transform:rotate(${generateRand(
          0,
          0
        )}deg)"> ${generateImageElement(
      centralCard,
      "central",
      0,
      data,
      foundPrimeNum.pos
    )} </div>
			</div>`;
    let imgsP1 = generateImageElement(card1, "p1", 1, data, foundPrimeNum.pos);
    let cardElement = `<div class="circle" style="transform:rotate(${generateRand(
      0,
      360
    )}deg)"> ${imgsP1} </div>`;
    let deckElementP1 = `<div id="p1">${cardElement}</div>`;

    let imgsP2 = generateImageElement(card2, "p2", 2, data, foundPrimeNum.pos);
    deckElementP2 = `<div id="p2"><div class="circle" style="transform:rotate(${generateRand(
      0,
      360
    )}deg)"> ${imgsP2} </div></div>`;

    $("#central-card").replaceWith(imgsCentral);
    $("#p1").replaceWith(deckElementP1);
    $("#p2").replaceWith(deckElementP2);
    $("#p1Score").replaceWith('<div id="p1Score">Player 1 Score: 0</div>');
    $("#p2Score").replaceWith('<div id="p2Score">Player 2 Score: 0</div>');

    // Event trigger for creating deck and starting game
    $(document).on("click", "button.custom-button", function (event) {
      event.preventDefault();
      const value = $(event.target).attr("value");
      const parentValue = $(event.target).attr("data-parent");
      const index = $(event.target).attr("data-index");
      const idx = $(event.target).attr("id");
      // var p = $(`#${idx}`).first();
      // var position = p.position();
      // console.log({ position });
      // console.log({ idx });
      // TODO COMPARISON AND UPDATE SCORE

      switch (parentValue) {
        case "p2":
          currSelected.value = value;
          currSelected.parent = "p2";
          currSelected.index = index;
          break;
        case "p1":
          currSelected.value = value;
          currSelected.parent = "p1";
          currSelected.index = index;
          break;
        case "central":
          currSelected.centralValue = value;
          currSelected.centralIndex = index;
      }
      if (currSelected && currSelected.value && currSelected.parent) {
        if (currSelected.value === currSelected.centralValue) {
          let playerScoreId = `${currSelected.parent}Score`;
          state[playerScoreId] += 1;
          let playerScoreDiv = `<div id="${playerScoreId}">${
            state[currSelected.parent]
          } Score: ${state[playerScoreId]}</div>`;
          $(`#${playerScoreId}`).replaceWith(playerScoreDiv);

          // Update card states
          deck.splice(currSelected.centralIndex, 1, "");
          deck.splice(currSelected.index, 1, "");
          deck = deck.filter((e) => e !== "");

          // todo winner screen
          if (deck.length <= 1) {
            $("#13-cards").replaceWith(
              '<button type="button" class="formbtn btn btn-primary mt-2 mb-2" id="7-cards"> New Game </button>'
            );
            $("#central-card").replaceWith('<div id="central-card" />');
            $("#p2").hide();
            if (state.p1Score > state.p2Score) {
              $("#p1").replaceWith("<div id='p1'> Winner! Player 1 </div");
            }
            if (state.p1Score < state.p2Score) {
              $("#p1").replaceWith("<div id='p1'>Winner! Player 2</div");
            }
            if (state.p1Score === state.p2Score) {
              $("#p1").replaceWith("<div id='p1'>Tied!</div");
            }
            return;
          }
          // replace cards in center and player when corresponding images are selected
          if (currSelected.parent === "p1") {
            card1 = deck[2];
            card2 = deck[0];
            centralCard = deck[1];
            let imgsCentral = `
							<div class="d-flex justify-content-center" id="central-card">
								<div class="circle" style="transform:rotate(${generateRand(
                  0,
                  360
                )}deg)"> ${generateImageElement(
              centralCard,
              "central",
              1,
              data,
              state.foundPrimeNum.pos
            )} </div>
							</div>`;
            let imgsP1 = generateImageElement(
              card1,
              "p1",
              2,
              data,
              state.foundPrimeNum.pos
            );
            let cardElement = `<div class="circle" style="transform:rotate(${generateRand(
              0,
              360
            )}deg)"> ${imgsP1} </div>`;
            let deckElementP1 = `<div id="p1">${cardElement}</div>`;

            let imgsP2 = generateImageElement(
              card2,
              "p2",
              0,
              data,
              state.foundPrimeNum.pos
            );
            let deckElementP2 = `<div id="p2"><div class="circle"> ${imgsP2} </div></div>`;
            $("#central-card").replaceWith(imgsCentral);
            $("#p1").replaceWith(deckElementP1);
            $("#p2").replaceWith(deckElementP2);
          }
          if (currSelected.parent === "p2") {
            card2 = deck[2];
            card1 = deck[0];
            centralCard = deck[1];
            let imgsCentral = `
							<div class="d-flex justify-content-center" id="central-card">
								<div class="circle" style="transform:rotate(${generateRand(
                  0,
                  360
                )}deg)"> ${generateImageElement(
              centralCard,
              "central",
              1,
              data,
              foundPrimeNum.pos
            )} </div>
							</div>`;
            let imgsP1 = generateImageElement(
              card1,
              "p1",
              0,
              data,
              state.foundPrimeNum.pos
            );
            let cardElement = `<div class="circle" style="transform:rotate(${generateRand(
              0,
              360
            )}deg)"> ${imgsP1} </div>`;
            let deckElementP1 = `<div id="p1">${cardElement}</div>`;

            let imgsP2 = generateImageElement(
              card2,
              "p2",
              2,
              data,
              state.foundPrimeNum.pos
            );
            let deckElementP2 = `<div id="p2"><div class="circle" style="transform:rotate(${generateRand(
              0,
              360
            )}deg)"> ${imgsP2} </div></div>`;
            $("#central-card").replaceWith(imgsCentral);
            $("#p1").replaceWith(deckElementP1);
            $("#p2").replaceWith(deckElementP2);
          }
        }
      }
    });
    /*
      Handles game progression when claiming cards to Player one or Player two
    */ 
    $(document).on("click", "button.next-button", function (event) {
      event.preventDefault();
      const parentValue = $(event.target).attr("data-parent");
      // TODO COMPARISON, UPDATE SCORE, END OF GAME SCREEN, RESTART GAME
      if (parentValue === "p1") {
        if(deck.length === 3){
          window.location.href = 'spot-it-reset';
        }
        deck.splice(state.centralCard.index, 1, "");
        deck.splice(state.card1.index, 1, "");
        deck = deck.filter((e) => e !== "");
        card1 = deck[2];
        card2 = deck[0];
        centralCard = deck[1];

        c1.value = deck[2];
        c1.index = 2;
        c2.value = deck[0];
        c2.index = 0;
        centralC.value = deck[1];
        centralC.index = 1;

        let imgsCentral = `
					<div class="d-flex justify-content-center" id="central-card">
						<div class="circle" style="transform:rotate(${generateRand(
              0,
              360
            )}deg)"> ${generateImageElement(
          centralCard,
          "central",
          1,
          data,
          state.foundPrimeNum.pos
        )} </div>
					</div>`;
        let imgsP1 = generateImageElement(
          card1,
          "p1",
          2,
          data,
          state.foundPrimeNum.pos
        );
        let cardElement = `<div class="circle" style="transform:rotate(${generateRand(
          0,
          360
        )}deg)"> ${imgsP1} </div>`;
        let deckElementP1 = `<div id="p1">${cardElement}</div>`;
        let imgsP2 = generateImageElement(
          card2,
          "p2",
          0,
          data,
          state.foundPrimeNum.pos
        );
        let deckElementP2 = `<div id="p2"><div class="circle" style="transform:rotate(${generateRand(
          0,
          360
        )}deg)"> ${imgsP2} </div></div>`;
        $("#central-card").replaceWith(imgsCentral);
        $("#p1").replaceWith(deckElementP1);
        $("#p2").replaceWith(deckElementP2);
      }
      if (parentValue === "p2") {
        if(deck.length === 3){
          window.location.href = 'spot-it-reset';
        }
        deck.splice(state.centralCard.index, 1, "");
        deck.splice(state.card2.index, 1, "");
        deck = deck.filter((e) => e !== "");
        card2 = deck[2];
        card1 = deck[0];
        centralCard = deck[1];

        c1.value = deck[0];
        c1.index = 0;
        c2.value = deck[2];
        c2.index = 2;
        centralC.value = deck[1];
        centralC.index = 1;

        let imgsCentral = `
						<div class="d-flex justify-content-center" id="central-card">
							<div class="circle" style="transform:rotate(${generateRand(
                0,
                360
              )}deg)"> ${generateImageElement(
          centralCard,
          "central",
          1,
          data,
          state.foundPrimeNum.pos
        )} </div>
						</div>`;
        let imgsP1 = generateImageElement(
          card1,
          "p1",
          0,
          data,
          state.foundPrimeNum.pos
        );
        let cardElement = `<div class="circle"> ${imgsP1} </div>`;
        let deckElementP1 = `<div id="p1">${cardElement}</div>`;
        let imgsP2 = generateImageElement(
          card2,
          "p2",
          2,
          data,
          state.foundPrimeNum.pos
        );
        let deckElementP2 = `<div id="p2"><div class="circle" style="transform:rotate(${generateRand(
          0,
          360
        )}deg)"> ${imgsP2} </div></div>`;
        $("#central-card").replaceWith(imgsCentral);
        $("#p1").replaceWith(deckElementP1);
        $("#p2").replaceWith(deckElementP2);
      }
    });
  });
})(jQuery);
