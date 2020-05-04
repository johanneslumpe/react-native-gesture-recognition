'use strict';
import PropTypes from 'prop-types';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View, PanResponder } from 'react-native';
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

  function Swipeable(props) {
    const {
      onSwipeBegin,
      onSwipe,
      onSwipeEnd,
      swipeDecoratorStyle,
      disabled,
      ...baseComponentProps
    } = props;

    const propsRef = useRef(props);
    const swipeDetected = useRef(false);
    const velocityProp = useRef(null);
    const distanceProp = useRef(null);
    const swipeDirection = useRef(null);

    const [swipe, setSwipe] = useState(() => ({ direction: null, distance: 0, velocity: 0}));

    const handleTerminationAndRelease = useCallback(() => {
      if (swipeDetected.current) {
        const { onSwipeEnd } = propsRef.current;
        onSwipeEnd && onSwipeEnd({ // eslint-disable-line no-unused-expressions
          direction: swipeDirection.current
        });
      }

      swipeDetected.current = false;
      velocityProp.current = null;
      distanceProp.current = null;
      swipeDirection.current = null;
    }, []);

    const [panResponder] = useState(() =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          return shouldRespondToGesture(evt, gestureState);
        },

        onPanResponderMove: (evt, gestureState) => {
          const { dx, dy, vx, vy } = gestureState;
          const { onSwipeBegin, onSwipe } = propsRef.current;

          if (!continuous && swipeDetected.current) {
            return;
          }

          let initialDetection = false;
          let validHorizontal = false;
          let validVertical = false;

          if (!swipeDetected.current) {
            initialDetection = true;

            validHorizontal = checkHorizontal && isValidSwipe(
              vx, dy, initialVelocityThreshold, verticalThreshold
            );
            validVertical = checkVertical && isValidSwipe(
              vy, dx, initialVelocityThreshold, horizontalThreshold
            );

            if (validHorizontal) {
              velocityProp.current = 'vx';
              distanceProp.current = 'dx';

              if ((horizontal || left) && dx < 0) {
                swipeDirection.current = directions.SWIPE_LEFT;
              } else if ((horizontal || right) && dx > 0) {
                swipeDirection.current = directions.SWIPE_RIGHT;
              }
            } else if (validVertical) {
              velocityProp.current = 'vy';
              distanceProp.current = 'dy';

              if ((vertical || up) && dy < 0) {
                swipeDirection.current = directions.SWIPE_UP;
              } else if ((vertical || down) && dy > 0) {
                swipeDirection.current = directions.SWIPE_DOWN;
              }
            }

            if (swipeDirection.current) {
              swipeDetected.current = true;
            }
          }

          if (swipeDetected.current) {
            const distance = gestureState[distanceProp.current];
            const velocity = gestureState[velocityProp.current];

            const swipeState = {
              direction: swipeDirection.current,
              distance,
              velocity
            };

            if (initialDetection) {
              onSwipeBegin && onSwipeBegin(swipeState); // eslint-disable-line no-unused-expressions
            } else {
              onSwipe && onSwipe(swipeState); // eslint-disable-line no-unused-expressions
            }

            if (setGestureState) setSwipe(swipeState)
          }
        },

        onPanResponderTerminationRequest: () => true,
        onPanResponderTerminate: handleTerminationAndRelease,
        onPanResponderRelease: handleTerminationAndRelease
      })
    );

    useEffect(() => {
      propsRef.current = props;
    });

    const style = [
      {alignSelf: 'flex-start'},
      swipeDecoratorStyle
    ];

    return (
      <View {...(!disabled && panResponder.panHandlers)} style={style}>
        <BaseComponent {...baseComponentProps} {...setGestureState && { swipe }} />
      </View>
    );
  }
  Swipeable.propTypes = propTypes;
  const MemoizedSwipeable = memo(Swipeable);
  MemoizedSwipeable.propTypes = propTypes;
  return MemoizedSwipeable;
};

swipeable.directions = directions;

export default swipeable;
