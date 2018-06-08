// import RNFetchBlob from 'react-native-fetch-blob'; // Production version

const serverIPaddr = 'http://93.152.172.53:8080/';
const refreshTokenEndpoint = `${serverIPaddr}token`;
const typesEndpoint = `${serverIPaddr}types`;
const tagsEndpoint = `${serverIPaddr}tags/0`;
const featuresEndpoint = `${serverIPaddr}features`;
const loginURL = `${serverIPaddr}login`;

//const dirs = RNFetchBlob.fs.dirs; // Production version
//const MainHTML = { uri: `file:///${RNFetchBlob.fs.dirs.DocumentDir}/dist/index.html` }; // Production version

const MainHTML = { uri: 'file:///Users/tbranzov/workspace/ReactNativeProjects/akb_wireframe/dist/index.html' };
// Да се оправи с react-native-fetch-blob - абсолютния път


export { serverIPaddr,
          refreshTokenEndpoint,
          typesEndpoint,
          tagsEndpoint,
          featuresEndpoint,
          MainHTML,
          loginURL };
