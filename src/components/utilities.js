import React from 'react';
import { StyleSheet, Text } from 'react-native';

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
 const dd = twoDigitsFormat(date.getDate());
 const mm = twoDigitsFormat(date.getMonth() + 1);
 const yyyy = date.getFullYear().toString();
 const formattedDate = `${yyyy}-${mm}-${dd}`;
 return (formattedDate);
}

function getPointTypes(realm) {
    const pointTypes = [];
    const versions = realm.objects('AKBdbVersions')[0];
    const dbVerIndex = versions.dbVersions.length - 1;
    //Active db version is always the last synchronized version
    const dbVerAKB = versions.dbVersions[dbVerIndex];
    const typesJSON = JSON.parse(dbVerAKB.types.strJSON);
    for (let i = 0; i < typesJSON.length; i++) {
        if (typesJSON[i].classification.name === 'Point') {
            pointTypes.push({
                id: typesJSON[i].id,
                label: typesJSON[i].label
            });
            //console.log(pointTypes);
        }
    }
    return pointTypes;
}

/* eslint-disable react/prop-types */
const Strong = ({ children, ...props }) =>
   <Text style={styles.bold} {...props}>{children}</Text>
/* eslint-enable */

const styles = StyleSheet.create({
 bold: {
   fontWeight: 'bold',
    color: 'black',
 },
});

export { isEmpty,
          getType,
          getFormattedDate,
          getPointTypes,
          Strong
       };
