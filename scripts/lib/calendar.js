/**
 * This script defines the main calendar window and its behaviors.
 * Created on 2/20/21.
 * @author Will 'QuirkySquid' Bohlen (@QuirkySquid#1059)
 */
class Calendar extends Application {
    
    /**
     * No-arg constructor creates a new Calendar object and defines the initial dates.
     */
    constructor() {
        super();

        this.currentDate = new FantasyDate(1318, 1, 1);
        this.weatherDate = this.currentDate.clone();
        this.viewDate = new FantasyDate(this.currentDate.year, this.currentDate.month);
        this.jsonDirectory = "/worlds/" + game.data.world.name + "/data";
        this.readJSON();
    }

    /**
     * Sets the default options of the calendar window.
     * @override based on the Application method from Foundry API
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            title: "Cothronas Calendar",
            id: "cothronas-calendar",
            template: "modules/cothronas-calendar/templates/calendar.html",
            popOut: true,
            width: 500,
            height: 750
        });
    }

    /**
     * Renders the calendar window.
     * @param {} force Add the rendered application to the DOM if it is not already present. If false, the Application will only be re-rendered if it is already present.
     * @param {*} options Additional rendering options which are applied to customize the way that the Application is rendered in the DOM.
     * @override based on the Application method from Foundry API
     */
    render(force, options) {
        super.render(force, options);
    }

    /**
     * Passes information to the HTML side via Handlebars.
     * @override based on the Application method from Foundry API
     */
    getData() {
        this.currentNotes = this.notes;
        const templateData = {
            monthString: this.viewDate.getMonth(),
            weekdays: weekdays,
            daysInMonth: this.getDays(this.viewDate.month),
            riseSetTimes: this.calculateRiseSetTimes(this.weatherDate),
            selectedDate: this.weatherDate.toString(),
            notes: this.notes
        }
        return templateData;
    }

    readJSON() {
        fetch(this.jsonDirectory + "/calendardata.json").then(data => {
            if (data.status == 404) {
                data = JSON.parse('{\"dates\":{}}');
                this.writeJSON(data);
                return data;
            } 
            return data.json();
        })
        .then(json => {
            this.userdata = json;
            if (json["dates"][this.weatherDate]) {
                if (json["dates"][this.weatherDate]["notes"]) {
                    this.notes = new Handlebars.SafeString(json["dates"][this.weatherDate]["notes"]);
                }
            }
            else {
                this.notes = "";
            }

            if (Handlebars.Utils.escapeExpression(this.currentNotes) != Handlebars.Utils.escapeExpression(this.notes))
                this.render();
        });
    }

    writeJSON(data) {
        const file = new File([JSON.stringify(data, null, 4)], "calendardata.json", {type: 'application/json'});
        FilePicker.upload("data", this.jsonDirectory, file)
    }

    /**
     * Activates the HTML listeners.
     * @param {*} html reference to the HTML file
     * @override based on the Application method from Foundry API
     */
    activateListeners(html) {
        const prev_month = '#prev-month';
        const next_month = '#next-month';
        const cal_space = '.cal-space';
        const date_input = '#date-input';
        const input_prompt = "Enter date:";
        const notebox = "#notebox";

        // Previous month button
        html.find(prev_month).click(ev => {
            this.viewDate.backward(0, 1);
            this.render();
        });

        // Previous month button
        html.find(next_month).click(ev => {
            this.viewDate.forward(0, 1);
            this.render();
        });

        // Selecting dates in calendar
        html.find(cal_space).click(ev => {
            this.weatherDate = new FantasyDate(this.viewDate.year, this.viewDate.month, Number(ev.target.innerHTML));
            if (ev.target.outerHTML.search('prev') != -1) this.weatherDate.backward(0, 1);
            if (ev.target.outerHTML.search('next') != -1) this.weatherDate.forward(0, 1);
            this.render();
            this.updateMoon(this.weatherDate);
        });

        // When the date field is selected, replace the text with the prompt
        html.find(date_input).focus(ev => {
            ev.target.innerHTML = input_prompt;
        });

        // If the enter key is pressed in the date field, deselect it.
        // Otherwise if the input prompt is still there when user starts typing, clear it.
        html.find(date_input).keypress(ev => {
            if (ev.key == "Enter") {
                ev.target.blur();
            }
            else if (ev.target.innerHTML == input_prompt) ev.target.innerHTML = "";
        });

        // When the field is deselected, update the date.
        html.find(date_input).blur(ev => {
            this.parseDate(ev.target.innerHTML);
            ev.target.innerHTML = this.weatherDate.toString();
        });

        html.find(notebox).blur(ev => {
            if (this.userdata) {
                let stripped = ev.target.innerHTML.replace(/\s|(<\/?div>)|(<br>)/g, "")
                console.log(stripped);
                if (stripped != "") {
                    if (!this.userdata["dates"][this.weatherDate])
                        this.userdata["dates"][this.weatherDate] = {}; 
                    this.userdata["dates"][this.weatherDate]["notes"] = ev.target.innerHTML;
                }
                else delete this.userdata["dates"][this.weatherDate];
                this.writeJSON(this.userdata);
            }
        });

        // Update the moon phases after loading
        this.updateMoon(this.weatherDate);
        this.readJSON();
    }

    /**
     * Helper method which generates a list of days which is passed to the HTML file.
     * @returns a list of divs corresponding to days of the month
     */
    getDays() {
        let outList = [];

        // Generate the last few days of the previous month to correctly offset the weekdays
        let weekday = (this.viewDate.daysSince(new FantasyDate()) + 3) % 7; // 1 Naeril, 0 YD was an Aesdin
        if (weekday < 0) weekday += 7;
        for (let i = 0; i < weekday; i++) {
            let prev = (this.viewDate.month > 1 ? month_lengths[this.viewDate.month - 2] : month_lengths[12]) - weekday + i + 1;
            // Check if a date in a previous month is selected
            let targetDate = new FantasyDate(this.viewDate.year, this.viewDate.month, prev, true);
            targetDate.backward(0, 1);
            if (this.weatherDate.equals(targetDate)) 
                outList.push(`<div class="cal-space prev selected">${prev}</div>`);
            else 
                outList.push(`<div class="cal-space prev">${prev}</div>`)
        }

        // Generate this month's days
        for (let i = 1; i <= month_lengths[this.viewDate.month - 1]; i++) {
            // Highlight the current and selected days
            if (this.weatherDate.equals(new FantasyDate(this.viewDate.year, this.viewDate.month, i))) 
                outList.push(`<div class="cal-space selected">${i}</div>`);
            else if (this.currentDate.equals(new FantasyDate(this.viewDate.year, this.viewDate.month, i))) 
                outList.push(`<div class="cal-space today">${i}</div>`);
            else if (this.userdata) {
                if (this.userdata["dates"].hasOwnProperty((new FantasyDate(this.viewDate.year, this.viewDate.month, i)).toString())) {
                    outList.push(`<div class="cal-space hasNotes">${i}</div>`);
                }
                else outList.push(`<div class=cal-space>${i}</div>`);
            }
            else outList.push(`<div class=cal-space>${i}</div>`);
        }

        // Generate the first few days of the next month to make the calendar all nice and rectangular
        let nextDays = (7 - ((weekday + month_lengths[this.viewDate.month - 1]) % 7)) % 7
        // Check if a date in a future month is selected
        let targetDate = new FantasyDate(this.viewDate.year, this.viewDate.month, 1);
        targetDate.forward(0, 1);
        for (let i = 0; i < nextDays; i++) {
            let next = i + 1;
            if (this.weatherDate.equals(targetDate)) 
                outList.push(`<div class="cal-space next selected">${next}</div>`);
            else
                outList.push(`<div class="cal-space next">${next}</div>`);
            targetDate.forward(0, 0, 1);
        }

        return outList;
    }

    /**
     * Updates the moon phases based on the given date.
     * @param {} phaseDate the date to generate phases for.
     */
    updateMoon(phaseDate) {
        const salDisk = document.getElementById("sal-disk");
        const salMask = document.getElementById("sal-mask");
        const volDisk = document.getElementById("vol-disk");
        const volMask = document.getElementById("vol-mask");

        // Salos' phase
        let salSettings = this.calculateSalosPhase(phaseDate);
        salMask.style.background = salSettings.maskColor;
        salMask.style.transform = `rotateY(${salSettings.maskY}deg)`;
        salDisk.style.transform = `rotateZ(${salSettings.diskZ}deg)`;

        
        // Vol's phase
        let volSettings = this.calculateVolPhase(phaseDate);
        volMask.style.opacity = volSettings.maskOpacity;
        volMask.style.transform = `rotateY(${volSettings.maskY}deg)`;
        volDisk.style.transform = `rotateZ(${volSettings.diskZ}deg)`;
        volDisk.style.webkitMaskImage = `radial-gradient(ellipse ${volSettings.ellipseWidth}% 100% at 50% 50%, #fff0 50%, #fff 50%)`;
        volDisk.style.maskImage = `radial-gradient(ellipse ${volSettings.ellipseWidth}% 100% at 50% 50%, #fff0 50%, #fff 50%)`;
    }

    /**
     * Calculate Salos' phase based on the given date. 
     * @param {*} phaseDate the date to generate a phase for.
     * @returns an object with the settings to pass to the css.
     */
    calculateSalosPhase(phaseDate) {
        // 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = third quarter 
        let salosPhase = ((phaseDate.daysSince(new FantasyDate()) / 16) + 0.25) % 1;

        let salosOutput = {maskColor: '#000', maskY: 0, diskZ: 180};

        salosOutput.maskColor = salosPhase >= 0.25 && salosPhase <= 0.75 ? '#ffc' : '#000';
        salosOutput.maskY = salosPhase * 360;
        salosOutput.diskZ = salosPhase >= 0.5 ? 180 : 0;
        return salosOutput;
    }

    /**
     * Calculate Vol's phase based on the given date. 
     * @param {*} phaseDate the date to generate a phase for.
     * @returns an object with the settings to pass to the css.
     */
    calculateVolPhase(phaseDate) {
        // Salos's phase has a period of 16 days, and Vol's phase completes one additional rotation per year.
        let volOffset = phaseDate.daysSinceNewYear() / 365;
        // 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = third quarter 
        let volPhase = ((phaseDate.daysSince(new FantasyDate()) / 16) + 0.25 + volOffset) % 1;

        let volOutput = {maskOpacity: 0, maskY:0, diskZ: 180, ellipseWidth: 100};

        volOutput.maskOpacity = volPhase >= 0.25 && volPhase <= 0.75 ? 1 : 0;
        volOutput.maskY = volPhase * 360;
        volOutput.diskZ = volPhase >= 0.5 ? 180 : 0;
        volOutput.ellipseWidth = volPhase >= 0.25 && volPhase <= 0.75 ? 0 : Math.sin((volPhase + 0.25) * Math.PI * 2) * 100;

        return volOutput;
    }

    /**
     * Caclulates the times that the celestial bodies rise and set on a given date.
     * @param {*} selectedDate the date to generate times for.
     * @returns an object containing strings with the times each body rises and sets.
     */
    calculateRiseSetTimes(selectedDate) {
        let outputTimes = {salosRise: 7/24, volRise: 7/24, dayLength: 0.5, gheaRise: 0, gheaLength: 0.5};

        let yearFloat = selectedDate.daysSinceNewYear() / 365;
        outputTimes.dayLength = ((Math.cos((selectedDate.daysSinceNewYear() * Math.PI)/365) * 1/12) * -1) + 0.5;
        outputTimes.gheaLength = ((Math.cos(((selectedDate.daysSince(new FantasyDate()) % 182) * Math.PI)/182) * 1/12) * -1) + 0.5;
        outputTimes.salosRise = 13/24 - (outputTimes.dayLength / 2);
        outputTimes.volRise = (outputTimes.salosRise + yearFloat) % 1;
        outputTimes.gheaRise = (yearFloat * 13) % 1;

        let outputStrings = {
            salosRise: this.timeString(outputTimes.salosRise), 
            salosSet: this.timeString((outputTimes.salosRise + outputTimes.dayLength) % 1),
            volRise: this.timeString(outputTimes.volRise), 
            volSet: this.timeString((outputTimes.volRise + outputTimes.dayLength) % 1),
            gheaRise: this.timeString(outputTimes.gheaRise),
            gheaSet: this.timeString((outputTimes.gheaRise + outputTimes.gheaLength) % 1)
        }
        return outputStrings;
    }

    /**
     * Converts a time expressed in a float to a string representation in 12 hour format
     * @param {} timeFloat the time to convert, ranging from 0.0 to 1.0. 
     * @returns a string in 12 hour format e.g. '12:00 PM'
     */
    timeString(timeFloat) {
        let minutes = Math.round(1440 * timeFloat);
        let hours = Math.floor(minutes / 60);
        minutes = minutes % 60;
        let minuteString = minutes < 10 ? "0" + String(minutes) : String(minutes);

        let suffix = hours < 12 ? "AM" : "PM";
        hours = hours > 12 || hours == 0 ? Math.abs(hours - 12) : hours;

        return `${hours}:${minuteString} ${suffix}`;
    }

    /**
     * Converts a string date into a FantasyDate object and passes it to viewDate and weatherDate.
     * @param {} text the string representation of the date.
     */
    parseDate(text) {
        // Catches strings of digits and strings of letters
        const reTerms = /[-\d]+|[^\W\d]+/g;

        let outDate = { day: null, month: null, year: null };
        let terms = text.match(reTerms);
        let monthIndex = -1;

        // Only iterate if we had at least one match
        if (reTerms != null) {
            // First loop checks for months written out in text
            for (let i = 0; i < terms.length; i++) {
                let term = terms[i];
                let isMonth = false;
                // Check for month names
                for (const month of month_names) {
                    // Remove accents from letters
                    let normMonth = month.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (term.toLowerCase() == normMonth.toLowerCase()) {
                        monthIndex = i;
                        isMonth = true;
                        outDate.month = month_names.indexOf(month) + 1;
                    }
                }
                // If the text isn't a month, remove it from the array
                if (!isMonth && isNaN(term)) {
                    terms.splice(i, 1);
                    i -= 1;
                }
            }
            // If there are more than three terms, reject the string
            if (terms.length <= 3) {
                // Second loop assigns numbers to day/month/year
                for (let i = 0; i < terms.length; i++) {
                    let term = terms[i];
                    // Ignore the text month
                    if (i != monthIndex) {
                        // Set day if it is either before the month string, or the first term of several
                        if ((i < monthIndex) ||
                            (i == 0 && terms.length > 1)) outDate.day = term;
                        // Set month if there is no text month, and it is the second term
                        else if (monthIndex == -1 && i == 1) {
                            outDate.month = term;
                            monthIndex = i;
                        }
                        // Set year if it is immediately after the month
                        else if (i == monthIndex + 1) outDate.year = term;
                    }
                }
            }
        }

        // Default unset values to current values
        if (outDate.day == null) outDate.day = this.weatherDate.day;
        if (outDate.month == null) outDate.month = this.weatherDate.month;
        if (outDate.year == null) outDate.year = this.weatherDate.year;

        // Validate that the date is valid, and if so update weatherDate and viewDate
        try {
            let newDate = new FantasyDate(outDate.year, outDate.month, outDate.day);
            this.weatherDate = newDate.clone();
            this.viewDate.month = newDate.month;
            this.viewDate.year = newDate.year;
        } catch (error) {
            // invalid date, nothing happens
        }
        finally {
            // Rerender the calendar
            this.render();
        }
    }
}