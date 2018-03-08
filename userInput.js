function getLine() {
    return new Promise((resolve, reject) => {
        process.stdin.setRawMode(false);
        process.stdin.once("data", data => {
            process.stdin.setRawMode(true);
            resolve(data.toString().trim());
        });
    });
}

exports.getLine = getLine;

exports.getLinePrompt = async function(prompt, validFunc) {
    let value;
    do {
        process.stdout.write(prompt);
        value = await getLine();
    } while (value == "" || (validFunc && !validFunc(value)));
    return value;
};