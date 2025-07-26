from flask import Flask, render_template, request, jsonify
import math
import random
import re
from math import factorial

app = Flask(__name__)

memory_value = 0
angle_mode = "DEG"

def safe_eval(expr):
    global memory_value, angle_mode

    try:
        # ✅ Auto-close unbalanced parentheses
        open_p = expr.count('(')
        close_p = expr.count(')')
        expr += ')' * (open_p - close_p)

        # ✅ Strip leading zeros from whole numbers (e.g., 0963 → 963)
        expr = re.sub(r'\b0+([1-9]\d*)', r'\1', expr)

        # ✅ Angle mode logic
        if angle_mode == "DEG":
            sin = lambda x: math.sin(math.radians(x))
            cos = lambda x: math.cos(math.radians(x))
            tan = lambda x: math.tan(math.radians(x)) if abs(math.cos(math.radians(x))) > 1e-10 else (_ for _ in ()).throw(ZeroDivisionError("tan undefined"))
        else:
            sin = math.sin
            cos = math.cos
            tan = lambda x: math.tan(x) if abs(math.cos(x)) > 1e-10 else (_ for _ in ()).throw(ZeroDivisionError("tan undefined"))

        # ✅ Safe environment
        allowed_names = {
            "pi": math.pi,
            "e": math.e,
            "sqrt": math.sqrt,
            "log": math.log,
            "factorial": factorial,
            "abs": abs,
            "nCr": lambda n, r: math.comb(n, r),
            "nPr": lambda n, r: math.perm(n, r),
            "Ran#": lambda: round(random.random(), 6),
            "RanInt": lambda a, b: random.randint(int(a), int(b)),
            "MR": lambda: memory_value,
            "sin": sin,
            "cos": cos,
            "tan": tan,
            "__builtins__": {}
        }

        # ✅ Evaluate
        result = eval(expr, {"__builtins__": {}}, allowed_names)

        # ✅ Clean float artifacts
        if isinstance(result, float) and abs(result) < 1e-10:
            result = 0.0

        return round(result, 6) if isinstance(result, float) else result

    except Exception:
        return "Error"

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/calculate", methods=["POST"])
def calculate():
    data = request.json
    expr = data.get("expression", "")
    result = safe_eval(expr)
    return jsonify({"result": result})

@app.route("/memory/add", methods=["POST"])
def memory_add():
    global memory_value
    data = request.json
    expr = data.get("expression", "")
    val = safe_eval(expr)
    if isinstance(val, (int, float)):
        memory_value += val
    return jsonify({"memory": memory_value})

@app.route("/memory/clear", methods=["POST"])
def memory_clear():
    global memory_value
    memory_value = 0
    return jsonify({"memory": memory_value})

@app.route("/angle/toggle", methods=["POST"])
def toggle_angle_mode():
    global angle_mode
    angle_mode = "RAD" if angle_mode == "DEG" else "DEG"
    return jsonify({"angle_mode": angle_mode})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)

