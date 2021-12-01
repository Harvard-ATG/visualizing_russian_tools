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
				c.push(n+1 + n*j + k);
			}
			deck.push(c);
		}

		//  for generating  n * n cards
		for (i = 0; i < n; i++) {
			for (j = 0; j < n; j++) {
				c = [i + 1];
				for (k = 0; k < n; k++) {
					c.push((n + 1 + n * k + (i*k+j)% n));
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

	const generateImageElement = (card, parent, cardIndex, data) => {
		let imgs = "";
		for (let q = 0; q < card.length; q++) {
			let idx = card[q]
			let { id } = data[idx]
			// TODO replace id with image
			imgs += `<button class="custom-button" >
                        <img id="${idx}" value="${idx}" data-index="${cardIndex}" data-parent="${parent}" src=https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png />
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
		let deckElementP2 = "";
		let primeNum = null;
		state.p1Score = 0;
		state.p2Score = 0;
		const data = JSON.parse(document.getElementById('data').textContent);
		// static numbers to validate against data length
		// TODO make more dynamic
		const maxNumReqImages = [
			{"primeNum":1, "maxImages": 3}
			,{"primeNum":2, "maxImages": 7}
			,{"primeNum":3, "maxImages": 13}
			,{"primeNum":5, "maxImages": 31}
			,{"primeNum":7, "maxImages": 57}
		]

		// TODO make error page redirect if number images are less than maxImages
		maxNumReqImages.forEach(ele => {
			if(data.length=== ele.maxImages){
				primeNum = ele.primeNum
			}
		})
		deck = shuffle(generateDeckFromPrimeNum(primeNum));
		
		centralCard = deck[0];
		card1 = deck[1];
		card2 = deck[2];

		let imgsCentral = `
			<div class="d-flex justify-content-center" id="central-card">
				<div class="card flex-row"> ${generateImageElement(centralCard, "central", 0, data)} </div>
			</div>`;
		let imgsP1 = generateImageElement(card1, "p1", 1, data);
		let cardElement = `<div class="card flex-row"> ${imgsP1} </div>`;
		let deckElementP1 = `<div id="p1">${cardElement}</div>`;

		let imgsP2 = generateImageElement(card2, "p2", 2, data);
		deckElementP2 = `<div id="p2"><div class="card flex-row"> ${imgsP2} </div></div>`;


		$("#central-card").replaceWith(imgsCentral);
		$("#p1").replaceWith(deckElementP1);
		$("#p2").replaceWith(deckElementP2);
		$("#p1Score").replaceWith('<div id="p1Score">Player 1 Score: 0</div>')
		$("#p2Score").replaceWith('<div id="p2Score">Player 2 Score: 0</div>')


		// Event trigger for creating deck and starting game
		$(document).on("click", "button.custom-button", function (event) {
			event.preventDefault();
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

					// todo winner screen
					if (deck.length <= 1) {
						$("#13-cards").replaceWith('<button type="button" class="formbtn btn btn-primary mt-2 mb-2" id="7-cards"> New Game </button>')
						$("#central-card").replaceWith('<div id="central-card" />');
						$("#p2").hide();
						(state.p1Score > state.p2Score) ? $("#p1").replaceWith("<div id='p1'> Winner! Player 1 </div") : $("#p1").replaceWith("<div id='p1'>Winner! Player 2</div")
						return
					}
					// replace cards
					if (currSelected.parent === "p1") {
						card1 = deck[2]
						card2 = deck[0]
						centralCard = deck[1]
						let imgsCentral = `
							<div class="d-flex justify-content-center" id="central-card">
								<div class="card flex-row"> ${generateImageElement(centralCard, "central", 1, data)} </div>
							</div>`;
						let imgsP1 = generateImageElement(card1, "p1", 2, data);
						let cardElement = `<div class="card flex-row"> ${imgsP1} </div>`;
						let deckElementP1 = `<div id="p1">${cardElement}</div>`;

						let imgsP2 = generateImageElement(card2, "p2", 0, data);
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
								<div class="card flex-row"> ${generateImageElement(centralCard, "central", 1, data)} </div>
							</div>`;
						let imgsP1 = generateImageElement(card1, "p1", 0, data);
						let cardElement = `<div class="card flex-row"> ${imgsP1} </div>`;
						let deckElementP1 = `<div id="p1">${cardElement}</div>`;

						let imgsP2 = generateImageElement(card2, "p2", 2, data);
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
