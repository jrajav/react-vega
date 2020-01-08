import React from 'react';
import { vega } from 'vega-embed';
import VegaEmbed, { VegaEmbedProps } from './VegaEmbed';
import isFunction from './utils/isFunction';
import { PlainObject, View, ViewListener } from './types';
import shallowEqual from './utils/shallowEqual';
import { NOOP } from './constants';

export type VegaProps = VegaEmbedProps & {
  data?: PlainObject;
};

function updateData(view: View, name: string, value: any) {
  if (value) {
    if (isFunction(value)) {
      value(view.data(name));
    } else {
      view.change(
        name,
        vega
          .changeset()
          .remove(() => true)
          .insert(value),
      );
    }
  }
}

const EMPTY = {};

export default class Vega extends React.PureComponent<VegaProps> {
  vegaEmbed = React.createRef<VegaEmbed>();

  static defaultProps = {
    data: EMPTY,
  };

  componentDidMount() {
    this.update();
  }

  componentDidUpdate(prevProps: VegaProps) {
    if (!shallowEqual(this.props.data, prevProps.data)) {
      this.update();
    }
  }

  handleNewView: ViewListener = (view: View) => {
    this.update().then(() => {
      const { onNewView = NOOP } = this.props;
      onNewView(view);
    });
  };

  update() {
    const { data } = this.props;

    if (data) {
      const datasetNames = Object.keys(data);

      if (this.vegaEmbed.current && datasetNames.length > 0) {
        return this.vegaEmbed.current.modifyView(view => {
          datasetNames.forEach(name => {
            updateData(view, name, data[name]);
          });
          return view.runAsync();
        });
      } else {
        return Promise.resolve();
      }
    } else {
      return Promise.resolve();
    }
  }

  render() {
    const { data, ...restProps } = this.props;

    return <VegaEmbed ref={this.vegaEmbed} {...restProps} onNewView={this.handleNewView} />;
  }
}
