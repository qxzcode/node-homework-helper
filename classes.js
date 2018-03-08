const fs = require("fs");
const { areSameDay } = require("./dateUtil");
const htmlParser = require("./htmlParser");
const canvas = require("./canvas");

const FILE = "classes.json";
const classes = JSON.parse(fs.readFileSync(FILE), (key, value) => {
    return key === "due_at"? new Date(value) : value;
});

// add methods
for (const per in classes) {
    const c = classes[per];
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
classes.save = function() {
    fs.writeFileSync(FILE, JSON.stringify(classes, null, 4));
    console.log("Classes saved");
};
classes.loadAssignments = async function() {
    let promises = [];
    for (const per in classes) {
        const c = classes[per];
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
};
classes.loadCourses = async function() {
    const json = await canvas.get("courses", {per_page:9999});
    
};

module.exports = classes;