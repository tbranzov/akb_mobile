import React, { PureComponent } from 'react';
import { FlatList } from 'react-native';
import { FlatListCard } from './FlatListCard';

class MultiSelectList extends PureComponent {
  state = { selected: (new Map(): Map<string, boolean>) };

  onPressListItem = (id: string) => {
    // updater functions are preferred for transactional updates
    this.setState((state) => {
      // copy the map rather than modifying state.
      const selected = new Map(state.selected);
      selected.set(id, !selected.get(id)); // toggle
      return { selected };
    });
  };

  renderListItem = ({ item, index }) => (
    <FlatListCard
      id={index}
      onPressItem={this.onPressListItem}
      selected={!!this.state.selected.get(index)}
      track={item}
    />
  );

  render() {
    return (
      <FlatList
        horizontal
        data={this.props.data}
        extraData={this.state}
        keyExtractor={(item, index) => `list-item-${index}`}
        renderItem={this.renderListItem}
      />
    );
  }
}

export { MultiSelectList };
