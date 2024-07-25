"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const csv_parse_1 = require("csv-parse");
function getPSM(matrix, unit) {
    let priceRanges = [];
    const upperBound = Math.max(...matrix.flat());
    for (let n = 0; n <= upperBound + unit; n += unit) {
        if (!priceRanges[0])
            priceRanges.push([n]);
        else
            priceRanges[0].push(n);
    }
    for (let i = 1; i < matrix.length; i++) {
        priceRanges.push(new Array(priceRanges[0].length).fill(0));
        const comparison = i % 2 ? function (a, b) { return a <= b; } :
            function (a, b) { return a >= b; };
        for (let j = 0; j < priceRanges[0].length; j++) {
            priceRanges[i][j] = matrix[i].filter((n) => comparison(n, priceRanges[0][j])).length;
        }
    }
    const highest = Math.ceil(findIntersection(priceRanges, low, tooHigh)), indiff = Math.ceil(findIntersection(priceRanges, high, low)), ideal = Math.ceil(findIntersection(priceRanges, tooHigh, tooLow)), lowest = Math.ceil(findIntersection(priceRanges, high, tooLow));
    return [highest, indiff, ideal, lowest];
}
function findIntersection(values, sentimentA, sentimentB) {
    let x1, x2, y1, y2, y3, y4;
    for (let i = 1; i < values[0].length; i++) {
        if (values[sentimentA][i] < values[sentimentB][i] === values[sentimentA][i - 1] < values[sentimentB][i - 1])
            continue;
        x1 = values[0][i - 1], x2 = values[0][i], y1 = values[sentimentA][i - 1],
            y2 = values[sentimentA][i], y3 = values[sentimentB][i - 1], y4 = values[sentimentB][i];
        return lineSegmentIntersection([x1, x2, x1, x2, y1, y2, y3, y4]);
    }
    return -1;
}
function lineSegmentIntersection(coordinates) {
    const [x1, x2, x3, x4, y1, y2, y3, y4] = coordinates;
    return ((y3 - y1) * (x1 - x2) * (x3 - x4) + x1 * (y1 - y2) * (x3 - x4) - x3 * (y3 - y4) * (x1 - x2)) /
        ((y1 - y2) * (x3 - x4) - (x1 - x2) * (y3 - y4));
}
if (!process.argv[2] ||
    !fs.existsSync(process.argv[2]) ||
    process.argv[2].split('.').pop() !== "csv") {
    console.log("コマンドを実行できなかった。\nコマンド実行例:\n$ ts-node index.ts file.csv");
    process.exit(1);
}
const csvFile = process.argv[2];
const unit = 50, high = 1, low = 2, tooHigh = 3, tooLow = 4;
let csvValues = [];
fs.createReadStream(csvFile)
    .pipe((0, csv_parse_1.parse)({ delimiter: ",", from_line: 2 }))
    .on("data", (row) => {
    for (let i = 0; i < row.length; i++) {
        if (!csvValues[i])
            csvValues.push([Number(row[i])]);
        else
            csvValues[i].push(Number(row[i]));
    }
})
    .on("end", () => {
    csvValues.forEach((element) => element.sort((a, b) => a - b));
    const [highest, indiff, ideal, lowest] = getPSM(csvValues, unit);
    console.log(`最高価格：${highest}円
            \r妥協価格：${indiff}円
            \r理想価格：${ideal}円
            \r最低品質保証価格：${lowest}円`);
});
//# sourceMappingURL=psm.js.map