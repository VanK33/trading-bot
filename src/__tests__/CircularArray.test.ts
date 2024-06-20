import exp from "constants";
import { CircularArray } from "../utilities/CircularArray";
import fs from "fs";

jest.mock("fs");

describe("CircularArray", () => {
    let cArray: CircularArray;
    const filePath = "test/";
    const fileName = "test.txt";
    const fileContent = "0\n5\n10\n20\n30\n40\n50";
    const errorContent = "0\n5\n10\n20\n30\n40\n50\n60";
    const emptyContent = "0\n5\n0\n0\n0\n0\n0";
    const capacity = 5;

    beforeEach(() => {
        (fs.readFileSync as jest.Mock).mockReturnValue(fileContent);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should creat CircularArray from file", () => {

        const circularArray = CircularArray.fromFile(capacity, filePath, fileName);

        expect(circularArray).toBeInstanceOf(CircularArray);
        expect(circularArray.calculateSMA()).toBe(30);
        expect(circularArray.calculateStdev()).toBeCloseTo(15.8114, 4);
        expect(circularArray['arr']).toEqual([10, 20, 30, 40, 50]);
        expect(circularArray['start']).toBe(0);
        expect(circularArray['count']).toBe(5);
    });

    it("should throw error if data length exceeds capacity", () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(errorContent);
        expect(() => CircularArray.fromFile(capacity, filePath, fileName)).toThrow();
    });

    it("should add elements correctly", () => {
        const circularArray = CircularArray.fromFile(capacity, filePath, fileName);
        circularArray.add(60);
        expect(circularArray['arr']).toEqual([60, 20, 30, 40, 50]);
        expect(circularArray['start']).toBe(1);
        expect(circularArray['count']).toBe(5);
        expect(circularArray.calculateSMA()).toBe(40);
        expect(circularArray.calculateStdev()).toBeCloseTo(15.8114, 4);

        circularArray.add(55.84);
        expect(circularArray['arr']).toEqual([60, 55.84, 30, 40, 50]);
        expect(circularArray['start']).toBe(2);
        expect(circularArray['count']).toBe(5);
        expect(circularArray.calculateSMA()).toBe(47.168);
        expect(circularArray.calculateStdev()).toBeCloseTo(12.1861, 4);

    });

    it("should handle array with all zeros with starting and capacity correctly", () => {
        (fs.readFileSync as jest.Mock).mockReturnValue(emptyContent);
        const circularArray = CircularArray.fromFile(capacity, filePath, fileName);
        expect(circularArray['arr']).toEqual([0, 0, 0, 0, 0]);
        expect(circularArray['start']).toBe(0);
        expect(circularArray['count']).toBe(5);
        expect(circularArray.calculateSMA()).toBe(0);
        expect(circularArray.calculateStdev()).toBe(0);
    });

    it("should save data to file", () => {
        const circularArray = CircularArray.fromFile(capacity, filePath, fileName);
        circularArray.saveToFile(filePath, fileName);
        expect(fs.writeFileSync).toHaveBeenCalledWith(filePath + fileName, "0\n5\n10\n20\n30\n40\n50", "utf-8");
    });

    // test("should add value and maintain proper count", () => {
    //     cArray.add(1);
    //     cArray.add(2);
    //     cArray.add(3);
    //     cArray.add(4);
    //     cArray.add(5);
    //     cArray.add(6);
    //     expect(cArray.calculateSMA()).toBe(4);
    // }
    // );

    // test("should calculate SMA correctly", () => {
    //     cArray.add(10);
    //     cArray.add(20);
    //     cArray.add(30);
    //     cArray.add(40);
    //     cArray.add(50);
    //     expect(cArray.calculateSMA()).toBe(30);
    // });

    // test("should calculate stdev correctly", () => {
    //     cArray.add(10);
    //     cArray.add(20);
    //     cArray.add(30);
    //     cArray.add(40);
    //     cArray.add(50);
    //     expect(cArray.calculateStdev()).toBeCloseTo(15.8114, 4);
    // });

    // test("should return 0 for stdev if less than 2 data points", () => {
    //     cArray.add(10);
    //     expect(cArray.calculateStdev()).toBe(0);
    // });

    // test("should return 0 for stdev if no data points", () => {
    //     expect(cArray.calculateStdev()).toBe(0);
    // });

    // test("should return 0 for SMA if no data points", () => {
    //     expect(cArray.calculateSMA()).toBe(0);
    // });

    // test("should load data correctly", () => {
    //     cArray.loadData([10, 20, 30, 40, 50], 0, 5);
    //     expect(cArray.calculateSMA()).toBe(30);
    // });

    // test("should throw error if data length exceeds capacity", () => {
    //     expect(() => cArray.loadData([10, 20, 30, 40, 50, 60], 0, 6)).toThrow();
    // });

    // test("should replace oldest data on the first add after the initial data read", () => {
    //     cArray.loadData([10, 20, 30, 40, 50], 0, 5);
    //     cArray.add(60);
    //     expect(cArray.calculateSMA()).toBe(40);
    // });

    // test("should initialize from stored file, and intialize with the correct data", () => {
    //     const capacity = 5;
    //     const circularArray = CircularArray.fromFile(capacity, filePath, fileName);
});
