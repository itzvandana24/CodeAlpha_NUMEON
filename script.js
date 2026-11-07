/* 1. DOM SELECTION
========================================= */

const expressionDisplay = document.querySelector("#expression");
const resultDisplay = document.querySelector("#result");
const keypad = document.querySelector(".calculator-panel");

const angleButtons = document.querySelectorAll('[data-action="angle-mode"]');

const historyList = document.querySelector("#history-list");
const previousCalculation = document.querySelector("#previous-calculation");

const memoryIndicator = document.querySelector("#memory-indicator");
const memoryValueDisplay = document.querySelector("#memory-value");

/* 2. CALCULATOR STATE
========================================= */

const calculator = {
  expression: "0",
  result: "",
  angleMode: "DEG",
  history: [],
  memory: 0,
  isResultDisplayed: false,
};

/* 3. DISPLAY FUNCTIONS
========================================= */

function updateExpressionDisplay() {
  expressionDisplay.textContent = calculator.expression;
}

function updateResultDisplay() {
  // TODO
}

function resetCalculator() {
  calculator.expression = "0";
  calculator.result = "";
  calculator.isResultDisplayed = false;

  updateExpressionDisplay();
  resultDisplay.textContent = "";
}

/* 4. INPUT FUNCTIONS
========================================= */

function appendNumber(number) {
  if (calculator.expression === "0") {
    calculator.expression = number;
  } else {
    calculator.expression += number;
  }

  updateExpressionDisplay();
}

function appendOperator(operator) {
  const expression = calculator.expression.trim();

  // Handle negative number at the beginning
  if (expression === "0") {
    if (operator === "-") {
      calculator.expression = "-";
      updateExpressionDisplay();
    }
    return;
  }

  // Check whether expression ends with an operator
  const endsWithOperator = /[+\-*\/^]$/.test(expression);

  if (endsWithOperator) {
    // Allow unary minus after another operator
    if (operator === "-" && !expression.endsWith("-")) {
      calculator.expression += " -";
      updateExpressionDisplay();
    }
    return;
  }

  calculator.expression += ` ${operator} `;

  calculator.isResultDisplayed = false;

  updateExpressionDisplay();
}

function appendDecimal() {
  const expression = calculator.expression;

  const parts = expression.trim().split(/\s+/);
  const lastPart = parts[parts.length - 1];
  const endsWithOperator = /[+\-*/^]$/.test(expression.trim());

  if (endsWithOperator) {
    calculator.expression += " 0.";
  } else {
    if (lastPart.includes(".")) {
      return;
    }

    calculator.expression += ".";
  }

  updateExpressionDisplay();
}

function appendParenthesis(parenthesis) {
  const expression = calculator.expression;

  if (parenthesis === "(") {
    if (expression === "0" || calculator.isResultDisplayed) {
      calculator.expression = "(";
      calculator.isResultDisplayed = false;
    } else {
      calculator.expression += "(";
    }
  } else if (parenthesis === ")") {
    const openCount = (expression.match(/\(/g) || []).length;
    const closeCount = (expression.match(/\)/g) || []).length;

    if (openCount > closeCount) {
      calculator.expression += ")";
    } else {
      return;
    }
  }

  updateExpressionDisplay();
}

function deleteLastCharacter() {
  if (calculator.expression.length <= 1) {
    calculator.expression = "0";
  } else {
    calculator.expression = calculator.expression.slice(0, -1);
  }

  updateExpressionDisplay();
}

/* 5. BASIC CALCULATION
========================================= */
function validateExpression(expression) {
  expression = expression.trim();

  // Reject empty expressions
  if (!expression || expression === "0") {
    return false;
  }

  // Reject expressions ending with an operator
  if (/[+\-*/^.]$/.test(expression)) {
    return false;
  }

  // Reject expressions starting with invalid operators
  if (/^[+*/^]/.test(expression)) {
    return false;
  }

  // Check balanced parentheses
  let bracketCount = 0;

  for (const char of expression) {
    if (char === "(") {
      bracketCount++;
    } else if (char === ")") {
      bracketCount--;

      if (bracketCount < 0) {
        return false;
      }
    }
  }

  if (bracketCount !== 0) {
    return false;
  }

  return true;
}

function calculateExpression() {
  if (!validateExpression(calculator.expression)) {
    resultDisplay.textContent = "Invalid Expression";
    return;
  }

  const tokens = calculator.expression.match(
    /(?:\d+(?:\.\d*)?|\.\d+)|[+\-*\/^()]/g,
  );
  // Converting Infix expression to Reverse Postfix Expression(Shunting Yard algo)
  const output = [];
  const operators = [];

  const precedence = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "u-": 3,
    "^": 4,
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const previousToken = tokens[i - 1];

    if (!isNaN(token)) {
      output.push(Number(token));
    } else if (token === "(") {
      operators.push(token);
    } else if (token === ")") {
      while (operators.length > 0 && operators[operators.length - 1] !== "(") {
        output.push(operators.pop());
      }

      operators.pop();
    } else {
      //handling -ve numbers like -3 unray -ve number
      if (
        token === "-" &&
        (i === 0 ||
          previousToken === "(" ||
          ["+", "-", "*", "/", "^"].includes(previousToken))
      ) {
        operators.push("u-");
        continue;
      }
      while (
        operators.length > 0 &&
        operators[operators.length - 1] !== "(" &&
        (precedence[operators[operators.length - 1]] > precedence[token] ||
          (precedence[operators[operators.length - 1]] === precedence[token] &&
            token !== "^"))
      ) {
        output.push(operators.pop());
      }
      operators.push(token);
    }
  }

  while (operators.length > 0) {
    output.push(operators.pop());
  }

  // Evaluating the reverse postfix expression
  const stack = [];

  try {
    for (const token of output) {
      if (typeof token === "number") {
        stack.push(token);
      }

      else if (token === "u-") {
        if (stack.length < 1) {
          throw new Error("Invalid Expression");
        }

        const number = stack.pop();
        stack.push(-number);
        }
      else {
        if (stack.length < 2) {
          throw new Error("Invalid Expression");
        }

        const b = stack.pop();
        const a = stack.pop();

        let result;

        switch (token) {
          case "+":
            result = a + b;
            break;

          case "-":
            result = a - b;
            break;

          case "*":
            result = a * b;
            break;

          case "/":
            if (b === 0) {
              throw new Error("Cannot divide by zero");
            }
            result = a / b;
            break;

          case "^":
            result = Math.pow(a, b);
            break;
        }

        stack.push(result);
      }
    }

    if (stack.length !== 1 || !Number.isFinite(stack[0])) {
      throw new Error("Invalid Expression");
    }

    calculator.result = String(stack[0]);
    resultDisplay.textContent = calculator.result;
    calculator.isResultDisplayed = true;
  } catch (error) {
    resultDisplay.textContent = error.message;
  }
}

function formatResult(value) {
  // TODO: Handle precision.
}

/* 6. SCIENTIFIC FUNCTIONS
========================================= */

function calculateScientificFunction(name) {
  // TODO: sin, cos, tan, asin, acos, atan
  // TODO: sqrt, cbrt, square, factorial
  // TODO: log, ln
}

/* 7. ANGLE MODE
========================================= */

function setAngleMode(mode) {
  // TODO
}

function convertAngle(value) {
  // TODO
}

/* 8. CONSTANTS
========================================= */

function insertConstant(name) {
  // TODO: pi and e
}

/* 9. HISTORY
========================================= */

function saveToHistory(expression, result) {
  // TODO
}

function renderHistory() {
  // TODO
}

function reuseHistoryResult(result) {
  // TODO
}

function clearHistory() {
  // TODO
}

/* 10. MEMORY
========================================= */

function handleMemory(action) {
  // TODO: MC, MR, M+, M-, MS
}

/* 11. ERROR HANDLING
========================================= */

function handleCalculationError(error) {
  // TODO
}

/* 12. BUTTON EVENT DELEGATION
========================================= */

function handleButtonClick(event) {
  const button = event.target.closest("button");

  if (!button || !keypad.contains(button)) {
    return;
  }

  const action = button.dataset.action;
  const value = button.dataset.value;

  switch (action) {
    case "number":
      appendNumber(value);
      break;
    case "operator":
      appendOperator(value);
      break;
    case "decimal":
      appendDecimal();
      break;
    case "parenthesis":
      appendParenthesis(value);
      break;
    case "delete":
      deleteLastCharacter();
      break;
    case "equals":
      calculateExpression();
      break;
    case "clear":
      resetCalculator();
      break;
  }
}

keypad.addEventListener("click", handleButtonClick);

/* 13. KEYBOARD SUPPORT
========================================= */

function handleKeyboardInput(event) {}

/* 14. THEME
========================================= */

function toggleTheme() {
  // TODO
}

/* 15. EVENT LISTENERS
========================================= */

// TODO: Keypad click listener.

// TODO: DEG/RAD button listeners.

// TODO: Keyboard listener.
