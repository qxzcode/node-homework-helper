const internet = require("./internet");
const { clearScreen } = require("./util");
const { getLinePrompt } = require("./userInput");
const chalk = require("chalk").default;
const fs = require("fs");

let auth_token = null;

async function checkAuth() {
    if (auth_token == null) {
        try {
            auth_token = fs.readFileSync("auth_token");
        } catch (err) {
            if (err.code == "ENOENT") {
                await setupAuth();
            } else throw err;
        }
    }
}

async function setupAuth() {
    clearScreen();
    console.log(chalk`\n\n{cyanBright Looks like this is your first time here.}\n`);
    console.log(chalk`To connect to Canvas, you'll have to get an {bold authorization token}.\n`);
    console.log(chalk`    1.  On the Canvas site, go to {bold Account} -> {bold Settings}`);
    console.log(chalk`    2.  Scroll down to the {bold Approved Integrations} section`);
    console.log(chalk`    3.  Click the {bold New Access Token} button`);
    console.log(chalk`    4.  Enter a {bold purpose} (e.g. "homework helper"), then click {bold Generate Token}`);
    console.log(chalk`    5.  Copy the token and {bold paste it here:}\n`);
    auth_token = await getLinePrompt(chalk`    {cyanBright Token:} `);
    fs.writeFileSync("auth_token", auth_token);
    console.log(chalk`\nIf you need to change the token, edit the {bold auth_token} file.\n`);
}

exports.get = async function(endpoint, params) {
    await checkAuth();
    let url = "https://bcp.instructure.com/api/v1/"+endpoint;
    if (params) {
        url += "?";
        let first = true;
        for (const key in params) {
            if (!first) url += "&";
            first = false;
            url += key+"="+params[key];
        }
    }
    const body = await internet.get(url, {
        Authorization: "Bearer "+auth_token
    });
    return JSON.parse(body);
};