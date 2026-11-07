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
  resultDisplay.textContent = calculator.result
    ? formatResult(Number(calculator.result))
    : "";
}

function resetCalculator() {
  calculator.expression = "0";
  calculator.result = "";
  updateResultDisplay();
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

function appendPostfixOperator(operator) {
  if (!calculator.expression || calculator.expression === "0") {
    return;
  }

  calculator.expression += operator;

  calculator.isResultDisplayed = false;

  updateExpressionDisplay();
}
/* 5. BASIC CALCULATION
========================================= */
function validateExpression(expression) {
  if (!expression || !expression.trim()) return false;

  let tokens;

  try {
    tokens = tokenizeExpression(expression);
  } catch (error) {
    return false;
  }

  if (tokens.length === 0) return false;

  const functions = [
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "sqrt",
    "cbrt",
    "log",
    "ln",
  ];

  const operators = ["+", "-", "*", "/", "^"];

  let balance = 0;
  let expectOperand = true;
  let previousToken = null;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    const isNumber = /^\d+(\.\d*)?$/.test(token) || /^\.\d+$/.test(token);

    const isConstant = token === "pi" || token === "e";

    // Scientific functions
    if (functions.includes(token)) {
      if (!expectOperand || tokens[i + 1] !== "(") {
        return false;
      }
    }

    // Opening parenthesis
    else if (token === "(") {
      if (!expectOperand) return false;

      balance++;
      expectOperand = true;
    }

    // Closing parenthesis
    else if (token === ")") {
      if (expectOperand || balance === 0) return false;

      balance--;
      expectOperand = false;
    }

    // Numbers and constants
    else if (isNumber || isConstant) {
      if (!expectOperand) return false;

      expectOperand = false;
    }

    // Factorial
    else if (token === "!") {
      if (expectOperand || previousToken === "!") {
        return false;
      }

      expectOperand = false;
    }

    // Arithmetic operators
    else if (operators.includes(token)) {
      if (expectOperand) {
        // Only unary minus is allowed here.
        if (token !== "-") return false;
      } else {
        expectOperand = true;
      }
    } else {
      return false;
    }

    previousToken = token;
  }

  return balance === 0 && !expectOperand;
}

function calculateExpression() {
  try {
    if (!validateExpression(calculator.expression)) {
      throw new Error("Invalid Expression");
    }

    const tokens = tokenizeExpression(calculator.expression);

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

    const scientificFunctions = [
      "sin",
      "cos",
      "tan",
      "asin",
      "acos",
      "atan",
      "sqrt",
      "cbrt",
      "log",
      "ln",
    ];

    const isOperator = (token) => Object.hasOwn(precedence, token);

    const isRightAssociative = (operator) =>
      operator === "^" || operator === "u-";

    // STEP 1: INFIX TO POSTFIX
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const previousToken = tokens[i - 1];

      // Numbers and constants
      if (
        /^\d+(\.\d*)?$/.test(token) ||
        /^\.\d+$/.test(token) ||
        token === "pi" ||
        token === "e"
      ) {
        output.push(token);
      }

      // Scientific functions
      else if (scientificFunctions.includes(token)) {
        operators.push(token);
      }

      // Opening parenthesis
      else if (token === "(") {
        operators.push(token);
      }

      // Closing parenthesis
      else if (token === ")") {
        while (
          operators.length > 0 &&
          operators[operators.length - 1] !== "("
        ) {
          output.push(operators.pop());
        }

        if (operators.length === 0) {
          throw new Error("Mismatched parentheses");
        }

        operators.pop();

        // Pop scientific function after closing parenthesis
        if (
          operators.length > 0 &&
          scientificFunctions.includes(operators[operators.length - 1])
        ) {
          output.push(operators.pop());
        }
      }

      // Factorial (postfix unary operator)
      else if (token === "!") {
        output.push(token);
      }

      // Arithmetic operators
      else if (["+", "-", "*", "/", "^"].includes(token)) {
        let currentOperator = token;

        // Detect unary minus
        if (
          token === "-" &&
          (i === 0 || previousToken === "(" || isOperator(previousToken))
        ) {
          currentOperator = "u-";
        }

        // Unary minus should not pop an existing operator
        if (currentOperator !== "u-") {
          while (operators.length > 0) {
            const top = operators[operators.length - 1];

            if (!isOperator(top)) {
              break;
            }

            const shouldPop =
              precedence[top] > precedence[currentOperator] ||
              (precedence[top] === precedence[currentOperator] &&
                !isRightAssociative(currentOperator));

            if (!shouldPop) {
              break;
            }

            output.push(operators.pop());
          }
        }

        operators.push(currentOperator);
      } else {
        throw new Error("Invalid expression token");
      }
    }

    // Empty remaining operators
    while (operators.length > 0) {
      const operator = operators.pop();

      if (operator === "(" || operator === ")") {
        throw new Error("Mismatched parentheses");
      }

      output.push(operator);
    }

    console.log("Postfix:", output);

    // STEP 2: EVALUATE POSTFIX EXPRESSION
    const stack = [];

    for (const token of output) {
      // Numbers
      if (/^\d+(\.\d*)?$/.test(token) || /^\.\d+$/.test(token)) {
        stack.push(Number(token));
      }

      // Constants
      else if (token === "pi") {
        stack.push(Math.PI);
      } else if (token === "e") {
        stack.push(Math.E);
      }

      // Unary minus
      else if (token === "u-") {
        if (stack.length < 1) {
          throw new Error("Invalid expression");
        }

        stack.push(-stack.pop());
      }

      // Factorial
      else if (token === "!") {
        if (stack.length < 1) {
          throw new Error("Invalid expression");
        }

        const value = stack.pop();

        stack.push(calculateScientificFunction("factorial", value));
      }

      // Scientific functions
      else if (scientificFunctions.includes(token)) {
        if (stack.length < 1) {
          throw new Error("Invalid expression");
        }

        const value = stack.pop();

        stack.push(calculateScientificFunction(token, value));
      }

      // Binary operators
      else {
        if (stack.length < 2) {
          throw new Error("Invalid expression");
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

          default:
            throw new Error("Unknown operator");
        }

        stack.push(result);
      }
    }

    // STEP 3: FINAL RESULT VALIDATION
    if (stack.length !== 1 || !Number.isFinite(stack[0])) {
      throw new Error("Invalid expression");
    }

    calculator.result = String(stack[0]);
    resultDisplay.textContent = calculator.result;

    calculator.isResultDisplayed = true;

    updateResultDisplay();
  } catch (error) {
    resultDisplay.textContent = error.message;
    console.error("Calculation error:", error);
  }
}

function tokenizeExpression(expression) {
  const tokenPattern =
    /(?:asin|acos|atan|sqrt|cbrt|sin|cos|tan|log|ln|pi|e|\d+(?:\.\d*)?|\.\d+|[+\-*\/^!()])/y;

  const tokens = [];
  let position = 0;

  while (position < expression.length) {
    // Ignore whitespace
    if (/\s/.test(expression[position])) {
      position++;
      continue;
    }

    tokenPattern.lastIndex = position;

    const match = tokenPattern.exec(expression);

    if (!match) {
      throw new Error(`Invalid character: ${expression[position]}`);
    }

    tokens.push(match[0]);
    position = tokenPattern.lastIndex;
  }

  return tokens;
}

function formatResult(value) {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid result");
  }

  // Remove tiny floating-point artifacts
  if (Math.abs(value) < 1e-12) {
    return "0";
  }

  // Round to 12 significant digits
  const formattedValue = Number(value.toPrecision(12));

  // Prevent negative zero
  return Object.is(formattedValue, -0) ? "0" : String(formattedValue);
}

/* 6. SCIENTIFIC FUNCTIONS
========================================= */

function calculateScientificFunction(name, value) {
  switch (name) {
    // Trigonometric functions
    case "sin":
      return Math.sin(convertAngle(value));

    case "cos":
      return Math.cos(convertAngle(value));

    case "tan":
      return Math.tan(convertAngle(value));

    // Inverse trigonometric functions
    case "asin":
    case "acos":
    case "atan": {
      if ((name === "asin" || name === "acos") && (value < -1 || value > 1)) {
        throw new Error("Input must be between -1 and 1");
      }

      const result = Math[name](value);

      return calculator.angleMode === "DEG" ? (result * 180) / Math.PI : result;
    }

    // Logarithmic functions
    case "log":
      if (value <= 0) throw new Error("Input must be positive");
      return Math.log10(value);

    case "ln":
      if (value <= 0) throw new Error("Input must be positive");
      return Math.log(value);

    // Root functions
    case "sqrt":
      if (value < 0) throw new Error("Invalid square root");
      return Math.sqrt(value);

    case "cbrt":
      return Math.cbrt(value);

    // Square
    case "square":
      return value ** 2;

    // Factorial
    case "factorial": {
      if (!Number.isInteger(value) || value < 0) {
        throw new Error("Factorial requires a non-negative integer");
      }

      if (value > 170) {
        throw new Error("Result is too large");
      }

      let factorial = 1;

      for (let i = 2; i <= value; i++) {
        factorial *= i;
      }

      return factorial;
    }

    default:
      throw new Error("Unknown scientific function");
  }
}

function insertScientificFunction(name) {
  const functions = [
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "log",
    "ln",
    "sqrt",
    "cbrt",
  ];

  if (!functions.includes(name)) {
    return;
  }

  if (calculator.isResultDisplayed) {
    calculator.expression = "0";
    calculator.isResultDisplayed = false;
  }

  let expression = calculator.expression;

  if (expression === "0") {
    expression = "";
  }

  // Add multiplication if a number or closing parenthesis comes first
  if (/[\d)]$/.test(expression)) {
    expression += "*";
  }

  calculator.expression = expression + name + "(";

  updateExpressionDisplay();
}
/* 7. ANGLE MODE
========================================= */

function setAngleMode(mode) {
  if (mode !== "DEG" && mode !== "RAD") {
    return;
  }

  calculator.angleMode = mode;

  angleButtons.forEach((button) => {
    const isActive = button.dataset.value === mode;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function convertAngle(value) {
  if (calculator.angleMode === "DEG") {
    return (value * Math.PI) / 180;
  }

  return value;
}

/* 8. CONSTANTS
========================================= */

function insertConstant(name) {
  const constants = {
    pi: "pi",
    e: "e",
  };

  if (!constants[name]) {
    return;
  }

  if (calculator.isResultDisplayed) {
    calculator.expression = "0";
    calculator.isResultDisplayed = false;
  }

  let expression = calculator.expression;

  if (expression === "0") {
    expression = "";
  }

  // Add implicit multiplication when needed
  if (
    /[\d)]$/.test(expression) ||
    expression.endsWith("pi") ||
    expression.endsWith("e")
  ) {
    expression += "*";
  }

  calculator.expression = expression + constants[name];

  updateExpressionDisplay();
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

    case "angle-mode":
      setAngleMode(value);
      break;

    case "constant":
      insertConstant(value);
      break;

    case "function":
      if (value === "square") {
        appendPostfixOperator("^2");
      } else if (value === "factorial") {
        appendPostfixOperator("!");
      } else {
        insertScientificFunction(value);
      }
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
