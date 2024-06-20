import * as fs from 'fs';
export class CircularArray {
    private arr: number[];
    private capacity: number;
    private start: number = 0; // indicating the start index, aka the oldest data point
    private count: number = 0; // indicating the number of data points in the circular array

    constructor(capacity: number) {
        this.capacity = capacity;
        this.arr = new Array(capacity).fill(0);
    }

    // loading data to the circular array
    loadData(data: number[], start: number, count: number): void {
        if (data.length > this.capacity) {
            throw new Error(`Data length ${data.length} exceeds the capacity of the circular array ${this.capacity}`);
        }

        this.start = start;
        this.count = count;

        for (let i = 0; i < count; i++) {
            this.arr[i] = data[i];
        }
    }

    add(value: number): void {
        let index = (this.start + this.count) % this.capacity;
        this.arr[index] = value;
        if (this.count < this.capacity) {
            this.count++;
        } else {
            this.start = (this.start + 1) % this.capacity;
        }
    }


    calculateSMA(): number {
        let sum = 0;
        for (let i = 0; i < this.count; i++) {
            sum += this.arr[(this.start + i) % this.capacity];
        }

        return sum / this.count;
    }

    calculateStdev(): number {
        if (this.count < 2) return 0; // need at least 2 data points to calculate stdev

        const mean = this.calculateSMA();
        let variance = 0;

        for (let i = 0; i < this.count; i++) {
            let diff = this.arr[(this.start + i) % this.capacity] - mean;
            variance += diff * diff;
        }

        variance /= (this.count - 1);
        return Math.sqrt(variance);
    }

    static fromFile(capacity: number, filePath: string, fileName: string): CircularArray {
        const fileContent = fs.readFileSync(filePath + fileName, 'utf-8').split('\n');
        const start = parseInt(fileContent[0]);
        const count = parseInt(fileContent[1]);
        const data = fileContent.slice(2).filter((line) => line !== '').map(Number);

        const circularArray = new CircularArray(capacity);
        circularArray.loadData(data, start, count);
        return circularArray;
    }

    saveToFile(filePath: string, fileName: string): void {
        const fileContent = [this.start.toString(), this.count.toString(), ...this.arr];
        fs.writeFileSync(filePath + fileName, fileContent.join('\n'), 'utf-8');
    }

}
// Path: src/utilities/CircularArray.ts