import Realm from 'realm';

//Object - container
const UserCredentialsSchema = {
    name: 'UserCredentials',
    properties: {
        userName: 'string',
        rt: 'string',
        t: 'string',
    }
};

//Object - type
const AKBTypesSchema = {
    name: 'AKBTypes',
    properties: {
        strJSON: 'string', // Stringified JSON-object
    }
};

//Object - type
const AKBTagsSchema = {
    name: 'AKBTags',
    properties: {
        strJSON: 'string', // Stringified JSON-object
    }
};

//Object - type
const AKBPointSchema = {
    name: 'AKBPoint',
    properties: {
        id: 'int', // id of the point type, from AKBTypes
        strJSON: 'string', // Stringified JSON-object of point metadata
    }
};

//Object - type
const AKBdbSchema = {
    name: 'AKBdb',
    //primaryKey: 'version',
    properties: {
        version: 'string',
        types: 'AKBTypes',
        tags: 'AKBTags',
        points: 'AKBPoint[]',
        editablePoints: 'int[]',
        //Array with IDs of editable points.
        // Must contain at least [18,19] (18 = Leader checkpoint, 19 = checkpoint)
        optTags: 'string',
        //stringified JSON-object
        //(Array of objects {"id": tagcode,"values": name + code} for fields of type 'select'.
        //Fields from points with IDs in editablePoints only.)
    }
};

//Object - container
const AKBdbVersionsSchema = {
    name: 'AKBdbVersions',
    properties: {
        dbVersions: 'AKBdb[]',
    }
};

//Object - container
const FeaturesSchema = {
    name: 'Features',
    properties: {
        data: 'string', // Stringified JSON-object
    }
};

//Object - type
const GeolocationSchema = {
    name: 'Geolocation',
    properties: {
        coordinates: 'double[]',
        accuracy: 'double',
    }
};

//Object - type
const TrackSchema = {
    name: 'Track',
    properties: {
        trackName: 'string',
        trackDate: 'date',
        geoLocations: 'Geolocation[]',
    }
};

//Object - type
const CheckPointSchema = {
    name: 'CheckPoint',
    properties: {
        type: 'int', //18 -> Leader checkpoint, 19 -> checkpoint
        date: 'date', //Full date and time of checkpoint creation
        geoLocation: 'Geolocation',
        data: 'string',  // Stringified JSON-object to ensure different form structure
    }
};

//Object - container
//Remark: Expedition == Теренно издирване
const ExpeditionSchema = {
    name: 'Expedition',
    primaryKey: 'id',
    properties: {
        id: 'int',
        expeditionName: 'string',
        leaderName: { type: 'string', optional: true },
        startDate: { type: 'date', optional: true },
        days: { type: 'int', optional: true },   //The count of expedition days
        regionDescription: { type: 'string', optional: true },
        regionCoordinates: 'string',
        //Stringified JSON-object in form [[x1,y1],[x2,y2],[x3,y3],[x4,y4],[x1,y1]]
        regionZoom: 'double',
        regionFeatures: 'string',
        // Stringified JSON-object of all features in area defined by regionCoordinates
        dbVersionIndexAKB: 'int',
        sinchronized: 'bool', // Are expedition data sinchronized with (sent to) AKB-GIS-database
        tracks: 'Track[]',
        checkPoints: 'CheckPoint[]',
    }
};

const NewExpeditionID = () => {
  const expeditions = realm.objects('Expedition');
  const lastExpedition = expeditions.sorted('id', true)[0];
    if (lastExpedition === undefined) {
      return 1;
    }
      return lastExpedition.id + 1;
};

const realm = new Realm(
    {
        path: 'akb_mobile.realm',
        readOnly: false,
        schema: [UserCredentialsSchema, AKBTypesSchema, AKBTagsSchema, AKBPointSchema,
                  AKBdbSchema, AKBdbVersionsSchema, GeolocationSchema, TrackSchema,
                  CheckPointSchema, ExpeditionSchema],
        schemaVersion: 1,
        deleteRealmIfMigrationNeeded: true,
    });

export { realm,
          NewExpeditionID,
          ExpeditionSchema,
          CheckPointSchema,
          TrackSchema,
          GeolocationSchema,
          FeaturesSchema,
          AKBdbVersionsSchema,
          AKBdbSchema,
          AKBPointSchema,
          AKBTagsSchema,
          AKBTypesSchema,
          UserCredentialsSchema };
