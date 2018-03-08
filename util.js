exports.areSameDay = function(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
};

exports.offsetDate = function(date, offset) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
};

exports.formatDate = function(date) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    return weekdays[date.getDay()]+" "+months[date.getMonth()]+" "+date.getDate();
};

exports.clearScreen = function() {
    process.stdout.write("\033c");//("\x1B[2J\x1B[0f")
};

exports.wait = function(secs) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, secs*1000);
    });
};