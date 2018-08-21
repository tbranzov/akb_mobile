import { Platform } from 'react-native';
import RNFetchBlob from 'react-native-fetch-blob'; // Production version

const serverIPaddr = 'http://93.152.172.53/';
const refreshTokenEndpoint = `${serverIPaddr}token`;
const typesEndpoint = `${serverIPaddr}types`;
const tagsEndpoint = `${serverIPaddr}tags/0`;
const featuresEndpoint = `${serverIPaddr}features`;
const loginURL = `${serverIPaddr}login`;

//const MainHTML = () => require('../../dist/index.html')
// Да се оправи с react-native-fetch-blob - абсолютния път
const filePathIndexHTML = require('../../dist/index.html');

const getHTMLSource = () => {
  const dirs = RNFetchBlob.fs.dirs;
  if (Platform.OS === 'ios') {
    //const filePath = { uri: `file://${dirs.DocumentDir}/dist/index.html}` };
    return filePathIndexHTML;
  }
  const filePath = { uri: 'file:///android_asset/web/index.html' };
  return filePath;
};

const MainHTML = getHTMLSource();

//- Автентикационни константи
const authStatusInProgress = 1;
//'Извършва се автентикация';
const authStatusSuccess = 2;
// 'Успешна автентикация';
const authStatusUnsuccess = 3;
//'Неуспешна автентикация';
const authStatusNoComm = 4;
//`${authStatusUnsuccess}': Не e налична свързаност с интернет'`;
const authStatusUnsuccessNoCred = 5;
//'Неуспешна автентикация - няма открити идентификатори записани локално';


export { serverIPaddr,
          refreshTokenEndpoint,
          typesEndpoint,
          tagsEndpoint,
          featuresEndpoint,
          MainHTML,
          loginURL,
          authStatusNoComm,
          authStatusSuccess,
          authStatusUnsuccess,
          authStatusInProgress,
          authStatusUnsuccessNoCred,
         };
