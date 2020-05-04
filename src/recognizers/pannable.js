'use strict';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import { View, PanResponder, Animated } from 'react-native';

const initialState = {
  absoluteChangeX: 0,
  absoluteChangeY: 0,
  changeX: 0,
  changeY: 0
};

const propTypes = {
  onPanBegin: PropTypes.func,
  onPan: PropTypes.func,
  onPanEnd: PropTypes.func,
  resetPan: PropTypes.bool,
  panDecoratorStyle: PropTypes.any,
  disabled: PropTypes.bool
};

export default ({
  setGestureState = true
} = {}) => BaseComponent => {
  return class extends Component {

    static propTypes = propTypes

    constructor(props, context) {
      super(props, context);

      this.lastX = 0;
      this.lastY = 0;
      this.absoluteChangeY = 0;
      this.absoluteChangeX = 0;

      this.state = initialState;
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.resetPan) {
        this.lastX = 0;
        this.lastY = 0;
        this.absoluteChangeY = 0;
        this.absoluteChangeX = 0;

        if (setGestureState) {
          this.setState(initialState);
        }
      }
    }

    componentWillMount() {
      this.panResponder = PanResponder.create({

        onStartShouldSetPanResponder: ({ nativeEvent: { touches } }, { x0, y0 }) => {
          const shouldSet = touches.length === 1;

          if (shouldSet) {
            const { onPanBegin } = this.props;
            onPanBegin && onPanBegin({ // eslint-disable-line no-unused-expressions
              originX: x0,
              originY: y0
            });
          }

          return shouldSet;
        },

        onMoveShouldSetPanResponder: ({ nativeEvent: { touches } }) => {
          return touches.length === 1;
        },

        onPanResponderMove: (evt, { dx, dy }) => {
          const { onPan } = this.props;
          const panState = {
            absoluteChangeX: this.lastX + dx,
            absoluteChangeY: this.lastY + dy,
            changeX: dx,
            changeY: dy
          };

          onPan && onPan(panState); // eslint-disable-line no-unused-expressions

          this.absoluteChangeX = panState.absoluteChangeX;
          this.absoluteChangeY = panState.absoluteChangeY;
          if (setGestureState) {
            this.setState(panState);
          }
        },

        onPanResponderTerminationRequest: () => true,
        onPanResponderTerminate: this.handlePanResponderRelease,
        onPanResponderRelease: this.handlePanResponderRelease
      });
    }

    handlePanResponderRelease = () => {
      const { onPanEnd } = this.props;
      this.lastX = this.absoluteChangeX;
      this.lastY = this.absoluteChangeY;
      onPanEnd && onPanEnd(); // eslint-disable-line no-unused-expressions
    }

    render() {
      const {
        disabled,
        onPanBegin,
        onPan,
        onPanEnd,
        resetPan,
        panDecoratorStyle,
        ...props
      } = this.props;

      const style = [
        {alignSelf: 'flex-start'},
        panDecoratorStyle,
      ];

      return (
        <Animated.View {...(disabled ? {} : this.panResponder.panHandlers)} style={style}>
          <BaseComponent {...props} {...this.state} />
        </Animated.View>
      );
    }
  };
};
