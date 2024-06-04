export class CircularArray {
    private arr: number[];
    private capacity: number;
    private start: number = 0;
    private count: number = 0;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.arr = new Array(capacity).fill(0);
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
        if (this.count === 0) return 0;
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

}