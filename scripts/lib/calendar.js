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

        this.currentDate = new FantasyDate(1378, 6, 17);
        this.viewDate = new FantasyDate(this.currentDate.year, this.currentDate.month);
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
            width: 500
        });
    }

    /**
     * Renders the calendar window.
     * @param {} force Add the rendered application to the DOM if it is not already present. If false, the Application will only be re-rendered if it is already present.
     * @param {*} options Additional rendering options which are applied to customize the way that the Application is rendered in the DOM.
     * @override based on the Application method from Foundry API
     */
    render(force, options) {
        console.log("hot diggity we makin a calendar");
        super.render(force, options);
    }

    /**
     * Passes information to the HTML side via Handlebars.
     * @override based on the Application method from Foundry API
     */
    getData() {
        const templateData = {
            dateString: this.viewDate.getMonth(),
            weekdays: weekdays,
            daysInMonth: this.getDays(this.viewDate.month)
        }
        return templateData;
    }

    /**
     * Activates the HTML listeners.
     * @param {*} html reference to the HTML file
     * @override based on the Application method from Foundry API
     */
    activateListeners(html) {
        const prev_month = '#prev-month';
        const next_month = '#next-month';

        html.find(prev_month).click(ev => {
            this.viewDate.backward(0, 1);
            this.render();
        });
        
        html.find(next_month).click(ev => {
            this.viewDate.forward(0, 1);
            this.render();
        });
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
            outList.push(`<div class="otherMonth">${prev}</div>`)
        }

        // Generate this month's days
        for (let i = 1; i <= month_lengths[this.viewDate.month - 1]; i++) {
            // Highlight the current day
            if (this.currentDate.equals(new FantasyDate(this.viewDate.year, this.viewDate.month, i))) 
                outList.push(`<div class="today">${i}</div>`);
            else outList.push(`<div>${i}</div>`);
        }

        // Generate the first few days of the next month to make the calendar all nice and rectangular
        let nextDays = (7 - ((weekday + month_lengths[this.viewDate.month - 1]) % 7)) % 7
        for (let i = 0; i < nextDays; i++) {
            let next = i + 1;
            outList.push(`<div class="otherMonth">${next}</div>`)
        }
        return outList;
    }
}