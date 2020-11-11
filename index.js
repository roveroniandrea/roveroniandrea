const randomWord = require('random-word');
const fs = require('fs');
const { Base64 } = require('js-base64');
const Mustache = require('mustache');

const readme = 'README.md';
const gameMustache = 'game.mustache';
const dataFormat = ['<!--DATA', 'DATA-->'];
const newGameSyntax = 'new-game';

if (!process.argv[2] || process.argv[2].includes(newGameSyntax)) {
    // Scelgo una parola da indovinare
    let word = '';
    do {
        word = randomWord();
    } while (word.length < 7);

    const triesRemaining = word.length - 3;
    const guessed = word.split('').map((_, index) => index == 0 || index == word.length - 1);

    renderToReadme({
        secretWord: formatWord(word, guessed),
        data: `${dataFormat[0]}${encodeSolution(word, guessed, triesRemaining, [])}${dataFormat[1]}`,
        triesRemaining,
        lettersCalled: [],
        lost: false,
        won: false,
        keyboard: renderKeyboard(),
        newGame: newGameUrl(),
    });
} else {
    const letter = process.argv[2].replace('hangman|', '').toLowerCase();
    const file = fs.readFileSync(readme).toString();
    const decodedData = decodeSolution(file.substring(file.indexOf(dataFormat[0]) + dataFormat[0].length, file.indexOf(dataFormat[1])));

    if (!decodedData.lettersCalled.includes(letter)) {
        decodedData.lettersCalled.unshift(letter);
        const isValid = decodedData.word.includes(letter);
        if (isValid) {
            decodedData.guessed = decodedData.word.split('').map((ch, index) => {
                return decodedData.guessed[index] || ch === letter;
            });
        } else {
            decodedData.triesRemaining = parseInt(decodedData.triesRemaining) - 1;
        }
    } else {
        decodedData.triesRemaining = parseInt(decodedData.triesRemaining) - 1;
    }
    if (decodedData.triesRemaining <= 0) {
        decodedData.guessed = decodedData.guessed.fill(1);
    }
    renderToReadme({
        secretWord: formatWord(decodedData.word, decodedData.guessed),
        data: `${dataFormat[0]}${encodeSolution(
            decodedData.word,
            decodedData.guessed,
            decodedData.triesRemaining,
            decodedData.lettersCalled
        )}${dataFormat[1]}`,
        triesRemaining: decodedData.triesRemaining,
        lettersCalled: decodedData.lettersCalled,
        lost: decodedData.triesRemaining <= 0 && decodedData.guessed.some((el) => !el),
        won: decodedData.guessed.every((el) => el),
        keyboard: renderKeyboard(),
        newGame: newGameUrl(),
    });
}

function formatWord(word, guessed) {
    return word
        .split('')
        .map((character, index) => {
            if (guessed[index]) {
                return index == 0 ? character.toUpperCase() : character;
            } else {
                return '_';
            }
        })
        .join(' ');
}

function encodeSolution(word, guessed, triesRemaining, lettersCalled) {
    const obj = {
        word,
        guessed,
        triesRemaining,
        lettersCalled,
    };

    const encoded = Base64.encode(JSON.stringify(obj));
    return encoded;
}

function decodeSolution(encoded) {
    return JSON.parse(Base64.decode(encoded));
}

function renderToReadme(view) {
    const mustacheFile = fs.readFileSync(gameMustache).toString();
    const newFile = Mustache.render(mustacheFile, view);
    fs.writeFileSync(readme, newFile);
}

function renderKeyboard() {
    const letters = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    const result = [];
    letters.forEach((row, rowIndex) => {
        result[rowIndex] = row.split('').map((letter) => ({
            letter,
            url: `https://github.com/roveroniandrea/roveroniandrea/issues/new?title=hangman%7C${letter}&body=Just+push+%27Submit+new+issue%27+without+editing+the+title.+The+README+will+be+updated+after+approximately+30+seconds.`,
        }));
    });
    return result;
}

function newGameUrl() {
    return `https://github.com/roveroniandrea/roveroniandrea/issues/new?title=hangman%7C${newGameSyntax}&body=Just+push+%27Submit+new+issue%27+without+editing+the+title.+The+README+will+be+updated+after+approximately+30+seconds.`;
}
