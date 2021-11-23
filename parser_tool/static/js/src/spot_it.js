(function ($) {
	/**
	 * Theorem that given a prime number you could generate N * N + N + 1 cards with N + 1 symbols
	 * whose relationship between each card has a maximum of one related symbol
	 * Note: reason we use prime numbers is due to the theorem which uses a diagonalization method for generating the 1 to 1 relationship between the cards
	 * Ref: https://math.stackexchange.com/questions/1303497/what-is-the-algorithm-to-generate-the-cards-in-the-game-dobble-known-as-spo
	 **/
	const generateDeckFromPrimeNum = (n) => {
		let i, j, k;
		let r = 1;
		let deck = [];
		let c = [];
		// for first card containing n+1 symbols
		for (i = 1; i <= n + 1; i++) {
			c.push(i);
		}
		deck.push(c);
		// for generating cards up to n
		for (j = 1; j <= n; j++) {
			r = r + 1;
			c = [1];
			for (k = 1; k <= n; k++) {
				c.push(n + n * (j - 1) + k + 1);
			}
			deck.push(c);
		}

		//  for generating  n * n cards
		for (i = 1; i <= n; i++) {
			for (j = 1; j <= n; j++) {
				r = r + 1;
				c = [i + 1];
				for (k = 1; k <= n; k++) {
					c.push(n + 2 + n * (k - 1) + (((i - 1) * (k - 1) + j - 1) % n));
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

	const generateImageElement = (card, parent, index) => {
		let imgs = "";
		for (let q = 0; q < card.length; q++) {
			imgs += `<button class="custom-button" >
                        <img id="${card[q]}" value="${card[q]}" data-index="${index}" data-parent="${parent}" src=https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${card[q]}.png />
                    </button>`;
		}
		return imgs;
	};
	$(document).ready(async function () {
		console.log("ready!");
		const state = {
			p1: "Player 1",
			p2: "Player 2",
			p1Score: 0,
			p2Score: 0,
		};
		// TODO ADD DECK AND CURRSELECTED TO STATE
		let deck = []
		let currSelected = {};
		let card1 = []
		let card2 = []
		let centralCard = []

		$(document).on('click', '#7-cards', function () {
			let deckElementP2 = "";
			deck = shuffle(generateDeckFromPrimeNum(3));
			// console.log({ deck })
			state.p1Score = 0;
			state.p2Score = 0;
			
			centralCard = deck[0];
			card1 = deck[1];
			card2 = deck[2];

			let imgsCentral = `
				<div class="d-flex justify-content-center" id="central-card">
					<div class="card flex-row"> ${generateImageElement(centralCard, "central", 0)} </div>
				</div>`;
			let imgsP1 = generateImageElement(card1, "p1", 1);
			let cardElement = `<div class="card flex-row"> ${imgsP1} </div>`;
			let deckElementP1 = `<div id="p1">${cardElement}</div>`;

			let imgsP2 = generateImageElement(card2, "p2", 2);
			deckElementP2 = `<div id="p2"><div class="card flex-row"> ${imgsP2} </div></div>`;


			$("#central-card").replaceWith(imgsCentral);
			$("#p1").replaceWith(deckElementP1);
			$("#p2").replaceWith(deckElementP2);
			$("#7-cards").hide()
			// TODO add real next card button and reset button
			// $("#7-cards").replaceWith('<button type="button" class="formbtn btn btn-primary mt-2 mb-2" id="7-cards"> Next Card </button>')

		});


		$(document).on("click", "button.custom-button", function (event) {
			const value = $(event.target).attr("value");
			const parentValue = $(event.target).attr("data-parent");
			const index = $(event.target).attr("data-index");
			// TODO COMPARISON AND UPDATE SCORE

			switch (parentValue) {
				case "p2":
					currSelected.value = value;
					currSelected.parent = "p2";
					currSelected.index = index
					break;
				case "p1":
					currSelected.value = value;
					currSelected.parent = "p1";
					currSelected.index = index
					break;
				case "central":
					currSelected.centralValue = value;
					currSelected.centralIndex = index

			}
			if (currSelected && currSelected.value && currSelected.parent) {

				if (currSelected.value === currSelected.centralValue) {
					let playerScoreId = `${currSelected.parent}Score`
					state[playerScoreId] += 1
					let playerScoreDiv = `<div id="${playerScoreId}">${state[currSelected.parent]} Score: ${state[playerScoreId]}</div>`
					$(`#${playerScoreId}`).replaceWith(playerScoreDiv);

					// Update card states
					deck.splice(currSelected.centralIndex, 1, '');
					deck.splice(currSelected.index, 1, '')
					deck = deck.filter(e => e !== '')
					console.log("correct match", { deck })
					// todo winner screen
					if (deck.length <= 1) {
						$("#7-cards").replaceWith('<button type="button" class="formbtn btn btn-primary mt-2 mb-2" id="7-cards"> New Game </button>')
						$("#central-card").replaceWith('<div id="central-card" />');
						$("#p2").hide();
						(state.p1Score > state.p2Score) ? $("#p1").replaceWith("<div> Winner! Player 1 </div") : $("#p1").replaceWith("<div>Winner! Player 2</div")
						return
					}
					// replace cards
					if (currSelected.parent === "p1") {
						card1 = deck[2]
						card2 = deck[0]
						centralCard = deck[1]
						let imgsCentral = `
							<div class="d-flex justify-content-center" id="central-card">
								<div class="card flex-row"> ${generateImageElement(centralCard, "central", 1)} </div>
							</div>`;
						let imgsP1 = generateImageElement(card1, "p1", 2);
						let cardElement = `<div class="card flex-row"> ${imgsP1} </div>`;
						let deckElementP1 = `<div id="p1">${cardElement}</div>`;

						let imgsP2 = generateImageElement(card2, "p2", 0);
						let deckElementP2 = `<div id="p2"><div class="card flex-row"> ${imgsP2} </div></div>`;
						$("#central-card").replaceWith(imgsCentral);
						$("#p1").replaceWith(deckElementP1);
						$("#p2").replaceWith(deckElementP2);
					}
					if (currSelected.parent === "p2") {

						card2 = deck[2]
						card1 = deck[0]
						centralCard = deck[1]
						let imgsCentral = `
							<div class="d-flex justify-content-center" id="central-card">
								<div class="card flex-row"> ${generateImageElement(centralCard, "central", 1)} </div>
							</div>`;
						let imgsP1 = generateImageElement(card1, "p1", 0);
						let cardElement = `<div class="card flex-row"> ${imgsP1} </div>`;
						let deckElementP1 = `<div id="p1">${cardElement}</div>`;

						let imgsP2 = generateImageElement(card2, "p2", 2);
						let deckElementP2 = `<div id="p2"><div class="card flex-row"> ${imgsP2} </div></div>`;
						$("#central-card").replaceWith(imgsCentral);
						$("#p1").replaceWith(deckElementP1);
						$("#p2").replaceWith(deckElementP2);
					}
				}
			}
		});
	});
})(jQuery);
