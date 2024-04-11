const fs = require("fs");
// Reading in the codat file.
const codatPath = "./codat.json";
let codatData;
fs.readFile(codatPath, "utf8", (err, data) => {
  if (err) {
    console.log("Error reading file:", err);
    return;
  }

  try {
    codatData = JSON.parse(data);
  } catch (err) {
    console.error("Error parsing data", err);
  }
});

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Substring variables
let code;
let names;
let yob;
let mob;
let bDayAndGender;
let townCodeStart;
let townCodeEnd;
let townCode;
let checkCharacter;

// Get input from user
function getInput() {
  readline.question("Enter Code: ", (userInput) => {
    userInput = userInput.toUpperCase();
    code = userInput;
    readline.close();
    if (validateCode()) {
      console.log(extractCodeData());
    }
  });
}
getInput();
/* 
    Check through the code to ensure that is has the proper number of characters,
    and that each character has the proper types of data at specific parts of the 
    code, verified by the italian fiscal code wikipedia page. Based on that criteria,
    I will check the following.

    1. Length of the code
    2. Certain spaces are alphabetical
    3. Certain spaces are numeric
    4. Month of birth is one of 12 letters.
    5. Birthday and gender are within the proper range
    6. Town of birth is one of the stored values in codat
    7. The check character follows the algorithm they've created(on wikipedia)
*/
function validateCode() {
  const regex = /^[A-Z]+$/;
  names = code.substr(0, 6);
  yob = code.substr(6, 2);
  mob = code.substr(8, 1);
  bDayAndGender = code.substr(9, 2);
  townCodeStart = code.substr(11, 1);
  townCodeEnd = code.substr(12, 3);
  townCode = code.substr(11, 4);
  checkCharacter = code.substr(15, 1);

  // Validate size
  if (code.length != 16) {
    console.log("Code is the wrong size.");
    return false;
  }

  // Checking portions of code that should be alphabetical
  if (
    !regex.test(names) ||
    !regex.test(mob) ||
    !regex.test(townCodeStart) ||
    !regex.test(checkCharacter)
  ) {
    console.log("Code format is incorrect");
    return false;
  }

  // Checking portions of code that should be numerical
  if (isNaN(yob) || isNaN(bDayAndGender) || isNaN(townCodeEnd)) {
    console.log("Code format is incorrect");
    return false;
  }

  // Making sure month of birth is one of 12 letters
  const validMobValues = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "H",
    "L",
    "M",
    "P",
    "R",
    "S",
    "T",
  ];

  if (!validMobValues.includes(mob)) {
    console.log("Invalid month of birth value");
    return false;
  }
  // Ensuring the bday/gender value is within the correct range of 1-31, and 41-71
  if (
    parseInt(bDayAndGender) < 1 ||
    parseInt(bDayAndGender) > 71 ||
    (parseInt(bDayAndGender) > 31 && parseInt(bDayAndGender) < 40)
  ) {
    console.log("Invalid birthday/gender code");
    return false;
  }
  // Use the codat file to verify town code.
  if (!codatData[townCode]) {
    console.log("Town code is invalid");
    return false;
  }
  // Validate the check character
  if (!checkCharacterValidation()) {
    console.log("Check character was invalid");
    return false;
  }
  console.log("Code is valid");
  return true;
}

function checkCharacterValidation() {
  let sum = 0;
  const oddCharacters = {
    0: 1,
    1: 0,
    2: 5,
    3: 7,
    4: 9,
    5: 13,
    6: 15,
    7: 17,
    8: 19,
    9: 21,
    A: 1,
    B: 0,
    C: 5,
    D: 7,
    E: 9,
    F: 13,
    G: 15,
    H: 17,
    I: 19,
    J: 21,
    K: 2,
    L: 4,
    M: 18,
    N: 20,
    O: 11,
    P: 3,
    Q: 6,
    R: 8,
    S: 12,
    T: 14,
    U: 16,
    V: 10,
    W: 22,
    X: 25,
    Y: 24,
    Z: 23,
  };

  const evenCharacters = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    F: 5,
    G: 6,
    H: 7,
    I: 8,
    J: 9,
    K: 10,
    L: 11,
    M: 12,
    N: 13,
    O: 14,
    P: 15,
    Q: 16,
    R: 17,
    S: 18,
    T: 19,
    U: 20,
    V: 21,
    W: 22,
    X: 23,
    Y: 24,
    Z: 25,
  };

  // Get the total sum of the code, looping through the entire code minus the last character
  for (let i = 0; i < code.length - 1; i++) {
    // Because of the nature of 0 indexed strings, the logic is inverse here of what you'd usually expect.
    if (i % 2 === 0) {
      sum += oddCharacters[code[i]];
    } else if (i % 2 !== 0) {
      sum += evenCharacters[code[i]];
    }
  }

  sum = sum % 26;
  // Fancy little way to check if the code the strings match using unicode values
  if (checkCharacter === String.fromCharCode(sum + 65)) {
    return true;
  }

  return false;
}

/* Extract code data looks at the fiscal code applied and gives back and object that has the following info

    bornOn: Date;
    gender: string; 
    placeOfBirth: {
        countryCode: string;
        countryName: string;
        city: string;
        state: string;

  1. Get the date born on, using yob, mob, and the bDayAndGender variables
  2. Get gender by using a simple calculation on bDayAndGender
  3. Using townCode and codat file, identify all the place of birth info.
*/

function extractCodeData() {
  let person = {
    bornOn: new Date(),
    gender: "Male",
    placeOfBirth: {
      countryCode: "US",
      countryName: "United States",
      city: "New York",
      state: "NY",
    },
  };
  // Get birthday
  person.bornOn = getPersonBirthDate();

  return person;
}

function getPersonBirthDate() {
  // Getting the current year for comparison
  let currentDate = new Date();
  let currentYear = currentDate.getFullYear() - 2000;
  let personYear;

  const monthCodes = {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    H: 5,
    L: 6,
    M: 7,
    P: 8,
    R: 9,
    S: 10,
    T: 11,
  };
  let personMonth;
  let personDay;
  // Get the date born on
  // If we are still using JS by the time I have to change this code, we are doomed anyways.
  if (parseInt(yob) <= currentYear) {
    personYear = yob + 2000;
  } else {
    personYear = parseInt(yob) + 1900;
  }

  personMonth = monthCodes[mob];

  // Account for which gender the person is in the date calculation
  if (bDayAndGender > 40) {
    personDay = bDayAndGender - 40;
  } else {
    personDay = bDayAndGender;
  }

  let personDate = new Date(personYear, personMonth, personDay);

  return personDate;
}
