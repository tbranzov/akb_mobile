//import RNFetchBlob from 'react-native-fetch-blob'; // Production version

const serverIPaddr = 'http://93.152.172.53/';
const refreshTokenEndpoint = `${serverIPaddr}token`;
const typesEndpoint = `${serverIPaddr}types`;
const tagsEndpoint = `${serverIPaddr}tags/0`;
const featuresEndpoint = `${serverIPaddr}features`;
const loginURL = `${serverIPaddr}login`;

//const dirs = RNFetchBlob.fs.dirs; // Production version
//const MainHTML = { uri: `file:///${dirs.DocumentDir}/dist/index.html` }; // Production version

const MainHTML = { uri: 'file:///Users/tbranzov/workspace/ReactNativeProjects/akb_wireframe/dist/index.html' };
// Да се оправи с react-native-fetch-blob - абсолютния път

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
