'use strict';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import { View, PanResponder, Animated } from 'react-native';
import isValidSwipe from '../utils/isValidSwipe';

const directions = {
  SWIPE_UP: 'SWIPE_UP',
  SWIPE_DOWN: 'SWIPE_DOWN',
  SWIPE_LEFT: 'SWIPE_LEFT',
  SWIPE_RIGHT: 'SWIPE_RIGHT'
};

const propTypes = {
  disabled: PropTypes.bool,
  onSwipeBegin: PropTypes.func,
  onSwipe: PropTypes.func,
  onSwipeEnd: PropTypes.func,
  swipeDecoratorStyle: PropTypes.any
};

const swipeable = ({
  horizontal = false,
  vertical = false,
  left = false,
  right = false,
  up = false,
  down = false,
  continuous = true,
  initialVelocityThreshold = 0.7,
  verticalThreshold = 10,
  horizontalThreshold = 10,
  setGestureState = true
} = {}) => BaseComponent => {

  const checkHorizontal = horizontal || (left || right);
  const checkVertical = vertical || (up || down);
  // TODO: that's a rip-off from onPanResponderMove, we should
  // extract a generic approach
  const shouldRespondToGesture = (evt, gestureState) => {
    const { dx, dy, vx, vy } = gestureState;

    const validHorizontal = checkHorizontal && isValidSwipe(
      vx, dy, initialVelocityThreshold, verticalThreshold
    );
    const validVertical = checkVertical && isValidSwipe(
      vy, dx, initialVelocityThreshold, horizontalThreshold
    );

    if (validHorizontal) {
      if ((horizontal || left) && dx < 0) {
        return true;
      } else if ((horizontal || right) && dx > 0) {
        return true;
      }
    } else if (validVertical) {
      if ((vertical || up) && dy < 0) {
        return true;
      } else if ((vertical || down) && dy > 0) {
        return true;
      }
    }

    return false;
  }

  return class extends Component {

    static propTypes = propTypes;

    constructor(props, context) {
      super(props, context);

      this.state = {
        swipe: {
          direction: null,
          distance: 0,
          velocity: 0
        }
      };

      this.swipeDetected = false;
      this.velocityProp = null;
      this.distanceProp = null;
      this.swipeDirection = null;
    }

    componentWillMount() {
      this.panResponder = PanResponder.create({

        onMoveShouldSetPanResponder: (evt, gestureState) => {
          return shouldRespondToGesture(evt, gestureState);
        },

        onPanResponderMove: (evt, gestureState) => {
          const {dx, dy, vx, vy} = gestureState;
          const { onSwipeBegin, onSwipe } = this.props;

          if (!continuous && this.swipeDetected) {
            return;
          }

          let initialDetection = false;
          let validHorizontal = false;
          let validVertical = false;

          if (!this.swipeDetected) {
            initialDetection = true;

            validHorizontal = checkHorizontal && isValidSwipe(
              vx, dy, initialVelocityThreshold, verticalThreshold
            );
            validVertical = checkVertical && isValidSwipe(
              vy, dx, initialVelocityThreshold, horizontalThreshold
            );

            if (validHorizontal) {
              this.velocityProp = 'vx';
              this.distanceProp = 'dx';

              if ((horizontal || left) && dx < 0) {
                this.swipeDirection = directions.SWIPE_LEFT;
              } else if ((horizontal || right) && dx > 0) {
                this.swipeDirection = directions.SWIPE_RIGHT;
              }
            } else if (validVertical) {
              this.velocityProp = 'vy';
              this.distanceProp = 'dy';

              if ((vertical || up) && dy < 0) {
                this.swipeDirection = directions.SWIPE_UP;
              } else if ((vertical || down) && dy > 0) {
                this.swipeDirection = directions.SWIPE_DOWN;
              }
            }

            if (this.swipeDirection) {
              this.swipeDetected = true;
            }
          }

          if (this.swipeDetected) {
            const distance = gestureState[this.distanceProp];
            const velocity = gestureState[this.velocityProp];

            const swipeState = {
              direction: this.swipeDirection,
              distance,
              velocity
            };

            if (initialDetection) {
              onSwipeBegin && onSwipeBegin(swipeState); // eslint-disable-line no-unused-expressions
            } else {
              onSwipe && onSwipe(swipeState); // eslint-disable-line no-unused-expressions
            }

            if (setGestureState) {
              this.setState({
                swipe: swipeState
              });
            }
          }
        },

        onPanResponderTerminationRequest: () => true,
        onPanResponderTerminate: this.handleTerminationAndRelease,
        onPanResponderRelease: this.handleTerminationAndRelease
      });
    }

    handleTerminationAndRelease = () => {
      if (this.swipeDetected) {
        const { onSwipeEnd } = this.props;
        onSwipeEnd && onSwipeEnd({ // eslint-disable-line no-unused-expressions
          direction: this.swipeDirection
        });
      }

      this.swipeDetected = false;
      this.velocityProp = null;
      this.distanceProp = null;
      this.swipeDirection = null;
    }

    render() {
      const {
        onSwipeBegin,
        onSwipe,
        onSwipeEnd,
        swipeDecoratorStyle,
        disabled,
        ...props
      } = this.props;

      const style = [
        {alignSelf: 'flex-start'},
        swipeDecoratorStyle
      ];

      const state = setGestureState ? this.state : null;

      return (
        <View {...(disabled ? {} : this.panResponder.panHandlers)} style={style}>
          <BaseComponent {...props} {...state} />
        </View>
      );
    }
  };
};

swipeable.directions = directions;

export default swipeable;
