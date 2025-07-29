const display = document.getElementById("display");
const history = document.getElementById("history");
let expression = "";
let justEvaluated = false;
let usedAns = false;
let last_result = "0";

// Bind button clicks
document.querySelectorAll("button").forEach(btn => {
    if (btn.id !== "angle-toggle") {
        btn.addEventListener("click", () => handleInput(btn.textContent));
    }
});

// Handle angle toggle
const angleToggle = document.getElementById("angle-toggle");
if (angleToggle) {
    angleToggle.addEventListener("click", () => {
        fetch("/angle/toggle", { method: "POST" })
            .then(res => res.json())
            .then(data => {
                angleToggle.textContent = data.angle_mode;
            });
    });
}

// Keyboard support
document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if (key === "enter") {
        calculate();
    } else if (key === "backspace") {
        expression = expression.slice(0, -1);
        display.value = display.value.slice(0, -1);
    } else if (key === "escape") {
        expression = "";
        display.value = "";
        usedAns = false;
    } else if (key === "a") {
        smartClearIfNeeded();
        insertImpliedMultiply();
        expression += last_result;
        display.value += "Ans";
        usedAns = true;
    } else if (key === "^") {
        if (/[0-9eπ)]/.test(expression.slice(-1)) && !display.value.endsWith("^")) {
            expression += "**";
            display.value += "^";
        }
    } else if ("+-*/".includes(key)) {
        if (usedAns) usedAns = false;
        expression += key;
        display.value += key;
    } else if (key === "s") {
        prepAfterAns("sin(");
    } else if (key === "l") {
        prepAfterAns("log(");
    } else if (key === "c") {
        prepAfterAns("cos(");
    } else if (key === "t") {
        prepAfterAns("tan(");
    } else if (key === "r") {
        prepAfterAns("√(", "sqrt(");
    } else if (key === "!") {
        handleInput("x!");
    } else if (key === ",") {
        expression += ",";
        display.value += ",";
    } else if (key === "p") {
        prepAfterAns("π", "pi");
    } else if (key === "e") {
        prepAfterAns("e", "e");
    } else if ("0123456789().".includes(key)) {
        smartClearIfNeeded();
        expression += key;
        display.value += key;
    }
});

function smartClearIfNeeded() {
    if (usedAns || justEvaluated) {
        const lastChar = display.value.slice(-1);
        if (!"+-*/(".includes(lastChar)) {
            expression = "";
            display.value = "";
        }
        usedAns = false;
        justEvaluated = false;
    }
}

function prepAfterAns(symbol, real = null) {
    smartClearIfNeeded();
    insertImpliedMultiply();
    expression += real || symbol;
    display.value += symbol;
}

function insertImpliedMultiply() {
    if (/[0-9.)]/.test(expression.slice(-1))) {
        expression += "*";
        display.value += "*";
    }
}

function handleInput(val) {
    if (val === "=") {
        calculate();
    } else if (val === "Ans") {
        smartClearIfNeeded();
        insertImpliedMultiply();
        expression += last_result;
        display.value += "Ans";
        usedAns = true;
    } else if (val === "C") {
        expression = "";
        display.value = "";
        usedAns = false;
    } else if (val === "CE") {
        expression = expression.slice(0, -1);
        display.value = display.value.slice(0, -1);
    } else if (val === "√") {
        prepAfterAns("√(", "sqrt(");
    } else if (val === "x²") {
        expression += "**2";
        display.value += "²";
    } else if (val === "x³") {
        expression += "**3";
        display.value += "³";
    } else if (val === "xʸ") {
        expression += "**";
        display.value += "^";
    } else if (val === "x!") {
        const match = expression.match(/(\d+(\.\d+)?|\bpi\b|\be\b|\bAns\b|\))$/);
        if (match) {
            const value = match[0];
            const start = expression.lastIndexOf(value);
            expression = expression.slice(0, start) + `factorial(${value})`;
            display.value += "!";
        }
    } else if (val === "1/x") {
        expression += "1/(";
        display.value += "1/(";
    } else if (val === "π") {
        prepAfterAns("π", "pi");
    } else if (val === "e") {
        prepAfterAns("e", "e");
    } else if (["log", "sin", "cos", "tan"].includes(val)) {
        prepAfterAns(val + "(", val + "(");
    } else if (val === "nCr" || val === "nPr") {
        prepAfterAns(val + "(", val + "(");
    } else if (val === "RanInt") {
        prepAfterAns("RanInt(", "RanInt(");
    } else if (val === "Ran#") {
        insertImpliedMultiply();
        expression += "Ran#()";
        display.value += "Ran#";
    } else if (val === "M+") {
        fetch("/memory/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expression: expression })
        });
    } else if (val === "MR") {
        smartClearIfNeeded();
        insertImpliedMultiply();
        expression += "MR()";
        display.value += "MR";
    } else if (val === "MC") {
        fetch("/memory/clear", { method: "POST" });
    } else {
        smartClearIfNeeded();
        expression += val;
        display.value += val;
    }
}

function cleanDisplayForHistory(displayVal) {
    return displayVal
        .replace(/(\^)+/g, "^")
        .replace(/(³)+/g, "³")
        .replace(/\*+/g, "*")
        .replace(/\*$/g, "");
}

function calculate() {
    if (display.value.trim() === "Ans") {
        expression = last_result;
    }

    let openP = (expression.match(/\(/g) || []).length;
    let closeP = (expression.match(/\)/g) || []).length;
    expression += ")".repeat(openP - closeP);

    const cleanDisplay = cleanDisplayForHistory(display.value);

    fetch("/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression: expression })
    })
        .then(res => res.json())
        .then(data => {
            if (data.result !== "Error") {
                last_result = data.result.toString();
            }

            history.innerHTML += `<div>${cleanDisplay} = ${data.result}</div>`;
            display.value = data.result;
            expression = data.result.toString();
            justEvaluated = true;
            usedAns = false;
        });
}
