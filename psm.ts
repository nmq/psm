import * as fs from "fs";
import { parse } from "csv-parse";

/* performs PSM analysis given 1) the data read from a CSV file into a matrix,
   2) the unit to be used for delimiting the price ranges

   in the first loop we populate the top row containing the price ranges,
   and in the second we compare each of those ranges against the CSV data */
function getPSM(matrix: number[][], unit: number): number[] {
    let priceRanges: number[][] = [];
    const upperBound: number = Math.max(...matrix.flat());
    for (let n: number = 0; n <= upperBound + unit; n += unit) {
        if (!priceRanges[0])
            priceRanges.push([n]);
        else
            priceRanges[0].push(n);
    }
    for (let i: number = 1; i < matrix.length; i++) {
        priceRanges.push(new Array(priceRanges[0].length).fill(0));
        const comparison = i % 2 ? function(a: number, b: number) {return a <= b} :
            function(a: number, b: number) {return a >= b};
        for (let j: number = 0; j < priceRanges[0].length; j++) {
            priceRanges[i][j] = matrix[i].filter((n) => comparison(n, priceRanges[0][j])).length;
        }
    }
    /* at this point the priceRanges matrix contains the following data:
       in the top row, the price ranges themselves;
       in the remaining rows, the number of respondants who hold each
       respective sentiment towards those price ranges */

    const highest: number = Math.ceil(findIntersection(priceRanges, low, tooHigh)),
        indiff: number = Math.ceil(findIntersection(priceRanges, high, low)),
        ideal: number = Math.ceil(findIntersection(priceRanges, tooHigh, tooLow)),
        lowest: number = Math.ceil(findIntersection(priceRanges, high, tooLow));

    return [highest, indiff, ideal, lowest];
}

/* this function looks for the price range where the number of respondants holding
   two given sentiments intersect, then returns the projected price point of intersection,
   or -1 in case there is no intersection */
function findIntersection(values: number[][], sentimentA: number, sentimentB: number): number {
    let x1: number, x2: number, y1: number, y2: number, y3: number, y4: number;
    for (let i: number = 1; i < values[0].length; i++){
        if (values[sentimentA][i] < values[sentimentB][i] === values[sentimentA][i-1] < values[sentimentB][i-1])
            continue;
        x1 = values[0][i-1], x2 = values[0][i], y1 = values[sentimentA][i-1],
            y2 = values[sentimentA][i], y3 = values[sentimentB][i-1], y4 = values[sentimentB][i];
        return lineSegmentIntersection([x1,x2,x1,x2,y1,y2,y3,y4]);
    }
    return -1;
}

function lineSegmentIntersection(coordinates: number[]): number {
    const [x1, x2, x3, x4, y1, y2, y3, y4] = coordinates;
    return ( (y3-y1)*(x1-x2)*(x3-x4)+x1*(y1-y2)*(x3-x4)-x3*(y3-y4)*(x1-x2) ) / 
        ( (y1-y2)*(x3-x4)-(x1-x2)*(y3-y4) );
}

// confirms that command line parameters have been input correctly
if (!process.argv[2] ||
    !fs.existsSync(process.argv[2]) ||
    process.argv[2].split('.').pop() !== "csv") {
        console.log("コマンドを実行できなかった。\nコマンド実行例:\n$ ts-node index.ts file.csv");
        process.exit(1);
    }
const csvFile = process.argv[2];

// unit constant to be used in PSM analysis, other constants for clarity
const unit: number = 50, high: number = 1, low: number = 2,
    tooHigh: number = 3, tooLow: number = 4;

let csvValues: number[][] = [];

// reads CSV file into the csvValues matrix
fs.createReadStream(csvFile)
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", (row) => {
        for (let i: number = 0; i < row.length; i++) {
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
    })