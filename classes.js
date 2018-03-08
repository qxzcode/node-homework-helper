const fs = require("fs");
const chalk = require("chalk").default;
const { areSameDay } = require("./util");
const { getLinePrompt } = require("./userInput");
const htmlParser = require("./htmlParser");
const canvas = require("./canvas");

const FILE = "classes.json";

const classes = {
    classes: null,
    save() {
        fs.writeFileSync(FILE, JSON.stringify(classes.classes, null, 4));
        console.log("Classes saved");
    },
    async load() {
        console.log("Loading courses");
        
        let areNew = false;
        const list = classes.classes = await new Promise((resolve, reject) => {
            fs.readFile(FILE, async (err, data) => {
                if (err) {
                    if (err.code == "ENOENT") {
                        const json = await canvas.get("courses", {per_page:9999, enrollment_state:"active"});
                        // fs.writeFileSync("toast.json", JSON.stringify(json, null, 4));
                        console.log(chalk`\n{cyanBright Now it's time to set up your courses.}`);
                        let obj = {};
                        for (const c of json) {
                            console.log(chalk`\nWould you like to include the course {bold ${c.name}}?`);
                            const include = await getLinePrompt(chalk` {cyanBright (y/n)>} `, s => s=="y"||s=="n");
                            if (include == "n") continue;
                            console.log(chalk`What would you like to call it?`);
                            const name = await getLinePrompt(chalk` {cyanBright >} `);
                            console.log(chalk`What period do you have {bold ${name}}?`);
                            const per = await getLinePrompt(chalk` {cyanBright (number)>} `, s => !isNaN(+s)&&!obj[s]);
                            obj[per] = {
                                name,
                                canvasID: c.id,
                                assignments: []
                            };
                            console.log(chalk` -> Period {bold ${per}}: {bold ${name}}`);
                        }
                        console.log(chalk`\n{cyanBright That's all your courses!}`);
                        areNew = true;
                        setTimeout(() => resolve(obj), 2000);
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(JSON.parse(data, (key, value) => {
                        return key === "due_at"? new Date(value) : value;
                    }));
                }
            });
        });
        if (areNew) classes.save();
        
        // add methods
        for (const per in list) {
            const c = list[per];
            c.getHWDue = function(date) {
                let list = [];
                for (const a of c.assignments) {
                    if (areSameDay(a.due_at, date)) {
                        list.push(a);
                    }
                }
                return list;
            };
        }
    },
    async loadAssignments() {
        let promises = [];
        for (const per in classes.classes) {
            const c = classes.classes[per];
            if (c.canvasID) {
                promises.push(canvas.get("courses/"+c.canvasID+"/assignments", {per_page:9999}).then(json => {
                    // fs.writeFileSync("toast.json", JSON.stringify(json, null, 4));
                    console.log("Loaded "+json.length+" assignments for "+c.name);
                    
                    let assignments = [];
                    for (const a of json) {
                        let desc = (a.description || "").trim();
                        if (desc == "") desc = "<none>No description</none>";
                        desc = htmlParser.parse(desc);
                        assignments.push({
                            id: a.id,
                            name: a.name,
                            desc,
                            due_at: new Date(a.due_at),
                            points: a.points_possible,
                            url: a.html_url,
                            submission_types: a.submission_types,
                            is_quiz: a.is_quiz_assignment
                        });
                    }
                    assignments.sort((a, b) => a.due_at - b.due_at);
                    c.assignments = assignments;
                    
                    // fs.writeFileSync("toast_proc.json", JSON.stringify(assignments, null, 4));
                }));
            }
        }
        await Promise.all(promises);
    }
};

module.exports = classes;