import { CircularArray } from "../datamanagement/DataManager";

describe("CircularArray", () => {
    let cArray: CircularArray;

    beforeEach(() => {
        cArray = new CircularArray(5);
    });

    test("should add value and maintain proper count", () => {
        cArray.add(1);
        cArray.add(2);
        cArray.add(3);
        cArray.add(4);
        cArray.add(5);
        cArray.add(6);
        expect(cArray.calculateSMA()).toBe(4);
    }
    );

    test("should calculate SMA correctly", () => {
        cArray.add(10);
        cArray.add(20);
        cArray.add(30);
        cArray.add(40);
        cArray.add(50);
        expect(cArray.calculateSMA()).toBe(30);
    });

    test("should calculate stdev correctly", () => {
        cArray.add(10);
        cArray.add(20);
        cArray.add(30);
        cArray.add(40);
        cArray.add(50);
        expect(cArray.calculateStdev()).toBeCloseTo(15.8114, 4);
    });

    test("should return 0 for stdev if less than 2 data points", () => {
        cArray.add(10);
        expect(cArray.calculateStdev()).toBe(0);
    });

    test("should return 0 for stdev if no data points", () => {
        expect(cArray.calculateStdev()).toBe(0);
    });

    test("should return 0 for SMA if no data points", () => {
        expect(cArray.calculateSMA()).toBe(0);
    });
});
