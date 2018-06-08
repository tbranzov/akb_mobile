import { createStackNavigator } from 'react-navigation';
import { ExpeditionList, ExpeditionDetails } from './';

const stackExpeditions = createStackNavigator({
  Expeditions: ExpeditionList,
  Details: ExpeditionDetails,
});

export { stackExpeditions };
