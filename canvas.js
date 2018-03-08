const internet = require("./internet");

const auth_token = require("fs").readFileSync("auth_token");

exports.get = async function(endpoint, params) {
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