function functionMatrix(points) {
    let matrix = [];
    for (let point of points) {
        let row = [];
        for (let i = 0; i < points.length; i++) {
            row.push(Math.pow(point[0], i));
        }
        row.push(point[1]);
        matrix.push(row);
    }
    return matrix;
}

function simpleGaussElim(matrix) {
    for (let row = 0; row < matrix.length; row++) {
        for (let editingRow = row + 1; editingRow < matrix.length; editingRow++) {
            const multiple = matrix[editingRow][row]/matrix[row][row];
            for (let i = row; i < matrix[row].length; i++) {
                matrix[editingRow][i] -= multiple*matrix[row][i];
            }
        }
    }
    return matrix;
}

function simpleSolveMatrix(matrix) {
    const len = matrix.length;
    let values = new Array(len);
    for (let row = len-1; row >= 0; row--) {
        let rowArr = matrix[row];
        let sum = rowArr[len];
        for (let col = len-1; col > row; col--) {
            sum -= values[col]*rowArr[col];
        }
        values[row] = (sum/rowArr[row]);
    }
    return values;
}