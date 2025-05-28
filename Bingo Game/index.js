      // --- Game Variables ---
      const BINGO_RANGES = {
        'B': { min: 1, max: 15 },
        'I': { min: 16, max: 30 },
        'N': { min: 31, max: 45 },
        'G': { min: 46, max: 60 },
        'O': { min: 61, max: 75 }
    };
    const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];
    const CARD_SIZE = 5; // 5x5 grid

    let bingoCard = []; // Stores the numbers on the player's card
    let markedCells = new Set(); // Stores indices of marked cells
    let calledNumbers = new Set(); // Stores numbers that have been called
    let gameActive = false; // Flag to indicate if a game is in progress
    let bingoAchieved = false; // Flag if bingo has been won

    // --- DOM Elements ---
    const bingoBoardElement = document.getElementById('bingo-board');
    const currentNumberElement = document.getElementById('current-number');
    const gameMessagesElement = document.getElementById('game-messages');
    const callNumberBtn = document.getElementById('call-number-btn');
    const newGameBtn = document.getElementById('new-game-btn');

    // --- Event Listeners ---
    callNumberBtn.addEventListener('click', callNextNumber);
    newGameBtn.addEventListener('click', resetGame);

    // --- Game Functions ---

    /**
     * Generates a unique set of numbers for a given Bingo column.
     * @param {string} letter - The Bingo letter (B, I, N, G, O).
     * @returns {number[]} An array of 5 unique numbers for the column.
     */
    function generateColumnNumbers(letter) {
        const range = BINGO_RANGES[letter];
        const numbers = new Set();
        while (numbers.size < CARD_SIZE) {
            const num = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
            numbers.add(num);
        }
        return Array.from(numbers).sort((a, b) => a - b); // Sort for better readability
    }

    /**
     * Creates and displays the Bingo card in the DOM.
     */
    function createBingoCard() {
        bingoBoardElement.innerHTML = ''; // Clear existing board
        bingoCard = []; // Reset card data

        // Add Bingo headers (B, I, N, G, O)
        BINGO_LETTERS.forEach(letter => {
            const headerCell = document.createElement('div');
            headerCell.classList.add('bingo-header');
            headerCell.textContent = letter;
            bingoBoardElement.appendChild(headerCell);
        });

        // Generate numbers for each column
        const columns = BINGO_LETTERS.map(letter => generateColumnNumbers(letter));

        // Populate the board row by row
        for (let row = 0; row < CARD_SIZE; row++) {
            for (let col = 0; col < CARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.classList.add('bingo-cell');
                const cellIndex = row * CARD_SIZE + col; // Calculate unique index for the cell

                let number;
                if (row === Math.floor(CARD_SIZE / 2) && col === Math.floor(CARD_SIZE / 2)) {
                    // This is the free space
                    cell.textContent = 'FREE';
                    cell.classList.add('free-space');
                    markedCells.add(cellIndex); // Free space is always marked
                    number = 0; // Use 0 or null to signify free space in bingoCard array
                } else {
                    number = columns[col][row]; // Get number from the generated column
                    cell.textContent = number;
                    cell.dataset.number = number; // Store number in a data attribute
                    cell.addEventListener('click', () => markCell(cell, cellIndex));
                }
                bingoCard.push(number); // Add number to the bingoCard array
                bingoBoardElement.appendChild(cell);
            }
        }
        // Visually mark the free space as marked
        const freeSpaceElement = bingoBoardElement.querySelector('.free-space');
        if (freeSpaceElement) {
            freeSpaceElement.classList.add('marked');
        }
    }

    /**
     * Handles marking a cell on the Bingo card.
     * @param {HTMLElement} cellElement - The DOM element of the cell clicked.
     * @param {number} index - The index of the cell in the bingoCard array.
     */
    function markCell(cellElement, index) {
        if (!gameActive || bingoAchieved) {
            showMessage("Start a new game to play!");
            return;
        }

        const numberOnCard = parseInt(cellElement.dataset.number);
        // Check if the number on the card has actually been called
        if (calledNumbers.has(numberOnCard)) {
            if (!markedCells.has(index)) {
                markedCells.add(index);
                cellElement.classList.add('marked');
                showMessage(`Marked: ${numberOnCard}!`);
                checkForBingo();
            } else {
                showMessage("That number is already marked!");
            }
        } else {
            showMessage(`Number ${numberOnCard} has not been called yet!`);
        }
    }

    /**
     * Calls the next random Bingo number.
     */
    function callNextNumber() {
        if (bingoAchieved) {
            showMessage("Bingo! Start a new game.");
            return;
        }
        if (!gameActive) {
            gameActive = true;
            showMessage("Game started! Good luck!");
            callNumberBtn.textContent = "Call Next Number";
            newGameBtn.disabled = false;
        }

        if (calledNumbers.size >= 75) { // All numbers called
            showMessage("All numbers called! No Bingo. Game Over!");
            callNumberBtn.disabled = true;
            return;
        }

        let newNumber;
        let letter;
        let foundUnique = false;

        // Loop until a unique, uncalled number is found
        while (!foundUnique) {
            const randomLetterIndex = Math.floor(Math.random() * BINGO_LETTERS.length);
            letter = BINGO_LETTERS[randomLetterIndex];
            const range = BINGO_RANGES[letter];
            newNumber = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

            if (!calledNumbers.has(newNumber)) {
                foundUnique = true;
                calledNumbers.add(newNumber);
            }
        }

        // Animate the number display
        currentNumberElement.style.animation = 'none'; // Reset animation
        void currentNumberElement.offsetWidth; // Trigger reflow
        currentNumberElement.textContent = `${letter}-${newNumber}`;
        currentNumberElement.style.animation = 'numberCall 0.5s ease-out';

        showMessage(`Called: ${letter}-${newNumber}`);

        // Automatically mark the number if it's on the card
        const cells = bingoBoardElement.querySelectorAll('.bingo-cell');
        cells.forEach((cell, index) => {
            if (parseInt(cell.dataset.number) === newNumber && !markedCells.has(index)) {
                markedCells.add(index);
                cell.classList.add('marked');
                showMessage(`Called: ${letter}-${newNumber}. Marked on your card!`);
                checkForBingo();
            }
        });
    }

    /**
     * Checks if a Bingo has been achieved (horizontal, vertical, or diagonal line).
     */
    function checkForBingo() {
        const lines = [];

        // Horizontal lines
        for (let r = 0; r < CARD_SIZE; r++) {
            const line = [];
            for (let c = 0; c < CARD_SIZE; c++) {
                line.push(r * CARD_SIZE + c);
            }
            lines.push(line);
        }

        // Vertical lines
        for (let c = 0; c < CARD_SIZE; c++) {
            const line = [];
            for (let r = 0; r < CARD_SIZE; r++) {
                line.push(r * CARD_SIZE + c);
            }
            lines.push(line);
        }

        // Diagonal lines
        const diag1 = []; // Top-left to bottom-right
        const diag2 = []; // Top-right to bottom-left
        for (let i = 0; i < CARD_SIZE; i++) {
            diag1.push(i * CARD_SIZE + i);
            diag2.push(i * CARD_SIZE + (CARD_SIZE - 1 - i));
        }
        lines.push(diag1);
        lines.push(diag2);

        for (const line of lines) {
            const isBingo = line.every(index => markedCells.has(index));
            if (isBingo) {
                showMessage("BINGO! You won!");
                highlightWinningLine(line);
                bingoAchieved = true;
                callNumberBtn.disabled = true; // Disable calling new numbers
                return; // Stop checking after first bingo
            }
        }
    }

    /**
     * Highlights the cells that form the winning Bingo line.
     * @param {number[]} winningLineIndices - An array of indices of cells in the winning line.
     */
    function highlightWinningLine(winningLineIndices) {
        const cells = bingoBoardElement.querySelectorAll('.bingo-cell');
        winningLineIndices.forEach(index => {
            if (cells[index]) {
                cells[index].classList.add('winning-line');
            }
        });
    }

    /**
     * Displays a message to the user.
     * @param {string} message - The message to display.
     */
    function showMessage(message) {
        gameMessagesElement.textContent = message;
    }

    /**
     * Resets the game to a new state.
     */
    function resetGame() {
        markedCells.clear();
        calledNumbers.clear();
        bingoCard = [];
        gameActive = false;
        bingoAchieved = false;

        currentNumberElement.textContent = '--';
        callNumberBtn.disabled = false;
        newGameBtn.disabled = false; // Ensure new game button is always enabled after reset

        createBingoCard();
        showMessage("New game started! Good luck!");

        // Remove winning line highlights from previous game
        const winningCells = bingoBoardElement.querySelectorAll('.winning-line');
        winningCells.forEach(cell => cell.classList.remove('winning-line'));

        // Ensure all marked cells are correctly styled (free space)
        const allCells = bingoBoardElement.querySelectorAll('.bingo-cell');
        allCells.forEach(cell => {
            if (!cell.classList.contains('free-space')) {
                cell.classList.remove('marked');
            } else {
                cell.classList.add('marked'); // Ensure free space is always marked
            }
        });
    }

    // --- Initialize Game on Load ---
    window.onload = function() {
        resetGame(); // Start a new game when the page loads
    };