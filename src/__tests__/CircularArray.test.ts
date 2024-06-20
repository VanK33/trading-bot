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
});
