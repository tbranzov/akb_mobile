function isEmpty(obj) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) return false;
    }
    return true;
}

function getType(obj) {
    if (obj && obj.constructor && obj.constructor.name) {
        return obj.constructor.name;
    }
    return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

function twoDigitsFormat(number) {
  return number < 10 ? '0' + number : '' + number; // ('' + number) for string result
}

function getFormattedDate(date) {
  const formattedDate =
    date.getFullYear().toString() + "-" +
    twoDigitsFormat(date.getMonth() + 1) + "-" +
    twoDigitsFormat(date.getDate());
  return (formattedDate);
}

export { isEmpty,
          getType,
          getFormattedDate
       };
