const fs = require("fs");
const internet = require("./internet");

const DAILY_ORDER_URL = "http://www.bcp.org/_infrastructure/ICalendarHandler.ashx?Tokens=861526";
const DAILY_ORDER_FILE = "daily_order.ics";

exports.getSchedule = function(online) {
    return new Promise((resolve, reject) => {
        if (online) fromOnline();
        else        readSaved();
        
        function fromOnline() {
            console.log("Fetching online daily order...");
            internet.get(DAILY_ORDER_URL).then(body => {
                console.log("Got data; saving to file...");
                fs.writeFile(DAILY_ORDER_FILE, body, err => {
                    if (err) console.error("Failed:", err.message);
                    resolve(body);
                });
            }).catch(err => {
                console.error("Failed:", err.message);
                readSaved();
            });
        }
        
        function readSaved() {
            console.log("Reading saved daily order...");
            fs.readFile(DAILY_ORDER_FILE, (err, body) => {
                if (err) {
                    console.error("Failed:", err.message);
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        }
    }).then(body => {
        return parseDailyOrder(body);
    });
};

function parseDailyOrder(body) {
    console.log("Parsing...");
    
    let schedule = {};
    
    const regex = /BEGIN:VEVENT([\s\S]+?)END:VEVENT/g;
    let m;
    while (m = regex.exec(body)) {
        const event = m[1];
        
        const summary = /^SUMMARY:(.+?)$/m.exec(event)[1];
        const dateParts = /^DTSTART(?:;VALUE=DATE)?:(\d{4})(\d{2})(\d{2})(?:T\w+?)?$/m.exec(event);
        const date = new Date(dateParts[1], dateParts[2]-1, dateParts[3]);
        
        const summParts = summary.split("-");
        if (summParts.length < 2 || !summParts.every(str => /^[0-9A-Z]/.test(str)))
            continue;
        const periodMap = summParts.reduce((obj, str, i) => {
            obj[str] = i;
            return obj;
        }, {});
        
        // console.log(periods);
        // console.log(date.toDateString());
        schedule[+date] = {
            list: summParts.map(s => +s || s),
            map: periodMap
        };
    }
    
    console.log("Done");
    return schedule;
}