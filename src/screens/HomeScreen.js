import React, { Component } from 'react';
import { StyleSheet, View, NetInfo, Dimensions } from 'react-native';
import FontAwesome5Pro from 'react-native-vector-icons/FontAwesome5Pro';
import { WebView } from 'react-native-webview-messaging/WebView';
import { EventRegister } from 'react-native-event-listeners';
import { HeaderScreen } from '../components/common';
import { MainHTML } from '../components/constants';
import ActionButton from '../components/ActionButton/ActionButton';
import { realm } from '../components/RealmSchema';

const checkMark = '\u2714';
const zoomTresholdLabel = 'Елементи';
const pointsLabel = 'Точки';
const currTrackLabel = 'Текущ трак';
const saveInTrackLabel = 'Запис в трак';
const positioningLabel = 'Позициониране';
const regionVisibleLabel = 'Регион';
const regionSelectedLabel = 'Регионът е избран!';
const itemFABSIze = 40;
const disabledFABClr = '#7f7f7f';
const noSubHeaderLabel = '-';

class HomeScreen extends Component {
  constructor(props) {
     super(props);

     this.state = {
       headerTitle: 'Няма активно издирване',
       subheaderTitle: noSubHeaderLabel,
       modeRegionSelect: false,
       zoomTresholdText: `${checkMark} ${zoomTresholdLabel}`,
       pointsText: pointsLabel,
       pointsDisabled: true,
       currTrackText: currTrackLabel,
       currTrackDisabled: true,
       saveInTrackText: saveInTrackLabel,
       saveInTrackDisabled: true,
       positioningText: positioningLabel,
       regionVisibleText: regionVisibleLabel,
       regionSelected: false,
       regionSelectedText: regionSelectedLabel,
     };

     this.calledFrom = '';
     this.regionVisible = false;

     this.willFocusHandler = this.willFocusHandler.bind(this);
     this.willBlurHandler = this.willBlurHandler.bind(this);
     this.messageWebHandler = this.messageWebHandler.bind(this);
  }

  componentDidMount() {
    const { messagesChannel } = global.refToWebView;

    if (global.activeExpedition === -1) this.props.navigation.navigate('SingleExpedition');

    this.willFocusSubscription =
       this.props.navigation.addListener('willFocus', this.willFocusHandler);
    //лисънър при добиване на фокус, напр. при превключване от таб в таб

    this.willBlurSubscription =
       this.props.navigation.addListener('willBlur', this.willBlurHandler);
    //лисънър при добиване на фокус, напр. при превключване от таб в таб

    this.regionSelectRequestSubscription =
      EventRegister.addEventListener('regionSelectRequest', this.regionSelectRequestHandler);

    messagesChannel.on('json', this.messageWebHandler);
  }

  componentWillUnmount() {
    const { messagesChannel } = global.refToWebView;
    this.willFocusSubscription.remove();
    this.willBlurSubscription.remove();
    messagesChannel.removeListener('json', this.messageWebHandler);
    EventRegister.removeEventListener(this.regionSelectRequestSubscription);
  }

  onPressPointFAB() {
    //console.log('notes tapped!');
    if (!this.state.pointsDisabled) {
      global.refToWebView.emit('createPoint', { payload: {} });
    } else {
      /*
      Alert.alert('Предупреждение',
        'Не се допуска създаване на точка при неактивен бутон.');
      */
    }
  }

  onPressTilesFAB() {
    //console.log('notes tapped!');
    global.refToWebView.emit('changeTiles', { payload: {} });
  }

  onPressZoomTresholdFAB() {
    if (global.activeExpedition >= 0) {
      global.refToWebView.emit('triggerZoomTreshold', { payload: {} });
    }
  }

  onPressPointsFAB() {
    if (!this.state.pointsDisabled) {
      global.refToWebView.emit('triggerPoints', { payload: {} });
    }
  }

  onPressCurrentTrackFAB() {
    if (!this.state.currTrackDisabled) {
      global.refToWebView.emit('triggerCurrentTrack', { payload: {} });
    }
  }

  onPressSaveInTrackFAB() {
    if (!this.state.saveInTrackDisabled) {
      global.refToWebView.emit('triggerSaveInTrack', { payload: {} });
    }
  }

  onPressPositioningFAB() {
    global.refToWebView.emit('triggerGeolocationState', { payload: {} });
  }

  onPressVisibleRegion() {
    if (global.activeExpedition >= 0) {
      global.refToWebView.emit('triggerExpeditionRegoinVisibility', { payload: {} });
    }
  }

  onPressSelectRegion() {
    global.refToWebView.emit('triggerSelectedRegoinVisibility', { payload: {} });
  }

  onPressAcceptRegion() {
    if (this.state.regionSelected) {
      global.refToWebView.emit('acceptSelectedRegoin', { payload: {} });
      this.props.navigation.navigate(this.calledFrom);
    }
  }

  createPointsVisibilityText(isVisible) {
    if (isVisible) {
      this.setState({ pointsText: `${checkMark} ${pointsLabel}` });
    } else {
      this.setState({ pointsText: pointsLabel });
    }
  }

  createCurrTrackVisibilityText(isVisible) {
    if (isVisible) {
      this.setState({ currTrackText: `${checkMark} ${currTrackLabel}` });
    } else {
      this.setState({ currTrackText: currTrackLabel });
    }
  }

  createSaveInTrackText(isChecked) {
    if (isChecked) {
      this.setState({ saveInTrackText: `${checkMark} ${saveInTrackLabel}` });
    } else {
      this.setState({ saveInTrackText: saveInTrackLabel });
    }
  }

  createPositioningText(isChecked) {
    if (isChecked) {
      this.setState({ positioningText: `${checkMark} ${positioningLabel}` });
    } else {
      this.setState({ positioningText: positioningLabel });
    }
  }

  createZoomTresholdVisibilityText(tresholdActive) {
    // Видимостта на "Елементи" е различна от "Включен праг".
    // "Елементи" са видими, когато:
    //  - Не е включен прага (tresholdActive === false)
    //  - Прагът е включен && zoomLevel >= zoomTreshold
    // "Елементи" са невидими, когато:
    //  - Прагът е включен && zoomLevel < zoomTreshold
    // Така, че видимостта на елементите не се определя от това дали прагът е включен
    if (!tresholdActive) {
      this.setState({ zoomTresholdText: `${checkMark} ${zoomTresholdLabel}` });
    } else {
      this.setState({ zoomTresholdText: zoomTresholdLabel });
    }
  }

  createVisibleRegionText(isChecked) {
    if (isChecked) {
      this.setState({
        regionVisibleText: `${checkMark} ${regionVisibleLabel}`,
      });
    } else {
      this.setState({
        regionVisibleText: regionVisibleLabel,
      });
    }
    this.regionVisible = isChecked;
  }

  createSelectedRegionText(isChecked) {
    if (isChecked) {
      this.setState({
        regionSelectedText: `${checkMark} ${regionSelectedLabel}`,
      });
    } else {
      this.setState({
        regionSelectedText: regionSelectedLabel,
      });
    }
  }

  messageWebHandler(obj) {
    const jsonObject = obj;
    switch (jsonObject.command) {
      case 'set-primary-key':
      //In this case trackName, but it is the primary key in general
      //Information from WebView which is the current track
        this.setState({
          subheaderTitle: `${jsonObject.payload.trackName} (${jsonObject.payload.trackDate})`
        });
      break;
      case 'zoom-treshold-state':
        this.createZoomTresholdVisibilityText(jsonObject.payload.zoomTresholdState);
      break;
      case 'points-layer-visibility-state':
        this.createPointsVisibilityText(jsonObject.payload.visibilityState);
      break;
      case 'points-FAB-state':
          this.setState({ pointsDisabled: jsonObject.payload.pointsFABState });
      break;
      case 'currtrack-layer-visibility-state':
        //if (Object.prototype.hasOwnProperty.call(jsonObject.payload, 'visibilityState')) {
          this.createCurrTrackVisibilityText(jsonObject.payload.visibilityState);
        //}
      break;
      case 'currtrack-FAB-state':
          this.setState({ currTrackDisabled: jsonObject.payload.currTrackFABState });
      break;
      case 'saveintrack-FAB-visibility-state': //Checked or Not
          this.createSaveInTrackText(jsonObject.payload.saveInTrackFABState);
      break;
      case 'saveintrack-FAB-state': // Disabled or Not
          this.setState({ saveInTrackDisabled: jsonObject.payload.isDisabled });
      break;
      case 'positioning-FAB-visibility-state': //Checked or Not
          this.createPositioningText(jsonObject.payload.positioningFABState);
      break;
      case 'expreg-layer-visibility-state': //Checked or Not
          this.createVisibleRegionText(jsonObject.payload.visibilityState);
      break;
      case 'selreg-layer-visibility-state': //Checked or Not
          this.createSelectedRegionText(jsonObject.payload.visibilityState);
          this.setState({ regionSelected: jsonObject.payload.visibilityState })
      break;
      default:
      break;
    }
  }

  refWebView(webview) {
     //this.webview = webview;
     global.refToWebView = webview;
  }

  willFocusHandler() {
    this.dataHeader(global.activeExpedition);
  }

  willBlurHandler() {
    this.setState({ modeRegionSelect: false });
    this.calledFrom = '';
    if (this.state.regionSelected) {
      this.onPressSelectRegion();
    }
    if (this.regionVisible) {
      this.onPressVisibleRegion();
    }
    global.refToWebView.emit('setModeSelectRegion',
      { payload: { modeState: false } });
  }

  regionSelectRequestHandler = (callerString) => {
    this.setState({ modeRegionSelect: true });
    this.calledFrom = callerString;
    global.refToWebView.emit('setModeSelectRegion',
      { payload: { modeState: true } });
  }

  dataHeader(expedition) {
    //Променя съдържанието на хедъра
    if (expedition === -1) {
      this.setState({
        headerTitle: 'Няма избрано издирване',
        subheaderTitle: noSubHeaderLabel
      });
    } else {
    const selectedExpedition =
      realm.objects('Expedition').filtered(`id=${expedition.toString()}`)[0];
      this.setState({ headerTitle: selectedExpedition.expeditionName });
    }
  }

  renderHeader() {
    return (
      <HeaderScreen
        headerText={this.state.headerTitle}
        subheaderText={this.state.subheaderTitle}
      />
    );
  }

  renderFABBottom() {
    return (
      this.state.modeRegionSelect ? null : (
      <ActionButton
      active={false}
        buttonColor="rgba(231,76,60,1)"
        autoInactive={false}
        spacing={15}
        offsetX={10}
        offsetY={5}
        renderIcon={
          active => (
            active ?
            (<FontAwesome5Pro name="compass" style={styles.actionButtonIcon} solid />) :
            (<FontAwesome5Pro name="compass" style={styles.actionButtonIcon} regular />))
          }
      >
        <ActionButton.Item
          size={itemFABSIze}
          buttonColor={this.state.pointsDisabled ? disabledFABClr : '#9b59b6'}
          title="Точка от GPS"
          onPress={() => this.onPressPointFAB()}
        >
          <FontAwesome5Pro name="map-marker-alt" style={styles.actionButtonIcon} />
        </ActionButton.Item>
        <ActionButton.Item
          size={itemFABSIze}
          buttonColor={this.state.saveInTrackDisabled ? disabledFABClr : '#3498db'}
          title={this.state.saveInTrackText}
          onPress={() => { this.onPressSaveInTrackFAB(); }}
        >
          <FontAwesome5Pro name="draw-polygon" style={styles.actionButtonIcon} />
        </ActionButton.Item>
        <ActionButton.Item
          size={itemFABSIze}
          buttonColor='#1abc9c'
          title={this.state.positioningText}
          onPress={() => { this.onPressPositioningFAB(); }}
        >
          <FontAwesome5Pro name="crosshairs" style={styles.actionButtonIcon} />
        </ActionButton.Item>
      </ActionButton>
    )
    );
  }

  renderFABTop() {
    return (
      this.state.modeRegionSelect ? null : (
      <ActionButton
      verticalOrientation='down'
      buttonColor='#16a085'
      autoInactive={false}
      spacing={15}
      offsetX={10}
      offsetY={10}
      renderIcon={
        active => (
          active ?
          (<FontAwesome5Pro name="map" style={styles.actionButtonIcon} solid />) :
          (<FontAwesome5Pro name="map" style={styles.actionButtonIcon} regular />))
        }
      >
        <ActionButton.Item
          size={itemFABSIze}
          buttonColor='#2c3e50'
          title="Подложки"
          onPress={() => this.onPressTilesFAB()}
        >
          <FontAwesome5Pro name="layer-group" style={styles.actionButtonIcon} />
        </ActionButton.Item>
        <ActionButton.Item
          size={itemFABSIze}
          buttonColor={global.activeExpedition === -1 ? disabledFABClr : '#d354ff'}
          title={this.state.regionVisibleText}
          onPress={() => { this.onPressVisibleRegion(); }}
        >
          <FontAwesome5Pro name="map-marked" style={styles.actionButtonIcon} />
        </ActionButton.Item>
        <ActionButton.Item
          size={itemFABSIze}
          buttonColor={global.activeExpedition === -1 ? disabledFABClr : '#d35400'}
          title={this.state.zoomTresholdText}
          onPress={() => { this.onPressZoomTresholdFAB(); }}
        >
          <FontAwesome5Pro name="map-marked" style={styles.actionButtonIcon} />
        </ActionButton.Item>
        <ActionButton.Item
          size={itemFABSIze}
          buttonColor={global.activeExpedition === -1 ? disabledFABClr : '#9b59b6'}
          title={this.state.pointsText}
          onPress={() => { this.onPressPointsFAB(); }}
        >
          <FontAwesome5Pro name="map-marked-alt" style={styles.actionButtonIcon} />
        </ActionButton.Item>
        <ActionButton.Item
          size={itemFABSIze}
          buttonColor={this.state.currTrackDisabled ? disabledFABClr : '#3498db'}
          title={this.state.currTrackText}
          onPress={() => { this.onPressCurrentTrackFAB(); }}
        >
          <FontAwesome5Pro name="draw-polygon" style={styles.actionButtonIcon} />
        </ActionButton.Item>
      </ActionButton>)
    );
  }

  renderFABMiddle() {
    const { height } = Dimensions.get('window');
    const fabOffsetX = height / 3;
    return (
      !this.state.modeRegionSelect ? null : (
      <ActionButton
      verticalOrientation='down'
      position='right'
      buttonColor='maroon'
      autoInactive={false}
      spacing={15}
      offsetX={10}
      offsetY={fabOffsetX}
      renderIcon={
        active => (
          active ?
          (<FontAwesome5Pro name="map" style={styles.actionButtonLargeIcon} solid />) :
          (<FontAwesome5Pro name="map" style={styles.actionButtonLargeIcon} regular />))
        }
      >
        <ActionButton.Item
          size={itemFABSIze}
          buttonColor='teal'
          title={this.state.regionSelectedText}
          onPress={() => { this.onPressSelectRegion(); }}
        >
          <FontAwesome5Pro name="hand-pointer" light style={styles.actionButtonIcon} />
        </ActionButton.Item>
        <ActionButton.Item
          size={itemFABSIze}
          buttonColor={this.state.regionSelected ? 'tomato' : disabledFABClr}
          title="Потвърди региона"
          onPress={() => { this.onPressAcceptRegion(); }}
        >
          <FontAwesome5Pro name="check" regular style={styles.actionButtonIcon} />
        </ActionButton.Item>
      </ActionButton>)
    );
  }

  render() {
    return (
      <View style={styles.container}>
          {this.renderHeader()}
        <View style={{ flex: 1 }}>
          <WebView
              ref={this.refWebView}
              //replace source with MainHTML constant
              //source={require('../../dist/index.html')}
              source={MainHTML}
              onNavigationStateChange={(e) => {
                if (!e.loading) {
                  global.refToWebView.emit('transferAccessToken',
                    { payload: { accessToken: global.ct } });

                  //Може да се преработи през heder който също използва NetInfo
                  let internet;

                  const connected = () => {
                    const connectionInfo = NetInfo.getConnectionInfo();
                    //Return true, if there is internet connection
                    return !(connectionInfo.type === 'none' || connectionInfo.type === 'unknown');
                  };

                  if (connected()) {
                    internet = { available: true };
                  } else {
                    internet = { available: false };
                  }

                  global.refToWebView.emit('internetConnectionChanged', { internet });
                }
              }}
          />
          { this.renderFABTop() }
          { this.renderFABMiddle() }
          { this.renderFABBottom() }
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  actionButtonIcon: {
    fontSize: 20,
    height: 22,
    color: 'white',
  },
  actionButtonLargeIcon: {
    fontSize: 30,
    height: 32,
    color: 'white',
  },
  container: {
     flex: 1,
     backgroundColor: 'ghostwhite',
     margin: 0,
     padding: 0
   },
});

export { HomeScreen };
