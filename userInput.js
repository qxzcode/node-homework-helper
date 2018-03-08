function getLine() {
    return new Promise((resolve, reject) => {
        process.stdin.once("data", data => {
            resolve(data.toString().trim());
        });
    });
}

exports.getLine = getLine;

exports.getLinePrompt = async function(prompt, validFunc) {
    let value;
    do {
        process.stdout.write(chalk`    {cyanBright Token:} `);
        value = await getLine();
    } while (x == "" || (validFunc && !validFunc(value)));
};