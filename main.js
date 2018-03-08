const { areSameDay, offsetDate, formatDate } = require("./dateUtil");

const chalk = require("chalk").default; chalk.level = 1; // chalk.Level.Basic
const readline = require("readline");
const opn = require("opn");
function clearScreen() {
    process.stdout.write("\x1B[2J\x1B[0f")
}

let schedule;
require("./daily_order").getSchedule(false).then(sch => {
    schedule = sch;
}).then(startMain);

const classes = require("./classes");

let weekCursor = 0;
let weekDate = new Date();
let week;
let homework = [], homeworkCount = 0;
let homeworkCursor = 0, curAsmt;

let curMode = mode_week;
async function startMain() {
    week = getWeek(weekDate, true);
    printWeek();
    
    let working = false;
    process.stdin.on("data", async data => {
        if (working) return;
        working = true;
        try {
            data = data.toString();
            const map = {
                "\003":"q","\004":"q","\033":"q", // ^C, ^D, Esc
                "\033[D":"left","\033[C":"right","\033[A":"up","\033[B":"down", // left, right, up, down
                "\r":"enter","\n":"enter", // enter
            };
            await curMode(map[data] || data);
        } catch (e) {
            console.error(e);
        }
        working = false;
    });
    process.stdin.setRawMode(true);
}

async function mode_week(input) {
    if (input=="q") {
        console.log("Bye!\n");
        process.exit(0);
    } else if (input=="a") {
        console.log(chalk.cyanBright("Loading assignments..."));
        await classes.loadAssignments();
        classes.save();
        printWeek();
    } else if (input=="left") {
        weekDate = offsetDate(weekDate, -7);
        week = getWeek(weekDate);
        printWeek();
    } else if (input=="right") {
        weekDate = offsetDate(weekDate, +7);
        week = getWeek(weekDate);
        printWeek();
    } else if (input=="up") {
        if (weekCursor > 0) weekCursor--;
        printWeek();
    } else if (input=="down") {
        if (weekCursor < week.length-1) weekCursor++;
        printWeek();
    } else if (input=="enter") {
        curMode = mode_day;
        homeworkCursor = 0;
        printWeek();
    } else {
        console.log("input: ", JSON.stringify(input+""));
    }
    console.log();
}

async function mode_day(input) {
    if (input=="q" || input=="enter") {
        curMode = mode_week;
        printWeek();
    } else if (input=="left") {
        if (weekCursor > 0) weekCursor--;
        printWeek();
    } else if (input=="right") {
        if (weekCursor < week.length-1) weekCursor++;
        printWeek();
    } else if (input=="up") {
        if (homeworkCursor > 0) homeworkCursor--;
        printWeek();
    } else if (input=="down") {
        if (homeworkCursor < homeworkCount-1) homeworkCursor++;
        printWeek();
    } else if (input=="o") {
        if (curAsmt) opn(curAsmt.url);
    } else {
        console.log("input: ", JSON.stringify(input+""));
    }
    console.log();
}

function printWeek() {
    clearScreen();
    console.log(chalk.cyanBright("\n          === Week ===\n"));
    const tomorrow = offsetDate(new Date(), 1);
    homework = [];
    for (let i = 0; i < week.length; i++) {
        const day = week[i];
        let dateStr = " "+formatDate(day)+": ";
        let dateStrLen = dateStr.length;
        dateStr = (day >= tomorrow? chalk.bgGreen : chalk.bgRed)(dateStr);
        let hw = [];
        let orderStr = schedule[+day].list.map(per => {
            if (classes[per]) {
                const cls = classes[per];
                const asmts = cls.getHWDue(day);
                if (asmts.length) hw.push([cls, asmts]);
                return asmts.length? chalk.greenBright(per) : chalk.gray(per);
            } else {
                return chalk.magentaBright(per);
            }
        }).join(" ");
        if (i==weekCursor) homework = hw;
        const prefix = i==weekCursor? (curMode==mode_day?chalk.gray:chalk.cyanBright)(" >") : "  ";
        console.log(prefix+dateStr+" ".repeat(16 - dateStrLen)+orderStr+"\n");
    }
    
    let i = 0;
    for (const [cls, asmts] of homework) {
        console.log(chalk.magentaBright("-- "+cls.name+" --"));
        for (const asmt of asmts) {
            if (curMode == mode_day && i == homeworkCursor) {
                console.log("    "+chalk.cyanBright(asmt.name));
                console.log("        "+asmt.desc.replace(/\n/g,"\n        "));
                curAsmt = asmt;
            } else {
                console.log("    "+asmt.name);
            }
            i++;
        }
        console.log();
    }
    homeworkCount = i;
}

function getWeek(date = new Date(), setCursor) {
    let offset = 1 - date.getDay();
    if (offset == 1-6) offset += 7;
    
    let day = offsetDate(date, offset);
    let count = 0;
    while (schedule[+day] === undefined) {
        day = offsetDate(day, 1);
        if (++count == 5) return [];
    }
    let week = [];
    do {
        week.push(day);
        day = offsetDate(day, 1);
    } while (schedule[+day] !== undefined);
    if (setCursor) {
        for (let i = 0; i < week.length; i++) {
            if (areSameDay(week[i], date)) {
                weekCursor = i+1;
                break;
            }
        }
    }
    return week;
}