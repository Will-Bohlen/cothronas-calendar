/**
 * This script defines the FantasyDate class, which stores date information.
 * Created on 2/20/2021
 * @author Will 'QuirkySquid' Bohlen (@QuirkySquid#1059)
 */
class FantasyDate {
    /**
     * Generates a new FantasyDate object.
     * @param {} year Defaults to 0. Can be negative.
     * @param {*} month Defaults to 1. Ranges from 1-13.
     * @param {*} day Defaults to 1. Range depends on month.
     * @throws Exception when month/day is out of range.
     */
    constructor(year=0, month=1, day=1) {
        this.year = year;
        if (month > 13) throw 'Invalid month: ' + month;
        this.month = month;
        if (day > month_lengths[month-1]) throw 'Invalid day: ' + day;
        this.day = day;
    }

    /**
     * @returns a copy of this FantasyDate object.
     */
    clone() {
        return new FantasyDate(this.year, this.month, this.day);
    }

    /**
     * @returns a string representation of this FantasyDate object.
     */
    toString() {
        return this.day + " " + month_names[this.month - 1] + 
        ", " + this.year + " YD";
    }

    /**
     * Compares this date to another date.
     * @param {} otherDate The other date to compare.
     * @returns whether or not the two dates are equal.
     */
    equals(otherDate) {
        return this.day == otherDate.day && this.month == otherDate.month && this.year == otherDate.year;
    }

    /**
     * Calculates how many days have passed since a given date.
     * @param {*} otherDate The other date to compare.
     * @returns how many days have passed since otherDate. Negative numbers are in the future.
     */
    daysSince(otherDate) {
        let days = 0;
        days += (this.year - otherDate.year) * days_per_year;

        days += this.daysSinceNewYear() - otherDate.daysSinceNewYear();

        return days;
    }

    /**
     * @returns how many days have passed between the first day of the year and the current date.
     */
    daysSinceNewYear() {
        let days = 0;
        for (let i = 1; i < this.month; i++) {
            days += month_lengths[i - 1];
        }
        days += this.day - 1;

        return days;
    }

    /**
     * @returns a string representation of the current month/year.
     */
    getMonth() {
        return month_names[this.month - 1] + 
            ", " + this.year + " YD";
    }

    /**
     * Moves this date forward in time.
     * @param {*} year How many years forward to move.
     * @param {*} month How many months forward to move.
     * @param {*} day How many days forward to move.
     */
    forward(year=0, month=0, day=0) {
        this.day += day;
        while (this.day > month_lengths[this.month-1]) {
            this.day -= month_lengths[this.month-1];
            this.month += 1;
        }
        this.month += month;
        while (this.month > 13) {

            this.month -= 13;
            this.year += 1;
        }
        this.year += year;
    }

    /**
     * Moves this date backward in time.
     * @param {*} year How many years back to move.
     * @param {*} month How many months back to move.
     * @param {*} day How many days back to move.
     */
    backward(year=0, month=0, day=0) {
        this.day -= day;
        while (this.day <= 0) {
            this.month -= 1;
            this.day += month_lengths[this.month-1];
        }
        this.month -= month;
        while (this.month <= 0) {
            this.month += 13;
            this.year -= 1;
        }
        this.year -= year;
    }
}