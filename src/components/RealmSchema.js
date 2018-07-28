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
        strJSON: 'string',
        // Stringified JSON-object of all types supported by AKB-GIS
    }
};

//Object - type
const AKBTagsSchema = {
    name: 'AKBTags',
    properties: {
        strJSON: 'string',
        // Stringified JSON-object
    }
};

//Object - type
const AKBPointSchema = {
    name: 'AKBPoint',
    properties: {
        id: 'int',
        // id of the point type, from AKBTypes
        strJSON: 'string',
        // Stringified JSON-object of point metadata
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
        //Must contain at least [18,19] (18 = Leader checkpoint, 19 = checkpoint),
        //but new conception is - all features of type "point"
        optTags: 'string',
        //stringified JSON-object
        //(Array of objects {"id": tagcode,"values": name} for fields of type 'select'.
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
        data: 'string',
        // Stringified JSON-object
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
        photos: 'string[]',
        //Array of paths to photos
        featureId: 'int',
        //value 0 - means not sinchronized
    }
};

//Object - type
//Remark - checkpoint already means point
const CheckPointSchema = {
    name: 'CheckPoint',
    properties: {
        type: 'int', //18 -> Leader checkpoint, 19 -> checkpoint : before; now: any point
        date: 'date', //Full date and time of checkpoint creation
        geoLocation: 'Geolocation',
        data: 'string',
        // Stringified JSON-object of field values, to ensure different form structure
        photos: 'string[]',
        //Array of paths to photos
        featureId: 'int',
        //value 0 - means not sinchronized
    }
};

//Object - container
//Remark: Expedition == Теренно издирване
const ExpeditionSchema = {
    name: 'Expedition',
    primaryKey: 'id',
    properties: {
        id: 'int',
        userRole: 'string',
        // One of: 'leader', 'member'
        expeditionName: 'string',
        leaderName: { type: 'string', optional: true },
        startDate: { type: 'date', optional: true },
        days: { type: 'int', optional: true },
        //The count of expedition days
        regionDescription: { type: 'string', optional: true },
        regionCoordinates: 'string',
        //Stringified JSON-object in form [[x1,y1],[x2,y2],[x3,y3],[x4,y4],[x1,y1]]
        regionZoom: 'double',
        regionFeatures: 'string',
        // Stringified JSON-object of all features in area defined by regionCoordinates
        dbVersionIndexAKB: 'int',
        sinchronized: 'bool',
        // Are expedition data sinchronized with (sent to) AKB-GIS-database
        tracks: 'Track[]',
        checkPoints: 'CheckPoint[]',
        photos: 'string[]', //Array of paths to photos
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
        path: 'akb_moby.realm',
        readOnly: false,
        schema: [UserCredentialsSchema, AKBTypesSchema, AKBTagsSchema, AKBPointSchema,
                  AKBdbSchema, AKBdbVersionsSchema, GeolocationSchema, TrackSchema,
                  CheckPointSchema, ExpeditionSchema],
        schemaVersion: 1,
        deleteRealmIfMigrationNeeded: true,
        //!!!По някаква причина не трие успешно базата, ако се промени схемата 
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
